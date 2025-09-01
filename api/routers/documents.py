from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import cast
from sqlalchemy.dialects.postgresql import JSONB
from typing import List
import uuid

from api.database import get_db
from api.models import Document, Run, Persona
from api.schemas import DocumentResponse, DocumentCreate, DocumentUpdate
from api.auth import get_current_active_user

def populate_document_response(document: Document) -> dict:
    """Helper to populate document response with persona_ids"""
    print(f"📝 Backend: Populating response for document {document.id}")
    print(f"🏷️ Backend: Document persona_ids: {document.persona_ids}")

    document_dict = {
        "id": document.id,
        "title": document.title,
        "content": document.content,
        "url": document.url,
        "author": document.author,
        "reference_type": document.reference_type,
        "owner_id": document.owner_id,
        "run_id": document.run_id,
        "generation_run_id": getattr(document, 'generation_run_id', None),
        "created_at": document.created_at,
        "persona_count": len(document.persona_ids) if document.persona_ids else 0,
        "persona_ids": document.persona_ids or []
    }
    print(f"✅ Backend: Final document response persona_ids: {document_dict['persona_ids']}")
    return document_dict

router = APIRouter()

@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    reference_type: str = None,  # Filter by reference type (tweet, url, document, etc.)
    persona_id: str = None,  # Filter by linked persona
    run_id: str = None,  # Filter by run ID
    generation_run_id: str = None,  # Filter by generation run ID
    search: str = None,  # Search in title and content
    limit: int = 100,  # Limit number of results (default 100)
    offset: int = 0,  # Offset for pagination (default 0)
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """List all documents for the current user with optional filtering."""
    try:
        print(f"📋 Backend: Listing documents for user {current_user.id}")
        print(f"🔍 Backend: Filters - reference_type: {reference_type}, persona_id: {persona_id}, run_id: {run_id}, search: {search}")

        # Base query: all documents owned by current user
        query = db.query(Document).filter(Document.owner_id == current_user.id)

        # Apply filters
        if reference_type:
            query = query.filter(Document.reference_type == reference_type)
        if persona_id:
            # Filter by persona_id using JSONB containment operator via SQLAlchemy
            query = query.filter(cast(Document.persona_ids, JSONB).contains([persona_id]))
        if run_id:
            query = query.filter(Document.run_id == run_id)
        if generation_run_id:
            query = query.filter(Document.generation_run_id == generation_run_id)
        if search:
            # Search in title and content using case-insensitive ILIKE
            search_term = f"%{search}%"
            query = query.filter(
                (Document.title.ilike(search_term)) |
                (Document.content.ilike(search_term))
            )

        # Apply pagination
        documents = query.offset(offset).limit(limit).all()
        print(f"📊 Backend: Found {len(documents)} documents")

        # Convert to response format with persona_ids
        response_documents = [populate_document_response(doc) for doc in documents]
        return response_documents

    except Exception as e:
        print(f"❌ Backend: Error in list_documents: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get a specific document."""
    print(f"🔍 Backend: Getting document {document_id} for user {current_user.id}")

    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return populate_document_response(document)

@router.post("/", response_model=DocumentResponse)
async def create_document(
    document: DocumentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Create a new document manually (supports both source materials and style references)."""
    # Verify the run belongs to the current user (if run_id provided)
    if document.run_id:
        run = db.query(Run).join(Run.input_source).filter(
            Run.id == document.run_id,
            Run.input_source.has(owner_id=current_user.id)
        ).first()
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")

    # Set owner_id to current user if not provided
    document_data = document.dict()
    if not document_data.get('owner_id'):
        document_data['owner_id'] = current_user.id

    # Extract persona_ids and validate them
    persona_ids = document_data.get('persona_ids', [])
    print(f"🔗 Backend: persona_ids received: {persona_ids}")

    if persona_ids:
        print(f"📝 Backend: Validating {len(persona_ids)} personas")
        for persona_id in persona_ids:
            # Verify persona exists and belongs to user
            persona = db.query(Persona).filter(
                Persona.id == persona_id,
                Persona.owner_id == current_user.id
            ).first()
            print(f"👤 Backend: Persona {persona_id} found: {persona is not None}")
            if not persona:
                raise HTTPException(status_code=404, detail=f"Persona {persona_id} not found")

    db_document = Document(
        id=str(uuid.uuid4()),
        **document_data
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    print(f"✅ Backend: Created document {db_document.id} with persona_ids: {db_document.persona_ids}")
    return populate_document_response(db_document)

@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    document_update: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Update a document."""
    print(f"📝 Backend: Updating document {document_id} for user {current_user.id}")

    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    update_data = document_update.dict(exclude_unset=True)
    print(f"🔄 Backend: Update data: {update_data}")

    # Validate persona_ids if provided
    if 'persona_ids' in update_data:
        persona_ids = update_data['persona_ids']
        if persona_ids:
            for persona_id in persona_ids:
                persona = db.query(Persona).filter(
                    Persona.id == persona_id,
                    Persona.owner_id == current_user.id
                ).first()
                if not persona:
                    raise HTTPException(status_code=404, detail=f"Persona {persona_id} not found")

    for field, value in update_data.items():
        setattr(document, field, value)

    db.commit()
    db.refresh(document)

    print(f"✅ Backend: Updated document {document.id} with persona_ids: {document.persona_ids}")
    return populate_document_response(document)


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Delete a document."""
    print(f"🗑️ Backend: Deleting document {document_id} for user {current_user.id}")

    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(document)
    db.commit()

    print(f"✅ Backend: Deleted document {document_id}")
    return {"message": "Document deleted successfully"}
