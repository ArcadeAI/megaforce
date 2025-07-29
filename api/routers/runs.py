from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from api.database import get_db
from api.models import Run
from api.schemas import RunResponse
from api.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[RunResponse])
async def list_runs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all runs for the current user."""
    runs = db.query(Run).join(Run.input_source).filter(
        Run.input_source.has(owner_id=current_user.id)
    ).all()
    return runs

@router.get("/{run_id}", response_model=RunResponse)
async def get_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific run."""
    run = db.query(Run).join(Run.input_source).filter(
        Run.id == run_id,
        Run.input_source.has(owner_id=current_user.id)
    ).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run

@router.delete("/{run_id}")
async def delete_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a run and all its associated documents."""
    run = db.query(Run).join(Run.input_source).filter(
        Run.id == run_id,
        Run.input_source.has(owner_id=current_user.id)
    ).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Delete the run (cascade will delete associated documents)
    db.delete(run)
    db.commit()
    return {"message": "Run deleted successfully"}