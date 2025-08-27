from fastapi import APIRouter, Depends, HTTPException, Query
from uuid import UUID
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List
import uuid

from api.database import get_db
from api.models import Persona
from api.schemas import PersonaCreate, PersonaUpdate, PersonaResponse, VerifyResponse
from api.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[PersonaResponse])
async def list_personas(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all personas for the current user."""
    personas = db.query(Persona).filter(Persona.owner_id == current_user.id).all()
    return personas

@router.post("/", response_model=PersonaResponse)
async def create_persona(
    persona: PersonaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new persona."""
    db_persona = Persona(
        id=str(uuid.uuid4()),
        **persona.dict(),
        owner_id=current_user.id
    )
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona

@router.get("/verify", response_model=VerifyResponse)
async def verify_authorization(
    flow_id: str = Query(..., description="Arcade authorization flow_id from the redirect query string"),
    redirect: bool = Query(True, description="Redirect to Arcade's next_uri if available"),
    persona_id: str | None = Query(None, description="Optional persona_id fallback if cookie not available"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
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
        auth_response = await client.auth.wait_for_completion(result.auth_id)

        if getattr(auth_response, "status", None) == "completed":
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
    current_user = Depends(get_current_user)
):
    """Get a specific persona."""
    persona = db.query(Persona).filter(
        Persona.id == str(persona_id),
        Persona.owner_id == current_user.id
    ).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    return persona

@router.put("/{persona_id}", response_model=PersonaResponse)
async def update_persona(
    persona_id: UUID,
    persona_update: PersonaUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a persona."""
    persona = db.query(Persona).filter(
        Persona.id == str(persona_id),
        Persona.owner_id == current_user.id
    ).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    
    # Update only provided fields
    update_data = persona_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(persona, field, value)
    
    db.commit()
    db.refresh(persona)
    return persona

@router.delete("/{persona_id}")
async def delete_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
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
