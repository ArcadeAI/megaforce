from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from api.database import get_db
from api.models import OutputSchema, ApprovalHistory
from api.schemas import OutputSchemaResponse, OutputSchemaCreate, ApprovalRequest
from api.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=OutputSchemaResponse)
async def create_output(
    output_data: OutputSchemaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new output schema."""
    output = OutputSchema(
        **output_data.dict(),
        user_id=current_user.id
    )
    db.add(output)
    db.commit()
    db.refresh(output)
    return output

@router.get("/", response_model=List[OutputSchemaResponse])
async def list_outputs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all output schemas for the current user."""
    outputs = db.query(OutputSchema).filter(OutputSchema.user_id == current_user.id).all()
    return outputs

@router.get("/{output_id}", response_model=OutputSchemaResponse)
async def get_output(
    output_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific output schema."""
    output = db.query(OutputSchema).filter(
        OutputSchema.id == output_id,
        OutputSchema.user_id == current_user.id
    ).first()
    if not output:
        raise HTTPException(status_code=404, detail="Output not found")
    return output

@router.post("/{output_id}/approve")
async def approve_output(
    output_id: str,
    approval: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Approve an output schema."""
    output = db.query(OutputSchema).filter(
        OutputSchema.id == output_id,
        OutputSchema.user_id == current_user.id
    ).first()
    if not output:
        raise HTTPException(status_code=404, detail="Output not found")
    
    # Update output status
    output.status = "approved"
    
    # Create approval history
    approval_history = ApprovalHistory(
        output_schema_id=output_id,
        user_id=current_user.id,
        action="approved",
        score=approval.score,
        feedback=approval.feedback
    )
    db.add(approval_history)
    db.commit()
    
    return {"message": "Output approved successfully"}

@router.post("/{output_id}/reject")
async def reject_output(
    output_id: str,
    approval: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Reject an output schema."""
    output = db.query(OutputSchema).filter(
        OutputSchema.id == output_id,
        OutputSchema.user_id == current_user.id
    ).first()
    if not output:
        raise HTTPException(status_code=404, detail="Output not found")
    
    # Update output status
    output.status = "rejected"
    
    # Create approval history
    approval_history = ApprovalHistory(
        output_schema_id=output_id,
        user_id=current_user.id,
        action="rejected",
        score=approval.score,
        feedback=approval.feedback
    )
    db.add(approval_history)
    db.commit()
    
    return {"message": "Output rejected successfully"}