from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.database import get_db
from api.auth import get_current_active_user
from api.models import GenerationJob, GenerationJobStatus, GenerationRun
from api.schemas import GenerationJobResponse, ScheduleRequest, ScheduleResponse


router = APIRouter()


class GenerationJobUpdate(BaseModel):
    generated_content: Optional[str] = None
    status: Optional[GenerationJobStatus] = None


def _ensure_job_owned(job_id: str, db: Session, current_user) -> GenerationJob:
    job: GenerationJob | None = (
        db.query(GenerationJob)
        .join(GenerationRun, GenerationRun.id == GenerationJob.generation_run_id)
        .filter(GenerationJob.id == job_id)
        .filter(GenerationRun.owner_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/{job_id}", response_model=GenerationJobResponse)
async def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
):
    job = _ensure_job_owned(job_id, db, current_user)
    return GenerationJobResponse(
        id=job.id,
        generation_run_id=job.generation_run_id,
        persona_id=job.persona_id,
        content_type=job.content_type,
        source_selection=job.source_selection,
        status=job.status,
        generated_content=job.generated_content,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


@router.put("/{job_id}", response_model=GenerationJobResponse)
async def update_job(
    job_id: str,
    request: GenerationJobUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
):
    job = _ensure_job_owned(job_id, db, current_user)
    changed = False
    if request.generated_content is not None:
        job.generated_content = request.generated_content
        changed = True
    if request.status is not None:
        job.status = request.status
        changed = True
    if changed:
        db.commit()
        db.refresh(job)

    return GenerationJobResponse(
        id=job.id,
        generation_run_id=job.generation_run_id,
        persona_id=job.persona_id,
        content_type=job.content_type,
        source_selection=job.source_selection,
        status=job.status,
        generated_content=job.generated_content,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


@router.post("/{job_id}/post")
async def post_job_now(
    job_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
):
    job = _ensure_job_owned(job_id, db, current_user)
    if not job.generated_content:
        raise HTTPException(status_code=400, detail="Job has no generated content to post")

    # Queue Celery task immediately
    try:
        from api.tasks import post_generation_job_to_x_task

        result = post_generation_job_to_x_task.delay(job.id)
        return {"message": "Post queued", "task_id": result.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue post: {str(e)}")


@router.post("/{job_id}/schedule", response_model=ScheduleResponse)
async def schedule_job_post(
    job_id: str,
    schedule: ScheduleRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
):
    job = _ensure_job_owned(job_id, db, current_user)
    if not job.generated_content:
        raise HTTPException(status_code=400, detail="Job has no generated content to post")

    # Parse schedule_time and convert to naive UTC, respecting configured timezone for naive inputs
    from zoneinfo import ZoneInfo
    try:
        provided_dt = schedule.schedule_time
        if provided_dt.tzinfo is None:
            # Assume configured application timezone when not provided
            from api.models import AppSetting
            settings: AppSetting | None = db.query(AppSetting).first()
            tz_name = settings.timezone if settings and settings.timezone else "UTC"
            provided_dt = provided_dt.replace(tzinfo=ZoneInfo(tz_name))
        eta = provided_dt.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid schedule_time format; use ISO8601")

    # Mark job as scheduled
    job.status = GenerationJobStatus.SCHEDULED
    db.commit()

    # Enqueue Celery task with ETA
    try:
        from api.tasks import post_generation_job_to_x_task

        result = post_generation_job_to_x_task.apply_async(args=[job.id], eta=eta)
        return {"message": "Scheduled", "task_id": result.id, "scheduled_at": eta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to schedule post: {str(e)}")


