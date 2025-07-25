from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from api.database import get_db
from api.models import Document
from api.schemas import DocumentResponse
from api.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all documents for the current user."""
    documents = db.query(Document).join(Document.run).join(Document.run.input_source).filter(
        Document.run.input_source.has(user_id=current_user.id)
    ).all()
    return documents

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific document."""
    document = db.query(Document).join(Document.run).join(Document.run.input_source).filter(
        Document.id == document_id,
        Document.run.input_source.has(user_id=current_user.id)
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document