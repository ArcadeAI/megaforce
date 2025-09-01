from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse

from api.schemas import Token, MeResponse
from api.models import User, UserRole
from api.database import get_db
from api.auth import get_auth, get_current_user

from dotenv import load_dotenv
from workos import WorkOSClient

import logging
import os


logger = logging.getLogger(__name__)

load_dotenv()

workos = WorkOSClient(
    api_key=os.getenv("WORKOS_API_KEY"),
    client_id=os.getenv("WORKOS_CLIENT_ID")
)

cookie_password = os.getenv("WORKOS_COOKIE_PASSWORD")

print(f"DEBUG: cookie_password: {cookie_password}")

router = APIRouter()

@router.get("/login", response_model=Token)
async def login():
    """Login and get access token."""
    auth_url = workos.user_management.get_authorization_url(
        provider="authkit",
        redirect_uri=os.getenv("WORKOS_REDIRECT_URI")
    )
    return RedirectResponse(auth_url)

@router.get("/callback")
async def callback(code: str, db = Depends(get_db)):
    """Callback from WorkOS."""
    try:
        auth_response = workos.user_management.authenticate_with_code(
            code=code,
            session={
                "seal_session": True,
                "cookie_password": cookie_password
            }
        )

        # Ensure a corresponding DB user exists
        workos_user_id = None
        try:
            raw_user = getattr(auth_response, "user", None)
            if raw_user is None:
                session = workos.user_management.load_sealed_session(
                    sealed_session=auth_response.sealed_session,
                    cookie_password=cookie_password,
                )
                raw_user = getattr(session, "user", None) or getattr(session, "data", {}).get("user")
            if raw_user is not None:
                workos_user_id = getattr(raw_user, "id", None)
                if workos_user_id is None and isinstance(raw_user, dict):
                    workos_user_id = raw_user.get("id")
        except Exception:
            workos_user_id = None

        if workos_user_id:
            existing = db.query(User).filter(User.id == workos_user_id).first()
            if not existing:
                db.add(User(id=workos_user_id, role=UserRole.USER))
                db.commit()

        response = RedirectResponse(url="/")


        # store the session in a cookie
        response.set_cookie(
            key="workos_session",
            value=auth_response.sealed_session,
            secure=True,
            httponly=True,
            max_age=3600,
            samesite="lax",
        )

        return response


    except Exception as e:
        logger.error(f"Failed to authenticate with WorkOS: {str(e)}")
        return RedirectResponse(url="/")


@router.get("/logout")
async def logout(request: Request):
    """Logout and remove session cookie."""
    from pprint import pprint
    print(f"DEBUG: Request: {pprint(request)}")
    sealed_session = request.cookies.get("workos_session")

    # Where to land after logout (optional)
    return_to = os.getenv("WORKOS_LOGOUT_REDIRECT_URI", "/")

    # Always clear our cookie client-side, even if we can't call WorkOS logout
    fallback_response = RedirectResponse(url=return_to)
    fallback_response.delete_cookie("workos_session")

    if not sealed_session:
        # No cookie found; nothing to invalidate upstream. Just clear and return.
        return fallback_response

    try:
        session = workos.user_management.load_sealed_session(
            sealed_session=sealed_session,
            cookie_password=cookie_password,
        )
        url = session.get_logout_url(return_to=return_to)
        response = RedirectResponse(url=url)
        response.delete_cookie("workos_session")
        return response
    except Exception:
        # If anything goes wrong, fall back to local cookie clear
        return fallback_response


@router.get("/me", response_model=MeResponse)
async def me(user = Depends(get_current_user)):
    """Return current authenticated user info from WorkOS session, no org info."""
    try:
        # Extract the user object from WorkOS session/auth response
        return MeResponse(authenticated=True, user=user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to extract user from session: {str(e)}")
        raise HTTPException(status_code=401, detail="Unauthorized")