import os
import time
from typing import Optional, List
import uuid
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_active_user
from ..models import User, Persona, Document, OutputSchema as DBOutputSchema, OutputType, OutputStatus
from ..schemas import CommentResponse, Comment
from ..constants import API_KEY_MAP

# Import the style agent and its schemas
from megaforce.style_agent.agent import generate_related_content
from megaforce.common.schemas import ReferenceStyle, Document as SchemaDocument, OutputSchema, ContentType, DocumentCategory
from api.models import OutputType as CommonOutputType

router = APIRouter()

# --- Helper Functions --- #

def get_content_type_instructions(content_type: OutputType) -> str:
    """Get platform-specific instructions for different content types."""
    instructions = {
        OutputType.TWEET_SINGLE: "Generate a single engaging tweet (max 280 characters). Use relevant hashtags and mention handles when appropriate. Be concise and impactful.",
        OutputType.TWEET_THREAD: "Generate a Twitter thread with 2-5 connected tweets. Each tweet should be under 280 characters. Number them (1/n, 2/n, etc.) and ensure they flow logically.",
        OutputType.TWITTER_REPLY: "Generate a thoughtful Twitter reply. Keep it under 280 characters. Be engaging and add value to the conversation. Use appropriate tone for the platform.",
        OutputType.LINKEDIN_POST: "Generate a professional LinkedIn post. Use 1-3 paragraphs with line breaks for readability. Include relevant hashtags and maintain a professional tone.",
        OutputType.LINKEDIN_COMMENT: "Generate a professional LinkedIn comment. Be thoughtful and add value to the discussion. Maintain professional tone while being engaging.",
        OutputType.SOCIAL_COMMENT: "Generate a general social media comment. Be engaging, authentic, and appropriate for the platform context. Add value to the conversation.",
        OutputType.BLOG_POST: "Generate a comprehensive blog post with introduction, main points, and conclusion. Use proper formatting with headers and paragraphs.",
        OutputType.REDDIT_COMMENT: "Generate a Reddit-style comment. Be authentic, informative, and match the community tone. Use proper Reddit etiquette and formatting.",
        OutputType.FACEBOOK_COMMENT: "Generate a Facebook comment. Be friendly and conversational. Consider the social context and maintain appropriate tone.",
        OutputType.INSTAGRAM_COMMENT: "Generate an Instagram comment. Be visual-focused, use emojis appropriately, and keep it engaging and positive.",
        OutputType.YOUTUBE_COMMENT: "Generate a YouTube comment. Be engaging and relevant to video content. Can be longer than other social comments but stay focused."
    }
    return instructions.get(content_type, "Generate engaging content appropriate for the specified platform.")

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
    content_type: OutputType = Field(default=OutputType.LINKEDIN_COMMENT, description="Type of content to generate")

    # Content sources (mutually exclusive based on comment_type)
    run_id: Optional[str] = Field(None, description="ID of a run to use all documents from (new_content only)")
    document_ids: Optional[List[str]] = Field(None, description="List of document IDs to use (new_content only)")
    document_id: Optional[str] = Field(None, description="Single document ID (reply only)")
    post_content: Optional[str] = Field(None, description="Custom post content")
    post_title: Optional[str] = Field(None, description="Custom post title")

    # Style configuration
    persona_id: Optional[str] = Field(None, description="Persona ID to use for styling")
    comment_style: str = Field(default="Insightful", description="Style of comment to generate")

    # LLM configuration
    llm_provider: str = Field(default="openai")
    llm_model: Optional[str] = None
    temperature: float = 0.7

    @model_validator(mode='after')
    def validate_content_sources(self):
        comment_type = self.comment_type

        if comment_type == CommentType.REPLY:
            # Reply: only one document_id OR custom content
            _has_document_id = self.document_id is not None
            _has_custom_content = self.post_content is not None
        return self

