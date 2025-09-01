from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid

from api.database import get_db
from api.auth import get_current_active_user
from api.models import GenerationRun, Document
from api.schemas import GenerationRunCreate, GenerationRunResponse, DocumentResponse
from api.routers.documents import populate_document_response

router = APIRouter()


@router.post("/", response_model=GenerationRunResponse)
async def create_generation_run(
    request: GenerationRunCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    name = request.name or "Untitled Run"
    gen = GenerationRun(
        id=str(uuid.uuid4()),
        name=name,
        owner_id=current_user.id,
        status="created",
    )
    db.add(gen)
    db.commit()
    db.refresh(gen)
    return GenerationRunResponse(
        id=gen.id,
        name=gen.name,
        status=gen.status,
        owner_id=gen.owner_id,
        created_at=gen.created_at,
        sources_count=0,
    )


@router.get("/", response_model=list[GenerationRunResponse])
async def list_generation_runs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    gens = (
        db.query(GenerationRun)
        .filter(GenerationRun.owner_id == current_user.id)
        .order_by(GenerationRun.created_at.desc())
        .all()
    )

    # Count sources per run
    counts = dict(
        db.query(Document.generation_run_id, func.count(Document.id))
        .filter(Document.generation_run_id.isnot(None))
        .filter(Document.owner_id == current_user.id)
        .group_by(Document.generation_run_id)
        .all()
    )

    responses: list[GenerationRunResponse] = []
    for g in gens:
        responses.append(GenerationRunResponse(
            id=g.id,
            name=g.name,
            status=g.status,
            owner_id=g.owner_id,
            created_at=g.created_at,
            sources_count=int(counts.get(g.id, 0)),
        ))
    return responses
@router.get("/{run_id}", response_model=GenerationRunResponse)
async def get_generation_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    gen = (
        db.query(GenerationRun)
        .filter(GenerationRun.id == run_id, GenerationRun.owner_id == current_user.id)
        .first()
    )
    if not gen:
        raise HTTPException(status_code=404, detail="Generation run not found")

    # Count sources for this run
    sources_count = (
        db.query(func.count(Document.id))
        .filter(Document.owner_id == current_user.id)
        .filter(Document.generation_run_id == run_id)
        .scalar()
        or 0
    )

    return GenerationRunResponse(
        id=gen.id,
        name=gen.name,
        status=gen.status,
        owner_id=gen.owner_id,
        created_at=gen.created_at,
        sources_count=int(sources_count),
    )


@router.get("/{run_id}/documents", response_model=list[DocumentResponse])
async def list_generation_run_documents(
    run_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Ensure run exists and belongs to user
    gen = (
        db.query(GenerationRun)
        .filter(GenerationRun.id == run_id, GenerationRun.owner_id == current_user.id)
        .first()
    )
    if not gen:
        raise HTTPException(status_code=404, detail="Generation run not found")

    docs = (
        db.query(Document)
        .filter(Document.owner_id == current_user.id)
        .filter(Document.generation_run_id == run_id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [populate_document_response(d) for d in docs]



