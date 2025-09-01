from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from api.database import get_db
from api.models import OutputSchema, ApprovalHistory, OutputStatus, AppSetting
from api.schemas import OutputSchemaResponse, OutputSchemaCreate, OutputSchemaUpdate, ApprovalRequest, ScheduleRequest, ScheduleResponse
from datetime import datetime
from zoneinfo import ZoneInfo
from api.tasks import post_output_to_x_task
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


@router.post("/{output_id}/schedule", response_model=ScheduleResponse)
async def schedule_output(
    output_id: str,
    schedule: ScheduleRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Schedule an approved output to be posted later via Celery ETA."""
    # Validate ownership
    output = db.query(OutputSchema).join(OutputSchema.persona).filter(
        OutputSchema.id == output_id,
        OutputSchema.persona.has(owner_id=current_user.id)
    ).first()
    if not output:
        raise HTTPException(status_code=404, detail="Output not found")

    # Ensure approved first
    print(f"DEBUG: Output status: {output.status}, {OutputStatus.APPROVED.value}, {output.status in {OutputStatus.APPROVED.value}}")
    if output.status not in {OutputStatus.APPROVED.value}:
        raise HTTPException(status_code=400, detail="Output must be approved before scheduling")

    try:
        # Parse provided datetime
        if isinstance(schedule.schedule_time, datetime):
            provided_dt = schedule.schedule_time
        else:
            provided_dt = datetime.fromisoformat(str(schedule.schedule_time).replace("Z", "+00:00"))

        # Fetch configured timezone; default to UTC
        settings = db.query(AppSetting).first()
        tz_name = settings.timezone if settings and settings.timezone else "UTC"

        # If no tzinfo, assume configured timezone
        if provided_dt.tzinfo is None:
            localized = provided_dt.replace(tzinfo=ZoneInfo(tz_name))
        else:
            localized = provided_dt

        # Convert to naive UTC datetime for Celery ETA
        eta = localized.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid schedule_time format; use ISO8601")

    # Mark as approved/scheduled in workflow
    previous_status = output.status
    # Keep status as approved but record a scheduled action (no explicit enum for scheduled)
    output.status = OutputStatus.APPROVED
    approval_history = ApprovalHistory(
        id=str(uuid.uuid4()),
        output_schema_id=output_id,
        action="scheduled",
        previous_status=previous_status,
        new_status=OutputStatus.APPROVED,
        notes=f"Scheduled for {eta.isoformat()}"
    )
    db.add(approval_history)
    db.commit()

    # Enqueue Celery task with ETA
    result = post_output_to_x_task.apply_async(args=[output_id], eta=eta)

    return {"message": "Scheduled", "task_id": result.id, "scheduled_at": eta}

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

@router.put("/{output_id}", response_model=OutputSchemaResponse)
async def update_output(
    output_id: str,
    update_data: OutputSchemaUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an output schema."""
    try:
        # Filter through persona relationship since OutputSchema doesn't have user_id
        output = db.query(OutputSchema).join(OutputSchema.persona).filter(
            OutputSchema.id == output_id,
            OutputSchema.persona.has(owner_id=current_user.id)
        ).first()
        if not output:
            raise HTTPException(status_code=404, detail="Output not found")
        
        # Update only provided fields
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(output, field, value)
        
        db.commit()
        db.refresh(output)
        return output
    except Exception as e:
        print(f"ERROR in update_output: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update output: {str(e)}")

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