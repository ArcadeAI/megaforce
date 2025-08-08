from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

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
    try:
        print(f"DEBUG: Creating output for user {current_user.id}")
        print(f"DEBUG: Output data: {output_data.dict()}")
        
        # Note: OutputSchema doesn't have user_id, it's linked through persona_id
        output = OutputSchema(
            id=str(uuid.uuid4()),  # Generate UUID for id field
            **output_data.dict()
        )
        db.add(output)
        db.commit()
        db.refresh(output)
        
        print(f"DEBUG: Created output with id: {output.id}")
        return output
    except Exception as e:
        print(f"ERROR in create_output: {str(e)}")
        print(f"ERROR type: {type(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create output: {str(e)}")

@router.get("/", response_model=List[OutputSchemaResponse])
async def list_outputs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all output schemas for the current user."""
    try:
        # Filter through persona relationship since OutputSchema doesn't have user_id
        from api.models import Persona
        outputs = db.query(OutputSchema).join(Persona).filter(
            Persona.owner_id == current_user.id
        ).all()
        return outputs
    except Exception as e:
        print(f"ERROR in list_outputs: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch outputs: {str(e)}")

@router.get("/{output_id}", response_model=OutputSchemaResponse)
async def get_output(
    output_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific output schema."""
    # Filter through persona relationship since OutputSchema doesn't have user_id
    output = db.query(OutputSchema).join(OutputSchema.persona).filter(
        OutputSchema.id == output_id,
        OutputSchema.persona.has(owner_id=current_user.id)
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
    # Filter through persona relationship since OutputSchema doesn't have user_id
    output = db.query(OutputSchema).join(OutputSchema.persona).filter(
        OutputSchema.id == output_id,
        OutputSchema.persona.has(owner_id=current_user.id)
    ).first()
    if not output:
        raise HTTPException(status_code=404, detail="Output not found")
    
    # Update output status
    output.status = "approved"
    
    # Create approval history (ApprovalHistory doesn't have user_id field)
    approval_history = ApprovalHistory(
        id=str(uuid.uuid4()),  # Generate UUID for id field
        output_schema_id=output_id,
        action="approved",
        score=approval.score,
        notes=approval.feedback
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
    # Filter through persona relationship since OutputSchema doesn't have user_id
    output = db.query(OutputSchema).join(OutputSchema.persona).filter(
        OutputSchema.id == output_id,
        OutputSchema.persona.has(owner_id=current_user.id)
    ).first()
    if not output:
        raise HTTPException(status_code=404, detail="Output not found")
    
    # Update output status
    output.status = "rejected"
    
    # Create approval history (ApprovalHistory doesn't have user_id field)
    approval_history = ApprovalHistory(
        id=str(uuid.uuid4()),  # Generate UUID for id field
        output_schema_id=output_id,
        action="rejected",
        score=approval.score,
        notes=approval.feedback
    )
    db.add(approval_history)
    db.commit()
    
    return {"message": "Output rejected successfully"}

@router.delete("/{output_id}")
async def delete_output(
    output_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete an output and its approval history."""
    output = db.query(OutputSchema).join(OutputSchema.persona).filter(
        OutputSchema.id == output_id,
        OutputSchema.persona.has(owner_id=current_user.id)
    ).first()
    if not output:
        raise HTTPException(status_code=404, detail="Output not found")
    
    # Delete the output (cascade will delete approval history)
    db.delete(output)
    db.commit()
    return {"message": "Output deleted successfully"}