from fastapi import APIRouter, Depends, HTTPException, Query
from uuid import UUID
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List
import uuid

from api.database import get_db
from api.models import Persona
from api.schemas import PersonaCreate, PersonaUpdate, PersonaResponse, VerifyResponse
from api.auth import get_current_active_user
import os

router = APIRouter()

@router.get("/", response_model=List[PersonaResponse])
async def list_personas(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """List all personas for the current user."""
    personas = db.query(Persona).filter(Persona.owner_id == current_user.id).all()
    return personas

@router.post("/", response_model=PersonaResponse)
async def create_persona(
    persona: PersonaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Create a new persona."""
    # Ensure JSON-safe serialization for nested Pydantic models (e.g., ReferenceStyle)
    payload = persona.model_dump(mode="json")
    db_persona = Persona(
        id=str(uuid.uuid4()),
        **payload,
        owner_id=current_user.id
    )
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona


@router.get("/verify", response_model=VerifyResponse)
async def verify_authorization(
    flow_id: str = Query(..., description="Arcade authorization flow_id from the redirect query string"),
    redirect: bool = Query(False, description="Redirect to Arcade's next_uri if available"),
    persona_id: str | None = Query(None, description="Optional persona_id fallback if cookie not available"),
    integration_key: str | None = Query(None, description="Optional integration key to mark connection (e.g., 'twitter')"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """General verification endpoint for Arcade custom user verifier.

    - Ensures only authenticated users can verify
    - Confirms the user's identity to Arcade using the provided flow_id
    - Optionally redirects to Arcade's next_uri; otherwise returns JSON
    """
    try:
        from arcadepy import AsyncArcade

        client = AsyncArcade()  # Uses ARCADE_API_KEY from environment

        if not flow_id:
            raise HTTPException(status_code=400, detail="Missing required parameters: flow_id")
        if not persona_id:
            raise HTTPException(status_code=400, detail="Missing required parameters: persona_id")

        # Validate persona ownership if a persona_id is provided
        resolved_persona_id: str | None = None
        if persona_id == "admin":
            resolved_persona_id = os.getenv("USER_ID")
            print(f"DEBUG: Using user_id={resolved_persona_id} for admin persona")
        else:
            from api.models import Persona
            persona = db.query(Persona).filter(
                Persona.id == persona_id,
                Persona.owner_id == current_user.id,
            ).first()
            if persona:
                resolved_persona_id = persona.id

        # Confirm the user with Arcade using the authenticated user's id
        result = await client.auth.confirm_user(
            flow_id=flow_id,
            user_id=resolved_persona_id,
        )

        # If redirect requested and next_uri is provided by Arcade, optionally append persona_id and redirect
        if redirect and getattr(result, "next_uri", None):
            next_url = result.next_uri
            if resolved_persona_id:
                try:
                    from urllib.parse import urlencode, urlparse, parse_qsl, urlunparse
                    parsed = urlparse(next_url)
                    query = dict(parse_qsl(parsed.query))
                    query["persona_id"] = resolved_persona_id
                    next_url = urlunparse(parsed._replace(query=urlencode(query)))
                except Exception:
                    pass

            return RedirectResponse(url=next_url, status_code=303)

        # Otherwise, wait for completion and return a JSON response
        print(f"DEBUG: Waiting for completion of auth_id={result.auth_id}")
        auth_response = await client.auth.wait_for_completion(result.auth_id)

        if getattr(auth_response, "status", None) == "completed":
            print("DEBUG: Auth response status is completed")
            # If an integration_key is provided, mark persona as connected for that integration
            try:
                print(f"DEBUG: Marking persona as connected for integration_key={integration_key}")
                if resolved_persona_id and integration_key:
                    from api.models import Integration, PersonaIntegration
                    # Find integration by key
                    integration = db.query(Integration).filter(Integration.key == integration_key).first()
                    if integration:
                        # Ensure a PersonaIntegration exists and mark connected
                        link = db.query(PersonaIntegration).filter(
                            PersonaIntegration.persona_id == resolved_persona_id,
                            PersonaIntegration.integration_id == integration.id,
                        ).first()
                        if not link:
                            import uuid as _uuid
                            link = PersonaIntegration(
                                id=str(_uuid.uuid4()),
                                persona_id=resolved_persona_id,
                                integration_id=integration.id,
                                connected=True,
                                meta={"auth_id": result.auth_id},
                            )
                            db.add(link)
                        else:
                            link.connected = True
                            link.meta = {"auth_id": result.auth_id}
                        db.commit()
            except Exception:
                # Do not fail verification if recording the connection fails
                pass

            print(f"DEBUG: Result: {result}")
            return VerifyResponse(
                success=True,
                auth_id=result.auth_id,
                next_uri=getattr(result, "next_uri", None),
                status="completed",
                message="Thanks for authorizing!",
                persona_id=resolved_persona_id,
            )
        else:
            return VerifyResponse(
                success=False,
                auth_id=result.auth_id,
                next_uri=getattr(result, "next_uri", None),
                status=getattr(auth_response, "status", None),
                message="Something went wrong. Please try again.",
                persona_id=resolved_persona_id,
            )
    except HTTPException:
        raise
    except Exception as error:
        # Surface useful details while keeping consistent API shape
        raise HTTPException(status_code=400, detail=f"An error occurred during verification: {str(error)}")


@router.get("/{persona_id}", response_model=PersonaResponse)
async def get_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get a specific persona."""
    persona = db.query(Persona).filter(
        Persona.id == str(persona_id),
        Persona.owner_id == current_user.id
    ).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    return persona


@router.post("/{persona_id}/reference_style", response_model=PersonaResponse)
async def update_persona_reference_style(
    persona_id: UUID,
    persona_update: PersonaUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Update a persona."""
    return await update_persona(persona_id, persona_update, db, current_user)


@router.put("/{persona_id}", response_model=PersonaResponse)
async def update_persona(
    persona_id: UUID,
    persona_update: PersonaUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Update a persona."""
    persona = db.query(Persona).filter(
        Persona.id == str(persona_id),
        Persona.owner_id == current_user.id
    ).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")

    # Update only provided fields
    # Use JSON-safe dump to handle HttpUrl/enums inside nested models
    update_data = persona_update.model_dump(exclude_unset=True, mode="json")
    for field, value in update_data.items():
        setattr(persona, field, value)

    db.commit()
    db.refresh(persona)
    return persona


@router.delete("/{persona_id}")
async def delete_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Delete a persona."""
    persona = db.query(Persona).filter(
        Persona.id == str(persona_id),
        Persona.owner_id == current_user.id
    ).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")

    db.delete(persona)
    db.commit()
    return {"message": "Persona deleted successfully"}
