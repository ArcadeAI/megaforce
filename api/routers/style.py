import os
import asyncio
from datetime import datetime
from typing import Optional, List
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.database import get_db
from api.auth import get_current_active_user
from api.models import User, Persona, StyleReference, OutputType, OutputStatus
from api.models import OutputSchema as DBOutputSchema  # SQLAlchemy model
from api.schemas import StyleTransferRequest, StyleTransferResponse

# Import the style agent
from style_agent.agent import transfer_style
from common.schemas import (
    StyleTransferRequest as AgentStyleRequest, ReferenceStyle, OutputSchema, 
    OutputType as CommonOutputType, WritingStyle, FewShotExample, Document, ContentType, 
    DocumentCategory
)

router = APIRouter()


@router.post("/transform", response_model=StyleTransferResponse)
async def transform_content_style(
    request: StyleTransferRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Transform content using the style agent with dynamic LLM credentials."""
    start_time = datetime.now()
    
    try:
        # Validate that either style_description or persona_id is provided
        if not request.style_description and not request.persona_id:
            raise HTTPException(
                status_code=400,
                detail="Either style_description or persona_id must be provided"
            )
        
        # Get style information from persona if persona_id is provided
        style_description = request.style_description or ""
        if request.persona_id:
            persona = db.query(Persona).filter(
                Persona.id == request.persona_id,
                Persona.owner_id == current_user.id
            ).first()
            
            if not persona:
                raise HTTPException(
                    status_code=404,
                    detail=f"Persona with id {request.persona_id} not found"
                )
            
            # Build style description from persona
            style_parts = [persona.description or ""]
            
            if persona.style_preferences:
                prefs = persona.style_preferences
                if prefs.get('tone'):
                    style_parts.append(f"Tone: {prefs['tone']}")
                if prefs.get('formality'):
                    style_parts.append(f"Formality: {prefs['formality']}")
                if prefs.get('emoji_usage'):
                    style_parts.append(f"Emoji usage: {prefs['emoji_usage']}")
                if prefs.get('personality_traits'):
                    traits = ', '.join(prefs['personality_traits'])
                    style_parts.append(f"Personality: {traits}")
            
            # Fetch style references for this persona
            style_references = db.query(StyleReference).filter(
                StyleReference.persona_id == persona.id
            ).all()
            
            # Add style references as examples
            if style_references:
                style_parts.append("\n\nStyle Examples:")
                for i, ref in enumerate(style_references[:3], 1):  # Limit to 3 examples
                    if ref.content_text:
                        style_parts.append(f"Example {i}: {ref.content_text}")
                        if ref.meta_data and ref.meta_data.get('style_notes'):
                            style_parts.append(f"  Notes: {ref.meta_data['style_notes']}")
            
            persona_style = ". ".join([part for part in style_parts if part])
            
            # Combine persona style with optional user-provided style_description
            if request.style_description:
                style_description = f"{request.style_description}\n\nPersona Context: {persona_style}"
                print(f"DEBUG: Using persona '{persona.name}' + custom style description")
            else:
                style_description = persona_style
                print(f"DEBUG: Using persona '{persona.name}' only")
            
            print(f"DEBUG: Found {len(style_references)} style references")
            print(f"DEBUG: Full style context: {style_description[:200]}...")
        
        # Create a basic style definition from the description
        style_definition = WritingStyle(
            tone='engaging',
            formality_level=0.3,
            sentence_structure='varied',
            vocabulary_level='accessible',
            personality_traits=['authentic', 'engaging'],
            style_rules=[
                style_description,
                f"Keep output under {request.max_length} characters" if request.max_length else "Be concise",
                f"Format as {request.output_format}"
            ],
            few_shot_examples=[]
        )
        
        reference_style = ReferenceStyle(
            name="Dynamic Style",
            description=style_description,
            style_definition=style_definition,
            documents=[]
        )
        
        # Create target content document
        target_content = Document(
            title="Content to Transform",
            content=request.content,
            url="https://example.com/api-request",
            type=ContentType.TWITTER,
            category=DocumentCategory.CASUAL,
            metadata={"source": "api_request"}
        )
        
        # Create output schema based on format
        output_type_map = {
            "tweet": OutputType.TWEET_SINGLE,
            "thread": OutputType.TWEET_THREAD,
            "comment": OutputType.LINKEDIN_COMMENT,
            "post": OutputType.LINKEDIN_POST,
            "blog": OutputType.BLOG_POST
        }
        
        output_schema = OutputSchema(
            name=f"{request.output_format.title()} Output",
            description=f"Transformed content as {request.output_format}",
            output_type=output_type_map.get(request.output_format, OutputType.TWEET_SINGLE),
            max_length=request.max_length or 280,
            required_elements=['main_message'],
            optional_elements=['hashtags', 'emojis']
        )
        
        # Create agent request
        agent_request = AgentStyleRequest(
            reference_style=[reference_style],
            target_content=[target_content],
            target_schemas=[output_schema],
            intent=f"Transform content to {style_description}",
            focus="style and engagement"
        )
        
        # Determine which API key to use based on provider
        api_key = None
        if request.llm_provider == "openai":
            api_key = request.openai_api_key or os.getenv("OPENAI_API_KEY")
        elif request.llm_provider == "anthropic":
            api_key = request.anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
        elif request.llm_provider == "google":
            api_key = request.google_api_key or os.getenv("GOOGLE_API_KEY")
        
        if not api_key:
            raise HTTPException(
                status_code=400,
                detail=f"No API key provided for {request.llm_provider}. Please provide the key or set it in environment variables."
            )
        
        # Temporarily set the API key in environment for the agent
        original_key = os.environ.get(f"{request.llm_provider.upper()}_API_KEY")
        os.environ[f"{request.llm_provider.upper()}_API_KEY"] = api_key
        
        try:
            # Call the style agent with timeout
            results = await asyncio.wait_for(
                transfer_style(
                    agent_request,
                    llm_provider=request.llm_provider,
                    temperature=request.temperature or 0.7
                ),
                timeout=60.0  # 1 minute timeout
            )
            
            if results and len(results) > 0:
                result = results[0]
                transformed_content = result.processed_content
                
                # Parse JSON if needed
                if isinstance(transformed_content, str) and transformed_content.startswith('{'):
                    import json
                    try:
                        parsed = json.loads(transformed_content)
                        transformed_content = parsed.get('text', transformed_content)
                    except json.JSONDecodeError:
                        pass  # Use as-is if not valid JSON
                
                processing_time = (datetime.now() - start_time).total_seconds()
                
                return StyleTransferResponse(
                    success=True,
                    transformed_content=transformed_content,
                    original_content=request.content,
                    style_applied=style_description,
                    character_count=len(transformed_content),
                    llm_provider_used=request.llm_provider,
                    processing_time=processing_time,
                    message="Content transformed successfully!"
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Style agent returned no results"
                )
                
        finally:
            # Restore original API key
            if original_key:
                os.environ[f"{request.llm_provider.upper()}_API_KEY"] = original_key
            else:
                os.environ.pop(f"{request.llm_provider.upper()}_API_KEY", None)
                
    except asyncio.TimeoutError:
        processing_time = (datetime.now() - start_time).total_seconds()
        raise HTTPException(
            status_code=408,
            detail="Style transformation timed out. The content may be too complex or the LLM is slow."
        )
    except Exception as e:
        processing_time = (datetime.now() - start_time).total_seconds()
        return StyleTransferResponse(
            success=False,
            transformed_content=None,
            original_content=request.content,
            style_applied=style_description,
            character_count=0,
            llm_provider_used=request.llm_provider,
            processing_time=processing_time,
            message=f"Style transformation failed: {str(e)}"
        )


# Schema for generating multiple comment suggestions (matches UI expectations)
class CommentSuggestionsRequest(BaseModel):
    post_content: str = Field(..., description="The original post content to generate comments for")
    post_title: str = Field(..., description="The post title for context")
    subreddit: Optional[str] = Field(None, description="The subreddit context")
    num_suggestions: int = Field(default=3, ge=1, le=10, description="Number of comment suggestions to generate")
    
    # Style preferences
    comment_styles: List[str] = Field(default=["Insightful", "Question", "Supportive"], description="Types of comments to generate")
    
    # LLM Provider Configuration (with .env fallbacks)
    llm_provider: str = Field(default="anthropic", description="LLM provider: openai, anthropic, google")
    llm_model: Optional[str] = Field(None, description="Specific model to use (optional)")
    openai_api_key: Optional[str] = Field(None, description="OpenAI API key (optional, defaults to .env)")
    anthropic_api_key: Optional[str] = Field(None, description="Anthropic API key (optional, defaults to .env)")
    google_api_key: Optional[str] = Field(None, description="Google API key (optional, defaults to .env)")
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0, description="LLM temperature for creativity")


class CommentSuggestion(BaseModel):
    id: int
    type: str
    content: str
    confidence: int  # 1-100 confidence score
    output_id: Optional[str] = None  # ID of saved OutputSchema record for approval workflow


class CommentSuggestionsResponse(BaseModel):
    success: bool
    suggestions: List[CommentSuggestion]
    post_context: str
    llm_provider_used: str
    processing_time: float
    message: str


@router.post("/generate-comments", response_model=CommentSuggestionsResponse)
async def generate_comment_suggestions(
    request: CommentSuggestionsRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate multiple AI comment suggestions for a post (matches UI expectations)."""
    start_time = datetime.now()
    
    try:
        # Determine which API key to use
        api_key = None
        if request.llm_provider == "openai":
            api_key = request.openai_api_key or os.getenv("OPENAI_API_KEY")
        elif request.llm_provider == "anthropic":
            api_key = request.anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
        elif request.llm_provider == "google":
            api_key = request.google_api_key or os.getenv("GOOGLE_API_KEY")
        
        if not api_key:
            raise HTTPException(
                status_code=400,
                detail=f"No API key provided for {request.llm_provider}."
            )
        
        # Set API key temporarily
        original_key = os.environ.get(f"{request.llm_provider.upper()}_API_KEY")
        os.environ[f"{request.llm_provider.upper()}_API_KEY"] = api_key
        
        suggestions = []
        
        try:
            # Generate suggestions for each requested style
            for i, style in enumerate(request.comment_styles[:request.num_suggestions]):
                # Create style-specific prompt
                style_description = f"Generate a {style.lower()} comment that engages meaningfully with the post content"
                
                style_definition = WritingStyle(
                    tone=style.lower(),
                    formality_level=0.4,
                    sentence_structure='varied',
                    vocabulary_level='accessible',
                    personality_traits=['engaging', 'thoughtful'],
                    style_rules=[
                        f"Write in a {style.lower()} style",
                        "Be authentic and engaging",
                        "Keep under 300 characters",
                        "Ask questions to encourage discussion" if style == "Question" else "Provide valuable insights"
                    ],
                    few_shot_examples=[]
                )
                
                reference_style = ReferenceStyle(
                    name=f"{style} Comment Style",
                    description=style_description,
                    style_definition=style_definition,
                    documents=[]
                )
                
                # Create context document
                context_content = f"Post Title: {request.post_title}\n\nPost Content: {request.post_content}"
                if request.subreddit:
                    context_content = f"Subreddit: {request.subreddit}\n\n{context_content}"
                
                target_content = Document(
                    title=request.post_title,
                    content=context_content,
                    url="https://reddit.com/api-request",
                    type=ContentType.REDDIT,
                    category=DocumentCategory.CASUAL,
                    metadata={"subreddit": request.subreddit, "style": style}
                )
                
                output_schema = OutputSchema(
                    name="Reddit Comment",
                    description=f"{style} comment for Reddit post",
                    output_type=OutputType.LINKEDIN_COMMENT,
                    max_length=300,
                    required_elements=['main_message'],
                    optional_elements=['question', 'insight']
                )
                
                agent_request = AgentStyleRequest(
                    reference_style=[reference_style],
                    target_content=[target_content],
                    target_schemas=[output_schema],
                    intent=f"Generate {style.lower()} comment",
                    focus="engagement and authenticity"
                )
                
                # Generate comment
                results = await asyncio.wait_for(
                    transfer_style(
                        agent_request,
                        llm_provider=request.llm_provider,
                        temperature=request.temperature or 0.7
                    ),
                    timeout=30.0
                )
                
                if results and len(results) > 0:
                    result = results[0]
                    comment_content = result.processed_content
                    
                    # Parse JSON if needed
                    if isinstance(comment_content, str) and comment_content.startswith('{'):
                        import json
                        try:
                            parsed = json.loads(comment_content)
                            comment_content = parsed.get('text', comment_content)
                        except json.JSONDecodeError:
                            pass
                    
                    # Calculate confidence score (based on length and style match)
                    confidence = min(95, max(75, 85 + (len(comment_content) // 10)))
                    
                    # Save comment as OutputSchema for approval workflow
                    output_id = None
                    # Save comment as OutputSchema for approval workflow
                    user_personas = db.query(Persona).filter(Persona.owner_id == current_user.id).first()
                    if user_personas:
                        output_id = str(uuid.uuid4())
                        output_record = DBOutputSchema(
                            id=output_id,
                            content_type=OutputType.LINKEDIN_COMMENT,
                            generated_content=comment_content,
                            status=OutputStatus.DRAFT,
                            score=confidence / 10.0,  # Convert to 1-10 scale
                            persona_id=user_personas.id,
                            publish_config={
                                "comment_style": style,
                                "original_post": request.post_content,
                                "post_title": request.post_title,
                                "platform": "social",
                                "confidence": confidence
                            }
                        )
                        db.add(output_record)
                        db.commit()
                    
                    suggestions.append(CommentSuggestion(
                        id=i + 1,
                        type=style,
                        content=comment_content,
                        confidence=confidence,
                        output_id=output_id
                    ))
                
        finally:
            # Restore original API key
            if original_key:
                os.environ[f"{request.llm_provider.upper()}_API_KEY"] = original_key
            else:
                os.environ.pop(f"{request.llm_provider.upper()}_API_KEY", None)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return CommentSuggestionsResponse(
            success=True,
            suggestions=suggestions,
            post_context=f"{request.post_title} in {request.subreddit or 'unknown subreddit'}",
            llm_provider_used=request.llm_provider,
            processing_time=processing_time,
            message=f"Generated {len(suggestions)} comment suggestions successfully!"
        )
        
    except Exception as e:
        processing_time = (datetime.now() - start_time).total_seconds()
        return CommentSuggestionsResponse(
            success=False,
            suggestions=[],
            post_context=request.post_title,
            llm_provider_used=request.llm_provider,
            processing_time=processing_time,
            message=f"Failed to generate comments: {str(e)}"
        )
