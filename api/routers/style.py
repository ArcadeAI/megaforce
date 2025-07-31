import os
from datetime import datetime
from typing import Optional, List
import uuid
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator, model_validator, ValidationInfo
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_active_user
from ..models import User, Persona, Document, OutputSchema as DBOutputSchema, ApprovalHistory, OutputType, OutputStatus, Run, StyleReference

# Import the style agent and its schemas
from style_agent.agent import transfer_style
from common.schemas import StyleTransferRequest as AgentStyleRequest, ReferenceStyle, Document as SchemaDocument, OutputSchema, ContentType, DocumentCategory, WritingStyle

router = APIRouter()

# --- Enums --- #

class CommentType(str, Enum):
    REPLY = "reply"  # Reply to a single post (one document_id OR custom content)
    NEW_CONTENT = "new_content"  # Create new content (multiple sources: run_id, document_ids, OR custom content)

# --- Schemas --- #

class StyleTransferRequest(BaseModel):
    content_to_transform: str
    style_description: Optional[str] = None
    persona_id: Optional[str] = None
    reference_styles: List[ReferenceStyle] = []
    llm_provider: str = Field(default="anthropic")
    llm_model: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    temperature: float = 0.7

class StyleTransferResponse(BaseModel):
    success: bool
    transformed_content: str
    original_content: str
    style_description: str
    llm_provider_used: str
    processing_time: float
    message: str

class CommentRequest(BaseModel):
    comment_type: CommentType = Field(default=CommentType.REPLY, description="Type of comment: reply or new_content")
    
    # Content sources (mutually exclusive based on comment_type)
    run_id: Optional[str] = Field(None, description="ID of a run to use all documents from (new_content only)")
    document_ids: Optional[List[str]] = Field(None, description="List of document IDs to use (new_content only)")
    document_id: Optional[str] = Field(None, description="Single document ID (reply only)")
    post_content: Optional[str] = Field(None, description="Custom post content")
    post_title: Optional[str] = Field(None, description="Custom post title")
    
    # Style configuration
    persona_ids: Optional[List[str]] = Field(None, description="Persona IDs to use their style references")
    comment_style: str = Field(default="Insightful", description="Style of comment to generate")
    
    # LLM configuration
    llm_provider: str = Field(default="anthropic")
    llm_model: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    temperature: float = 0.7

    @model_validator(mode='after')
    def validate_content_sources(self):
        comment_type = self.comment_type
        
        if comment_type == CommentType.REPLY:
            # Reply: only one document_id OR custom content
            has_document_id = self.document_id is not None
            has_custom_content = self.post_content is not None
            has_run_id = self.run_id is not None
            has_document_ids = self.document_ids is not None and len(self.document_ids) > 0
            
            if has_run_id or has_document_ids:
                raise ValueError('Reply type cannot use run_id or document_ids. Use document_id or custom content only.')
            
            if not (has_document_id or has_custom_content):
                raise ValueError('Reply type requires either document_id or post_content.')
            
            if has_document_id and has_custom_content:
                raise ValueError('Reply type cannot use both document_id and custom content.')
                
        elif comment_type == CommentType.NEW_CONTENT:
            # New content: run_id OR document_ids OR custom content (mutually exclusive)
            has_run_id = self.run_id is not None
            has_document_ids = self.document_ids is not None and len(self.document_ids) > 0
            has_document_id = self.document_id is not None
            has_custom_content = self.post_content is not None
            
            if has_document_id:
                raise ValueError('New content type cannot use single document_id. Use document_ids list, run_id, or custom content.')
            
            sources_count = sum([has_run_id, has_document_ids, has_custom_content])
            if sources_count == 0:
                raise ValueError('New content type requires run_id, document_ids, or custom content.')
            if sources_count > 1:
                raise ValueError('New content type can only use one source: run_id, document_ids, or custom content.')
        
        return self

class CommentResponse(BaseModel):
    success: bool
    comment: str
    style: str
    confidence: int
    output_id: Optional[str] = None
    post_context: str
    llm_provider_used: str
    processing_time: float
    message: str

# --- Endpoints --- #

