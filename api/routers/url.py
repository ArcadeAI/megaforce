
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from api.database import get_db
from api.models import Document, GenerationRun
from api.schemas import URLRequest, DocumentResponse
from api.auth import get_current_active_user
from api.routers.documents import populate_document_response
from megaforce.common.schemas import Document as SchemaDocument
from megaforce.parser_agents.url.tools import get_url_content


router = APIRouter()

@router.post("/", response_model=DocumentResponse)
async def process_url(
    request: URLRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Scrape a URL and create a `Document` for the current user."""
    try:
        # Fetch URL content (async tool)
        scraped: SchemaDocument = await get_url_content(url=request.url)  # type: ignore

        # Fallbacks for optional fields
        title = scraped.title or (scraped.url if isinstance(scraped.url, str) else str(scraped.url))
        author = scraped.author if hasattr(scraped, "author") else None

        # Optionally validate generation_run ownership
        generation_run_id = None
        if getattr(request, 'generation_run_id', None):
            gen_run = db.query(GenerationRun).filter(
                GenerationRun.id == request.generation_run_id,
                GenerationRun.owner_id == current_user.id
            ).first()
            if not gen_run:
                raise HTTPException(status_code=404, detail="Generation run not found")
            generation_run_id = gen_run.id

        db_document = Document(
            id=str(uuid.uuid4()),
            title=title,
            content=scraped.content or "",
            url=str(scraped.url),
            author=author,
            reference_type="url",
            owner_id=current_user.id,
            persona_ids=[request.persona_id] if request.persona_id else [],
            generation_run_id=generation_run_id,
            created_at=datetime.now(),
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)

        document_response = populate_document_response(db_document)
        return document_response
    except Exception as e:
        print(f"❌ Backend: Error in process_url: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
