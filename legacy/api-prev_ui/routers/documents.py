from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from api.database import get_db
from api.models import Document, Run, InputSource, PersonaStyleLink, Persona
from api.schemas import DocumentResponse, DocumentCreate, DocumentUpdate, PersonaStyleLinkCreate, PersonaStyleLinkResponse
from api.auth import get_current_user

def populate_document_response(document: Document) -> dict:
    """Helper to populate document response with persona_ids"""
    print(f"📝 Backend: Populating response for document {document.id}")
    print(f"🔗 Backend: Document has {len(document.persona_style_links) if document.persona_style_links else 0} persona_style_links")
    
    persona_ids = [link.persona_id for link in document.persona_style_links] if document.persona_style_links else []
    print(f"🏷️ Backend: Extracted persona_ids: {persona_ids}")
    
    document_dict = {
        "id": document.id,
        "title": document.title,
        "content": document.content,
        "url": document.url,
        "author": document.author,
        "score": document.score,
        "priority": document.priority,
        "platform_data": document.platform_data,
        "document_type": document.document_type,
        "reference_type": document.reference_type,
        "owner_id": document.owner_id,
        "is_style_reference": document.is_style_reference,
        "run_id": document.run_id,
        "created_at": document.created_at,
        "persona_count": len(document.persona_style_links) if document.persona_style_links else 0,
        "persona_ids": persona_ids
    }
    print(f"✅ Backend: Final document response persona_ids: {document_dict['persona_ids']}")
    return document_dict

router = APIRouter()

@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    document_type: str = None,  # Filter by "source_material" or "style_reference"
    is_style_reference: bool = None,  # Filter by style reference flag
    persona_id: str = None,  # Filter by linked persona
    limit: int = 100,  # Limit number of results (default 100)
    offset: int = 0,  # Offset for pagination (default 0)
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all documents for the current user with optional filtering."""
    try:
        print(f"DEBUG: Current user ID: {current_user.id}")
        print(f"DEBUG: Filters - document_type: {document_type}, is_style_reference: {is_style_reference}, persona_id: {persona_id}")
        
        # Start with documents owned by current user
        query = db.query(Document).filter(Document.owner_id == current_user.id)
        
        # Apply filters
        if document_type:
            query = query.filter(Document.document_type == document_type)
        if is_style_reference is not None:
            query = query.filter(Document.is_style_reference == is_style_reference)
        if persona_id:
            from api.models import PersonaStyleLink
            query = query.join(PersonaStyleLink).filter(PersonaStyleLink.persona_id == persona_id)
        
        # Apply pagination to prevent timeouts
        total_count = query.count()
        documents = query.offset(offset).limit(limit).all()
        print(f"DEBUG: Found {len(documents)} documents (showing {offset}-{offset+len(documents)} of {total_count} total)")
        
        # Add persona_count for each document
        for doc in documents:
            doc.persona_count = len(doc.persona_style_links)
        
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
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Add persona_count
    document.persona_count = len(document.persona_style_links)
    return document

@router.post("/", response_model=DocumentResponse)
async def create_document(
    document: DocumentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
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
    
    # Extract persona_ids before creating document (not a direct field on Document model)
    persona_ids = document_data.pop('persona_ids', [])
    
    db_document = Document(
        id=str(uuid.uuid4()),
        **document_data
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    # Create PersonaStyleLinks if persona_ids provided
    print(f"🔗 Backend: persona_ids received: {persona_ids}")
    if persona_ids:
        print(f"📝 Backend: Creating links for {len(persona_ids)} personas")
        for persona_id in persona_ids:
            # Verify persona exists and belongs to user
            persona = db.query(Persona).filter(
                Persona.id == persona_id,
                Persona.owner_id == current_user.id
            ).first()
            print(f"👤 Backend: Persona {persona_id} found: {persona is not None}")
            if persona:
                link = PersonaStyleLink(
                    id=str(uuid.uuid4()),
                    persona_id=persona_id,
                    document_id=db_document.id
                )
                db.add(link)
                print(f"🔗 Backend: Created link {link.id} between persona {persona_id} and document {db_document.id}")
        db.commit()  # Commit the links
        print(f"💾 Backend: Committed {len(persona_ids)} persona links")
        db.refresh(db_document)  # Refresh to get the links
        print(f"🔄 Backend: Document refreshed, persona_style_links count: {len(db_document.persona_style_links) if db_document.persona_style_links else 0}")
    else:
        print("❌ Backend: No persona_ids provided")
    
    return populate_document_response(db_document)

@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    document_update: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a document."""
    # Handle both documents with runs and manually created documents
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    update_data = document_update.dict(exclude_unset=True)
    
    # Handle persona_ids separately (not a direct field on Document model)
    persona_ids = update_data.pop('persona_ids', None)
    
    # Update regular document fields
    for field, value in update_data.items():
        setattr(document, field, value)
    
    # Update persona associations if persona_ids provided
    if persona_ids is not None:
        # Remove existing links
        db.query(PersonaStyleLink).filter(
            PersonaStyleLink.document_id == document_id
        ).delete()
        
        # Create new links
        for persona_id in persona_ids:
            # Verify persona exists and belongs to user
            persona = db.query(Persona).filter(
                Persona.id == persona_id,
                Persona.owner_id == current_user.id
            ).first()
            if persona:
                link = PersonaStyleLink(
                    id=str(uuid.uuid4()),
                    persona_id=persona_id,
                    document_id=document_id
                )
                db.add(link)
    
    db.commit()
    db.refresh(document)
    return populate_document_response(document)

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a document."""
    document = db.query(Document).join(Run).join(InputSource).filter(
        Document.id == document_id,
        InputSource.owner_id == current_user.id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}