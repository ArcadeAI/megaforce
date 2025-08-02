from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from api.database import get_db
from api.models import StyleReference, Persona
from api.schemas import StyleReferenceCreate, StyleReferenceResponse
from api.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[StyleReferenceResponse])
async def list_style_references(
    persona_id: str = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all style references for the current user, optionally filtered by persona."""
    query = db.query(StyleReference).join(Persona).filter(Persona.owner_id == current_user.id)
    
    if persona_id:
        query = query.filter(StyleReference.persona_id == persona_id)
    
    style_references = query.all()
    return style_references

@router.post("/", response_model=StyleReferenceResponse)
async def create_style_reference(
    style_reference: StyleReferenceCreate,
    persona_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new style reference for a persona."""
    # Verify the persona belongs to the current user
    persona = db.query(Persona).filter(
        Persona.id == persona_id,
        Persona.owner_id == current_user.id
    ).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    
    db_style_reference = StyleReference(
        id=str(uuid.uuid4()),
        persona_id=persona_id,
        **style_reference.dict()
    )
    db.add(db_style_reference)
    db.commit()
    db.refresh(db_style_reference)
    return db_style_reference

@router.get("/{style_reference_id}", response_model=StyleReferenceResponse)
async def get_style_reference(
    style_reference_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific style reference."""
    style_reference = db.query(StyleReference).join(Persona).filter(
        StyleReference.id == style_reference_id,
        Persona.owner_id == current_user.id
    ).first()
    if not style_reference:
        raise HTTPException(status_code=404, detail="Style reference not found")
    return style_reference

@router.put("/{style_reference_id}", response_model=StyleReferenceResponse)
async def update_style_reference(
    style_reference_id: str,
    style_reference_update: StyleReferenceCreate,  # Reuse create schema for updates
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a style reference."""
    style_reference = db.query(StyleReference).join(Persona).filter(
        StyleReference.id == style_reference_id,
        Persona.owner_id == current_user.id
    ).first()
    if not style_reference:
        raise HTTPException(status_code=404, detail="Style reference not found")
    
    # Update fields
    update_data = style_reference_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(style_reference, field, value)
    
    db.commit()
    db.refresh(style_reference)
    return style_reference

@router.delete("/{style_reference_id}")
async def delete_style_reference(
    style_reference_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a style reference."""
    style_reference = db.query(StyleReference).join(Persona).filter(
        StyleReference.id == style_reference_id,
        Persona.owner_id == current_user.id
    ).first()
    if not style_reference:
        raise HTTPException(status_code=404, detail="Style reference not found")
    
    db.delete(style_reference)
    db.commit()
    return {"message": "Style reference deleted successfully"}

@router.get("/persona/{persona_id}", response_model=List[StyleReferenceResponse])
async def list_style_references_for_persona(
    persona_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all style references for a specific persona."""
    # Verify the persona belongs to the current user
    persona = db.query(Persona).filter(
        Persona.id == persona_id,
        Persona.owner_id == current_user.id
    ).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    
    style_references = db.query(StyleReference).filter(
        StyleReference.persona_id == persona_id
    ).all()
    return style_references
