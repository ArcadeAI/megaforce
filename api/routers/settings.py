from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
import uuid

from api.database import get_db
from api.auth import get_current_active_user
from api.models import UserRole, AppSetting
from api.schemas import AppSettings, UpdateAppSettings, TwitterConnectResponse
from zoneinfo import ZoneInfo
import os

router = APIRouter()


def _get_singleton_settings(db: Session) -> AppSetting:
    settings = db.query(AppSetting).first()
    if not settings:
        settings = AppSetting(id=str(uuid.uuid4()), timezone="UTC")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


async def get_current_admin_user(current_user = Depends(get_current_active_user)):
    print(f"DEBUG: Current user: {current_user}")
    print(f"DEBUG: Current user role: {current_user.role}")
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user


@router.get("/", response_model=AppSettings)
def get_settings(db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    settings = _get_singleton_settings(db)
    return settings


@router.put("/", response_model=AppSettings)
def update_settings(update: UpdateAppSettings, db: Session = Depends(get_db), current_user = Depends(get_current_admin_user)):
    if not update.timezone or not isinstance(update.timezone, str):
        raise HTTPException(status_code=400, detail="Invalid timezone")
    # Validate timezone string
    try:
        _ = ZoneInfo(update.timezone)
    except Exception:
        raise HTTPException(status_code=400, detail="Unknown timezone")
    settings = _get_singleton_settings(db)
    settings.timezone = update.timezone
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


@router.post("/twitter/connect", response_model=TwitterConnectResponse)
async def connect_admin_twitter_account(
    response: Response,
    current_user = Depends(get_current_admin_user)
):
    """Initiate Twitter/X OAuth via Arcade for the admin account.

    Mirrors the persona connect flow but associates the authorization with a special
    fixed admin identifier so it can be used for searches. This does not modify
    any posting behavior.
    """
    try:
        from arcadepy import AsyncArcade

        client = AsyncArcade()
        # Use a stable identifier for the admin account linkage. Using the admin user id.
        admin_user_id = os.getenv("USER_ID")
        auth_request = await client.tools.authorize(
            tool_name="X.PostTweet",
            user_id=admin_user_id
        )

        if auth_request.status != "completed":
            # Store admin flag in a short-lived cookie if needed by verifier later
            try:
                import os as _os
                cookie_secure = _os.getenv("COOKIE_SECURE", "false").lower() == "true"
            except Exception:
                cookie_secure = False
            cookie_samesite = "none" if cookie_secure else "lax"
            response.set_cookie(
                key="arcade_auth_admin",
                value="true",
                httponly=True,
                max_age=600,
                samesite=cookie_samesite,
                secure=cookie_secure,
            )

            return TwitterConnectResponse(
                oauth_url=auth_request.url,
                state=auth_request.status,
                message="Use oauth_url to connect the admin Twitter account."
            )
        else:
            return TwitterConnectResponse(
                oauth_url="",
                state="completed",
                message="Admin Twitter account is already connected."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate admin Twitter connect: {str(e)}")


