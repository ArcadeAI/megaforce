from dotenv import load_dotenv
from fastapi import Request, Response, HTTPException, Depends
from workos import WorkOSClient
from api.schemas import WorkOSUser
from api.models import User
from api.database import get_db
from sqlalchemy.orm import Session
import logging
import os

logger = logging.getLogger(__name__)

load_dotenv()

workos = WorkOSClient(
    api_key=os.getenv("WORKOS_API_KEY"),
    client_id=os.getenv("WORKOS_CLIENT_ID")
)

cookie_password = os.getenv("WORKOS_COOKIE_PASSWORD")



def _structure_user(session) -> WorkOSUser:
    raw_user = getattr(session, "user", None)
    if raw_user is None:
        possible_data = getattr(session, "data", None)
        if isinstance(possible_data, dict):
            raw_user = possible_data.get("user")

    if raw_user is None:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Normalize to our `WorkOSUser` schema
    # WorkOS models expose attributes directly; also support dict-like access
    user_payload = {
        "object": getattr(raw_user, "object", getattr(raw_user, "get", lambda k, d=None: d)("object")),
        "id": getattr(raw_user, "id", getattr(raw_user, "get", lambda k, d=None: d)("id")),
        "email": getattr(raw_user, "email", getattr(raw_user, "get", lambda k, d=None: d)("email")),
        "first_name": getattr(raw_user, "first_name", getattr(raw_user, "get", lambda k, d=None: d)("first_name")),
        "last_name": getattr(raw_user, "last_name", getattr(raw_user, "get", lambda k, d=None: d)("last_name")),
        "email_verified": getattr(raw_user, "email_verified", getattr(raw_user, "get", lambda k, d=None: d)("email_verified")),
        "profile_picture_url": getattr(raw_user, "profile_picture_url", getattr(raw_user, "get", lambda k, d=None: d)("profile_picture_url")),
        "last_sign_in_at": getattr(raw_user, "last_sign_in_at", getattr(raw_user, "get", lambda k, d=None: d)("last_sign_in_at")),
        "created_at": getattr(raw_user, "created_at", getattr(raw_user, "get", lambda k, d=None: d)("created_at")),
        "updated_at": getattr(raw_user, "updated_at", getattr(raw_user, "get", lambda k, d=None: d)("updated_at")),
        "external_id": getattr(raw_user, "external_id", getattr(raw_user, "get", lambda k, d=None: d)("external_id")),
        "metadata": getattr(raw_user, "metadata", getattr(raw_user, "get", lambda k, d=None: d)("metadata")) or {},
    }

    # Let Pydantic handle validation/coercion of datetime fields
    return WorkOSUser(**user_payload)



async def get_current_user(request: Request, response: Response) -> WorkOSUser:
    """Get the current user from the request."""
    session = await get_auth(request, response)
    return _structure_user(session)


async def get_current_active_user(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> User:
    """Get the current active user from the request."""
    user = await get_current_user(request, response)
    user = db.query(User).filter(User.id == user.id).first()
    return user


async def get_auth(request: Request, response: Response):
    """Validate the WorkOS session from cookie and return an authenticated response.

    On failure, raise 401 instead of redirecting so API consumers can handle auth.
    On successful refresh, update the cookie on the provided Response.
    """
    try:
        session = workos.user_management.load_sealed_session(
            sealed_session=request.cookies.get("workos_session"),
            cookie_password=cookie_password,
        )
    except Exception as e:
        logger.error(f"Failed to load sealed session: {str(e)}")
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        auth_response = session.authenticate()
        if getattr(auth_response, "authenticated", False):
            return auth_response

        # Attempt to refresh if not authenticated
        refreshed = session.refresh()
        if not refreshed.authenticated:
            raise HTTPException(status_code=401, detail="Unauthorized")

        # Update cookie with refreshed sealed session
        sealed_session = refreshed.sealed_session
        if sealed_session:
            response.set_cookie(
                key="workos_session",
                value=sealed_session,
                secure=True,
                httponly=True,
                samesite="lax",
            )
        return refreshed
    except HTTPException:
        # Bubble up explicit 401s
        raise
    except Exception as e:
        logger.error(f"Failed to authenticate/refresh session: {str(e)}")
        raise HTTPException(status_code=401, detail="Unauthorized")
