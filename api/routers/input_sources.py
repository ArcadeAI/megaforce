from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

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
    try:
        print(f"DEBUG: Current user ID: {current_user.id}")
        print(f"DEBUG: Current user: {current_user.username}")
        
        # Check if the user has any input sources
        input_sources = db.query(InputSource).filter(InputSource.owner_id == current_user.id).all()
        print(f"DEBUG: Found {len(input_sources)} input sources")
        
        return input_sources
    except Exception as e:
        print(f"ERROR in list_input_sources: {str(e)}")
        print(f"ERROR type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/", response_model=InputSourceResponse)
async def create_input_source(
    input_source: InputSourceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new input source."""
    try:
        print(f"DEBUG: Creating input source for user {current_user.id}")
        print(f"DEBUG: Input source data: {input_source.dict()}")
        
        db_input_source = InputSource(
            id=str(uuid.uuid4()),  # Generate UUID for id field
            **input_source.dict(),
            owner_id=current_user.id
        )
        db.add(db_input_source)
        db.commit()
        db.refresh(db_input_source)
        
        print(f"DEBUG: Created input source with id: {db_input_source.id}")
        return db_input_source
    except Exception as e:
        print(f"ERROR in create_input_source: {str(e)}")
        print(f"ERROR type: {type(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create input source: {str(e)}")

@router.get("/{input_source_id}", response_model=InputSourceResponse)
async def get_input_source(
    input_source_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific input source."""
    input_source = db.query(InputSource).filter(
        InputSource.id == input_source_id,
        InputSource.owner_id == current_user.id
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
        InputSource.owner_id == current_user.id
    ).first()
    if not input_source:
        raise HTTPException(status_code=404, detail="Input source not found")
    
    db.delete(input_source)
    db.commit()
    return {"message": "Input source deleted successfully"}