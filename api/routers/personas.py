from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from api.database import get_db
from api.models import Persona
from api.schemas import PersonaCreate, PersonaUpdate, PersonaResponse
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

@router.get("/{persona_id}", response_model=PersonaResponse)
async def get_persona(
    persona_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific persona."""
    persona = db.query(Persona).filter(
        Persona.id == persona_id,
        Persona.owner_id == current_user.id
    ).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    return persona

@router.put("/{persona_id}", response_model=PersonaResponse)
async def update_persona(
    persona_id: str,
    persona_update: PersonaUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a persona."""
    persona = db.query(Persona).filter(
        Persona.id == persona_id,
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
    persona_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a persona."""
    persona = db.query(Persona).filter(
        Persona.id == persona_id,
        Persona.owner_id == current_user.id
    ).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    
    db.delete(persona)
    db.commit()
    return {"message": "Persona deleted successfully"}