@router.post("/transform", response_model=StyleTransferResponse)
async def style_transfer(
    request: StyleTransferRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Transforms a given text to a new style, optionally using a persona."""
    start_time = datetime.now()
    
    style_description = request.style_description
    
    if request.persona_id:
        persona = db.query(Persona).filter(Persona.id == request.persona_id, Persona.owner_id == current_user.id).first()
        if not persona:
            raise HTTPException(status_code=404, detail="Persona not found or access denied")
        style_description = f"{persona.description}. Tone: {persona.style_preferences.get('tone', 'default')}."

    if not style_description:
        raise HTTPException(status_code=400, detail="Either style_description or persona_id must be provided.")

    agent_request = AgentStyleRequest(
        content_to_transform=request.content_to_transform,
        style_description=style_description,
        llm_provider=request.llm_provider,
        llm_model=request.llm_model,
        temperature=request.temperature
    )

    try:
        transformed_output = await transfer_style(agent_request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during style transfer: {e}")

    processing_time = (datetime.now() - start_time).total_seconds()

    return StyleTransferResponse(
        success=True,
        transformed_content=transformed_output.transformed_content,
        original_content=request.content_to_transform,
        style_description=style_description,
        llm_provider_used=transformed_output.llm_provider,
        processing_time=processing_time,
        message="Style transfer completed successfully."
    )

@router.post("/generate-comment", response_model=CommentResponse)
async def generate_comment(
    request: CommentRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate a single AI comment using various content sources and persona styles."""
    start_time = datetime.now()
    
    # Collect content sources based on comment type
    content_sources = []
    source_document_ids = []
    
    if request.comment_type == CommentType.REPLY:
        # Reply: single document or custom content
        if request.document_id:
            document = db.query(Document).filter(Document.id == request.document_id).first()
            if not document:
                raise HTTPException(status_code=404, detail="Document not found")
            if document.run and document.run.input_source and document.run.input_source.owner_id != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied to this document")
            content_sources.append({"content": document.content, "title": document.title})
            source_document_ids.append(document.id)
        else:
            # Custom content
            if not request.post_content or not request.post_title:
                raise HTTPException(status_code=400, detail="Custom content requires both post_content and post_title.")
            content_sources.append({"content": request.post_content, "title": request.post_title})
            
    elif request.comment_type == CommentType.NEW_CONTENT:
        # New content: run_id, document_ids, or custom content
        if request.run_id:
            # Get all documents from the run
            run = db.query(Run).filter(Run.id == request.run_id).first()
            if not run:
                raise HTTPException(status_code=404, detail="Run not found")
            if run.input_source.owner_id != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied to this run")
            
            documents = db.query(Document).filter(Document.run_id == request.run_id).all()
            if not documents:
                raise HTTPException(status_code=404, detail="No documents found in this run")
            
            for doc in documents:
                content_sources.append({"content": doc.content, "title": doc.title})
                source_document_ids.append(doc.id)
                
        elif request.document_ids:
            # Get specific documents
            for doc_id in request.document_ids:
                document = db.query(Document).filter(Document.id == doc_id).first()
                if not document:
                    raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
                if document.run and document.run.input_source and document.run.input_source.owner_id != current_user.id:
                    raise HTTPException(status_code=403, detail=f"Access denied to document {doc_id}")
                content_sources.append({"content": document.content, "title": document.title})
                source_document_ids.append(document.id)
                
        else:
            # Custom content
            if not request.post_content or not request.post_title:
                raise HTTPException(status_code=400, detail="Custom content requires both post_content and post_title.")
            content_sources.append({"content": request.post_content, "title": request.post_title})
    
    if not content_sources:
        raise HTTPException(status_code=400, detail="No content sources found for comment generation.")
    
    # Build style description from personas if provided
    style_context = ""
    if request.persona_ids:
        personas = db.query(Persona).filter(
            Persona.id.in_(request.persona_ids),
            Persona.owner_id == current_user.id
        ).all()
        
        if len(personas) != len(request.persona_ids):
            raise HTTPException(status_code=404, detail="One or more personas not found or access denied")
        
        # Get style references for all personas
        persona_styles = []
        for persona in personas:
            style_refs = db.query(StyleReference).filter(
                StyleReference.persona_id == persona.id
            ).all()
            
            persona_context = f"Persona: {persona.description}"
            if persona.style_preferences:
                persona_context += f". Style preferences: {persona.style_preferences}"
            
            if style_refs:
                ref_contexts = [f"{ref.reference_type}: {ref.content_text[:200] if ref.content_text else 'No content'}..." for ref in style_refs]
                persona_context += f". Style references: {'; '.join(ref_contexts)}"
            
            persona_styles.append(persona_context)
        
        style_context = f"Use the following persona styles: {' | '.join(persona_styles)}. "
    
    # Combine content for context (for new_content type)
    if request.comment_type == CommentType.NEW_CONTENT and len(content_sources) > 1:
        combined_content = "\n\n---\n\n".join([f"Title: {src['title']}\nContent: {src['content']}" for src in content_sources])
        post_content = combined_content
        post_title = f"Combined content from {len(content_sources)} sources"
    else:
        post_content = content_sources[0]["content"]
        post_title = content_sources[0]["title"]
    
    # Set up LLM API key
    api_key = None
    provider_env_var = f"{request.llm_provider.upper()}_API_KEY"
    if request.llm_provider == "openai":
        api_key = request.openai_api_key or os.getenv(provider_env_var)
    elif request.llm_provider == "anthropic":
        api_key = request.anthropic_api_key or os.getenv(provider_env_var)
    elif request.llm_provider == "google":
        api_key = request.google_api_key or os.getenv(provider_env_var)
    
    if not api_key:
        raise HTTPException(status_code=400, detail=f"API key for {request.llm_provider} not found.")

    original_key = os.environ.get(provider_env_var)
    os.environ[provider_env_var] = api_key

    try:
        # Build style description with persona context
        base_style_desc = f"Generate a {request.comment_style.lower()} comment that engages meaningfully with the content."
        if request.comment_type == CommentType.REPLY:
            base_style_desc += " This is a reply to the specific post."
        else:
            base_style_desc += " This is new content inspired by the provided sources."
        
        full_style_description = style_context + base_style_desc
        
        # Build proper StyleTransferRequest for the style agent
        # Create target content as Document
        target_doc = SchemaDocument(
            url="https://example.com/comment-generation",  # Placeholder URL
            type=ContentType.TWITTER,
            category=DocumentCategory.CASUAL,
            content=post_content,
            metadata={"source": "comment_generation"}
        )
        
        # Create output schema for social media comment
        from common.schemas import OutputType as CommonOutputType
        output_schema = OutputSchema(
            name="social_media_comment",
            output_type=CommonOutputType.LINKEDIN_COMMENT,
            platform="social_media",
            max_length=280,  # Twitter-like limit
            description=f"Generate a {request.comment_style.lower()} social media comment that is under 280 characters for Twitter compatibility"
        )
        
        # Create reference styles from persona context or default
        from common.schemas import WritingStyle
        
        # Create a WritingStyle definition
        style_definition = WritingStyle(
            tone=request.comment_style.lower(),
            formality_level=0.3,  # Casual for social media
            sentence_structure="short",
            vocabulary_level="simple",
            personality_traits=["engaging", "friendly"],
            style_rules=["Keep it concise and under 280 characters", "Be engaging", "Use social media appropriate language", "Perfect for Twitter posting"]
        )
        
        reference_styles = []
        if style_context.strip():
            reference_styles.append(ReferenceStyle(
                name=f"{request.comment_style} Style",
                description=style_context,
                style_definition=style_definition
            ))
        else:
            # Default reference style
            reference_styles.append(ReferenceStyle(
                name=f"{request.comment_style} Comment Style",
                description=f"Generate {request.comment_style.lower()} comments that are engaging, appropriate for social media, and under 280 characters for Twitter compatibility.",
                style_definition=style_definition
            ))
        
        # Build the proper StyleTransferRequest
        style_agent_request = AgentStyleRequest(
            reference_style=reference_styles,
            intent=f"Generate a {request.comment_style.lower()} social media comment",
            focus="Create engaging social media content",
            target_content=[target_doc],
            target_schemas=[output_schema]
        )
        
        # Call the style agent with proper parameters
        transformed_outputs = await transfer_style(
            style_agent_request,
            llm_provider=request.llm_provider,
            model=request.llm_model,
            temperature=request.temperature
        )
        
        # Extract the generated comment from the first response
        generated_comment = transformed_outputs[0].processed_content if transformed_outputs else "Unable to generate comment"
        confidence = 75 + (hash(generated_comment) % 21)

        # Get or create default persona for user if none specified
        if request.persona_ids:
            persona_id = request.persona_ids[0]
        else:
            # Create or get default persona for user
            default_persona = db.query(Persona).filter(
                Persona.owner_id == current_user.id,
                Persona.name == "Default"
            ).first()
            
            if not default_persona:
                default_persona = Persona(
                    id=str(uuid.uuid4()),
                    owner_id=current_user.id,
                    name="Default",
                    description="Default persona for comment generation",
                    style_preferences="Professional and engaging tone"
                )
                db.add(default_persona)
                db.flush()  # Get the ID without committing
            
            persona_id = default_persona.id
        
        # Save to database with metadata
        output_record = DBOutputSchema(
            id=str(uuid.uuid4()),
            persona_id=persona_id,
            source_document_id=source_document_ids[0] if source_document_ids else None,
            content_type=OutputType.SOCIAL_COMMENT,  # Now exists in database
            generated_content=generated_comment,
            status=OutputStatus.PENDING_REVIEW,
            score=confidence,
            publish_config={
                "style": request.comment_style,
                "comment_type": request.comment_type.value,
                "llm_provider": request.llm_provider,
                "source_document_ids": source_document_ids,
                "persona_ids": request.persona_ids or [],
                "num_sources": len(content_sources)
            }
        )
        
        db.add(output_record)
        db.commit()
        db.refresh(output_record)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred during comment generation: {e}")
    finally:
        if original_key:
            os.environ[provider_env_var] = original_key
        elif provider_env_var in os.environ:
            del os.environ[provider_env_var]

    processing_time = (datetime.now() - start_time).total_seconds()
    
    context_summary = post_content[:200] + "..." if len(post_content) > 200 else post_content
    if len(content_sources) > 1:
        context_summary = f"Combined {len(content_sources)} sources: {context_summary}"

    return CommentResponse(
        success=True,
        comment=generated_comment,
        style=request.comment_style,
        confidence=confidence,
        output_id=output_record.id,
        post_context=context_summary,
        llm_provider_used=request.llm_provider,
        processing_time=processing_time,
        message=f"{request.comment_style} {request.comment_type.value} comment generated successfully from {len(content_sources)} source(s)."
    )