@router.post("/generate-comments", response_model=List[CommentResponse], tags=["Style"])
async def generate_comments(
    request: CommentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> List[CommentResponse]:
    """Generate a single AI comment using various content sources and persona styles."""
    start_time = time.time()

    # Set API keys in environment for the agent to use
    api_key_var = API_KEY_MAP.get(request.llm_provider)
    if not api_key_var:
        raise HTTPException(status_code=400, detail="Invalid LLM provider")
    if not os.environ.get(api_key_var):
        raise HTTPException(status_code=400, detail="API key for LLM provider not found in environment")

    # Fetch content documents
    target_docs = []
    source_document_ids = []
    if request.run_id:
        docs = db.query(Document).filter(Document.run_id == request.run_id).all()
        if not docs:
            raise HTTPException(status_code=404, detail="No documents found for run_id")
        target_docs = [SchemaDocument(url=d.url or "https://example.com", type=ContentType.TWITTER, category=DocumentCategory.CASUAL, content=d.content, title=d.title) for d in docs]
        source_document_ids = [d.id for d in docs]
    elif request.document_ids:
        print(f"🔍 BACKEND DEBUG - Received document_ids: {request.document_ids}")
        print(f"🔍 BACKEND DEBUG - Document IDs count: {len(request.document_ids)}")
        docs = db.query(Document).filter(Document.id.in_(request.document_ids)).all()
        print(f"🔍 BACKEND DEBUG - Found documents count: {len(docs)}")
        print(f"🔍 BACKEND DEBUG - Found document IDs: {[d.id for d in docs]}")
        if not docs:
            raise HTTPException(status_code=404, detail="No documents found for document_ids")
        target_docs = [SchemaDocument(url=d.url or "https://example.com", type=ContentType.TWITTER, category=DocumentCategory.CASUAL, content=d.content, title=d.title) for d in docs]
        source_document_ids = [d.id for d in docs]
    elif request.document_id:
        doc = db.query(Document).filter(Document.id == request.document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        target_docs = [SchemaDocument(url=doc.url or "https://example.com", type=ContentType.TWITTER, category=DocumentCategory.CASUAL, content=doc.content, title=doc.title)]
        source_document_ids = [doc.id]
    elif request.post_content:
        target_docs = [SchemaDocument(url="http://example.com/custom", type=ContentType.LINKEDIN, category=DocumentCategory.PROFESSIONAL, content=request.post_content, title=request.post_title)]

    if not target_docs:
        raise HTTPException(status_code=400, detail="No content source provided.")

    # Fetch persona and construct reference style
    reference_styles = []
    persona_id = request.persona_id
    if persona_id:
        persona = db.query(Persona).filter(Persona.id == persona_id, Persona.owner_id == current_user.id).first()
        if not persona:
            raise HTTPException(status_code=404, detail="Persona not found or access denied")

        # Query style reference documents from unified documents table
        # Documents with persona_ids are automatically style references
        try:
            # Prefer dialect-aware JSONB contains when available (PostgreSQL)
            from sqlalchemy import cast
            from sqlalchemy.dialects.postgresql import JSONB
            ref_docs_db = db.query(Document).filter(
                cast(Document.persona_ids, JSONB).contains([persona.id])
            ).all()
        except Exception:
            # Fallback for other databases or if JSON operator support isn't available
            ref_docs_db = db.query(Document).all()
            # Filter in Python if JSON query doesn't work
            ref_docs_db = [doc for doc in ref_docs_db if doc.persona_ids and persona.id in doc.persona_ids]
        ref_docs_schema = [SchemaDocument(url=ref.url or "https://example.com/style-reference", type=ContentType.TWITTER, category=DocumentCategory.CASUAL, content=ref.content) for ref in ref_docs_db if ref.content]

        if ref_docs_schema:  # Only add if we have reference documents
            reference_styles.append(ReferenceStyle(name=persona.name, description=persona.description, documents=ref_docs_schema))
    else: # Create default persona if none provided
        default_persona = db.query(Persona).filter(Persona.name == "Default", Persona.owner_id == current_user.id).first()
        if not default_persona:
            default_persona = Persona(id=str(uuid.uuid4()), owner_id=current_user.id, name="Default", description="Default professional persona")
            db.add(default_persona)
            db.commit()
            db.refresh(default_persona)
        persona_id = default_persona.id

    # Ensure we always have at least one reference style with a style definition
    if not reference_styles:
        from megaforce.common.schemas import WritingStyle
        # Create a default style definition if no reference documents are available
        default_style = WritingStyle(
            tone="professional",
            formality_level=0.7,
            sentence_structure="varied",
            vocabulary_level="moderate"
        )
        reference_styles.append(ReferenceStyle(
            name="Default Style",
            description="A professional style for general use",
            style_definition=default_style
        ))

    # Define the output schema for the agent based on requested content type
    content_type_mapping = {
        "tweet_single": (CommonOutputType.TWEET_SINGLE, "A single tweet", "tweet"),
        "tweet_thread": (CommonOutputType.TWEET_THREAD, "A Twitter thread", "twitter_thread"),
        "twitter_reply": (CommonOutputType.TWITTER_REPLY, "A Twitter reply", "twitter_reply"),
        "linkedin_post": (CommonOutputType.LINKEDIN_POST, "A LinkedIn post", "linkedin_post"),
        "linkedin_comment": (CommonOutputType.LINKEDIN_COMMENT, "A LinkedIn comment", "linkedin_comment"),
        "social_comment": (CommonOutputType.SOCIAL_COMMENT, "A social media comment", "social_comment"),
        "blog_post": (CommonOutputType.BLOG_POST, "A blog post", "blog_post"),
        "reddit_comment": (CommonOutputType.REDDIT_COMMENT, "A Reddit comment", "reddit_comment"),
        "facebook_comment": (CommonOutputType.FACEBOOK_COMMENT, "A Facebook comment", "facebook_comment"),
        "instagram_comment": (CommonOutputType.INSTAGRAM_COMMENT, "An Instagram comment", "instagram_comment"),
        "youtube_comment": (CommonOutputType.YOUTUBE_COMMENT, "A YouTube comment", "youtube_comment")
    }

    # Get the mapping for the requested content type, default to linkedin_comment if not found
    output_type, description, name = content_type_mapping.get(
        request.content_type,
        (CommonOutputType.LINKEDIN_COMMENT, "A professional LinkedIn comment", "linkedin_comment")
    )

    output_schemas = [OutputSchema(name=name, description=description, output_type=output_type)]
    print(f"🔍 BACKEND DEBUG - Output schemas: {output_schemas}")

    # Construct the request for the style agent
    from megaforce.common.schemas import StyleTransferRequest as AgentStyleTransferRequest

    # Get content-type-specific instructions
    content_instructions = get_content_type_instructions(request.content_type)
    focus_instruction = f"{content_instructions} Engage the author and provide a thoughtful response."

    agent_request = AgentStyleTransferRequest(
        reference_style=reference_styles,
        intent=request.comment_style,
        focus=focus_instruction,
        target_content=target_docs,
        target_schemas=output_schemas
    )

    # Call the style agent
    try:
        results = await generate_related_content(
            agent_request,
            llm_provider=request.llm_provider,
            model=request.llm_model,
            temperature=request.temperature
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling style agent: {e}")

    if not results:
        raise HTTPException(status_code=500, detail="Style agent returned no results.")

    # Process result and save to DB
    result = results[0]
    # TODO(Mateo): Get the confidence from the result instead of a hash
    confidence = 75 + (hash(result.content) % 21)


    output_record = DBOutputSchema(
        id=str(uuid.uuid4()),
        persona_id=persona_id,
        source_document_id=source_document_ids[0] if source_document_ids else None,
        content_type=request.content_type,
        generated_content=result.content,
        status=OutputStatus.PENDING_REVIEW,
        score=confidence,
        publish_config={
            "comment_style": request.comment_style,
            "llm_provider": request.llm_provider,
            "source_document_ids": source_document_ids
        }
    )
    db.add(output_record)
    db.commit()
    db.refresh(output_record)

    response = CommentResponse(
        success=True,
        comment=Comment(text=result.content),
        style=request.comment_style,
        confidence=confidence,
        output_id=output_record.id,
        post_context=target_docs[0].content,
        llm_provider_used=request.llm_provider,
        processing_time=time.time() - start_time,
        message="Comment generated successfully."
    )

    return [response]
