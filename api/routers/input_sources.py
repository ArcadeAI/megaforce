from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from api.database import get_db
from api.models import InputSource
from api.schemas import InputSourceCreate, InputSourceResponse
from api.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[InputSourceResponse])
async def list_input_sources(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all input sources for the current user."""
    input_sources = db.query(InputSource).filter(InputSource.user_id == current_user.id).all()
    return input_sources

@router.post("/", response_model=InputSourceResponse)
async def create_input_source(
    input_source: InputSourceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new input source."""
    db_input_source = InputSource(
        **input_source.dict(),
        user_id=current_user.id
    )
    db.add(db_input_source)
    db.commit()
    db.refresh(db_input_source)
    return db_input_source

@router.get("/{input_source_id}", response_model=InputSourceResponse)
async def get_input_source(
    input_source_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific input source."""
    input_source = db.query(InputSource).filter(
        InputSource.id == input_source_id,
        InputSource.user_id == current_user.id
    ).first()
    if not input_source:
        raise HTTPException(status_code=404, detail="Input source not found")
    return input_source

@router.delete("/{input_source_id}")
async def delete_input_source(
    input_source_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete an input source."""
    input_source = db.query(InputSource).filter(
        InputSource.id == input_source_id,
        InputSource.user_id == current_user.id
    ).first()
    if not input_source:
        raise HTTPException(status_code=404, detail="Input source not found")
    
    db.delete(input_source)
    db.commit()
    return {"message": "Input source deleted successfully"}