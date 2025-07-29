from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from api.database import get_db
from api.models import Document, Run
from api.schemas import DocumentResponse, DocumentCreate, DocumentUpdate
from api.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all documents for the current user."""
    try:
        print(f"DEBUG: Current user ID: {current_user.id}")
        print(f"DEBUG: Current user: {current_user.username}")
        
        # Fixed: use owner_id instead of user_id
        documents = db.query(Document).join(Document.run).join(Document.run.input_source).filter(
            Document.run.input_source.has(owner_id=current_user.id)
        ).all()
        print(f"DEBUG: Found {len(documents)} documents")
        
        return documents
    except Exception as e:
        print(f"ERROR in list_documents: {str(e)}")
        print(f"ERROR type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific document."""
    # Fixed: use owner_id instead of user_id
    document = db.query(Document).join(Document.run).join(Document.run.input_source).filter(
        Document.id == document_id,
        Document.run.input_source.has(owner_id=current_user.id)
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.post("/", response_model=DocumentResponse)
async def create_document(
    document: DocumentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new document manually."""
    # Verify the run belongs to the current user
    run = db.query(Run).join(Run.input_source).filter(
        Run.id == document.run_id,
        Run.input_source.has(owner_id=current_user.id)
    ).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    db_document = Document(
        id=str(uuid.uuid4()),
        **document.dict()
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    document_update: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a document."""
    document = db.query(Document).join(Document.run).join(Document.run.input_source).filter(
        Document.id == document_id,
        Document.run.input_source.has(owner_id=current_user.id)
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    for field, value in document_update.dict(exclude_unset=True).items():
        setattr(document, field, value)
    
    db.commit()
    db.refresh(document)
    return document

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a document."""
    document = db.query(Document).join(Document.run).join(Document.run.input_source).filter(
        Document.id == document_id,
        Document.run.input_source.has(owner_id=current_user.id)
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}