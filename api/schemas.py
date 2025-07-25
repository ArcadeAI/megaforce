from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

from api.models import UserRole, InputSourceType, OutputStatus, OutputType


# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class User(UserBase):
    id: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# Persona schemas
class PersonaBase(BaseModel):
    name: str
    description: Optional[str] = None
    style_preferences: Optional[Dict[str, Any]] = None


class PersonaCreate(PersonaBase):
    pass


class PersonaUpdate(PersonaBase):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class PersonaResponse(PersonaBase):
    id: str
    owner_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Style Reference schemas
class StyleReferenceBase(BaseModel):
    reference_type: str = Field(..., description="Type: url, tweet, pdf, markdown")
    content_url: Optional[str] = None
    content_text: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None


class StyleReferenceCreate(StyleReferenceBase):
    pass


class StyleReferenceResponse(StyleReferenceBase):
    id: str
    persona_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Input Source schemas
class InputSourceBase(BaseModel):
    name: str
    source_type: InputSourceType
    config: Dict[str, Any]
    schedule_config: Optional[Dict[str, Any]] = None


class InputSourceCreate(InputSourceBase):
    pass


class InputSourceUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    schedule_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class InputSourceResponse(InputSourceBase):
    id: str
    owner_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Run schemas
class RunBase(BaseModel):
    name: str
    status: str = "running"
    meta_data: Optional[Dict[str, Any]] = None


class RunResponse(RunBase):
    id: str
    input_source_id: str
    started_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Document schemas
class DocumentBase(BaseModel):
    title: str
    content: str
    url: Optional[str] = None
    author: Optional[str] = None
    score: int = 0
    priority: int = 0
    platform_data: Optional[Dict[str, Any]] = None


class DocumentResponse(DocumentBase):
    id: str
    run_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Output Schema schemas
class OutputSchemaBase(BaseModel):
    content_type: OutputType
    generated_content: str
    persona_id: str
    source_document_id: Optional[str] = None
    publish_config: Optional[Dict[str, Any]] = None


class OutputSchemaCreate(OutputSchemaBase):
    pass


class OutputSchemaUpdate(BaseModel):
    generated_content: Optional[str] = None
    status: Optional[OutputStatus] = None
    score: Optional[float] = None
    feedback_notes: Optional[str] = None
    publish_config: Optional[Dict[str, Any]] = None


class OutputSchemaResponse(OutputSchemaBase):
    id: str
    status: OutputStatus
    score: Optional[float] = None
    feedback_notes: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    published_url: Optional[str] = None

    class Config:
        from_attributes = True


# Approval workflow schemas
class ApprovalAction(BaseModel):
    """Action for approval workflow."""
    action: str = Field(..., description="Action: approve, reject, edit")
    notes: Optional[str] = None
    score: Optional[float] = Field(None, ge=1.0, le=10.0)


class ApprovalRequest(BaseModel):
    """Request for approving/rejecting output schemas."""
    score: Optional[float] = Field(None, ge=1.0, le=10.0, description="Score from 1-10")
    feedback: Optional[str] = Field(None, description="Feedback notes")


class ApprovalHistoryResponse(BaseModel):
    id: str
    action: str
    previous_status: Optional[OutputStatus] = None
    new_status: Optional[OutputStatus] = None
    notes: Optional[str] = None
    score: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Twitter-specific schemas
class TwitterSearchRequest(BaseModel):
    search_type: str = Field(..., description="keywords, user, hashtag")
    search_query: str
    limit: int = Field(default=10, ge=1, le=100)
    target_number: int = Field(default=5, ge=1, le=50)
    audience_specification: str = Field(default="All audiences")
    rank_tweets: bool = True
    
    # Optional Arcade credentials (falls back to .env if not provided)
    arcade_user_id: Optional[str] = Field(None, description="Arcade user ID (optional, defaults to .env)")
    arcade_api_key: Optional[str] = Field(None, description="Arcade API key (optional, defaults to .env)")
    arcade_provider: Optional[str] = Field("x", description="Arcade provider name (defaults to 'x')")


class TwitterSearchResponse(BaseModel):
    documents: List[DocumentResponse]
    run_id: str
    total_found: int
    processing_time: float

    class Config:
        from_attributes = True


# Twitter posting schemas
class TwitterPostRequest(BaseModel):
    tweet_text: str = Field(..., description="The text content of the tweet to post", max_length=280)
    
    # Optional Arcade credentials (falls back to .env if not provided)
    arcade_user_id: Optional[str] = Field(None, description="Arcade user ID (optional, defaults to .env)")
    arcade_api_key: Optional[str] = Field(None, description="Arcade API key (optional, defaults to .env)")
    arcade_provider: Optional[str] = Field("x", description="Arcade provider name (defaults to 'x')")


class TwitterPostResponse(BaseModel):
    success: bool
    tweet_id: Optional[str] = None
    tweet_url: Optional[str] = None
    message: str
    posted_at: Optional[datetime] = None


class TwitterDeleteRequest(BaseModel):
    tweet_id: str = Field(..., description="The ID of the tweet to delete")
    
    # Optional Arcade credentials (falls back to .env if not provided)
    arcade_user_id: Optional[str] = Field(None, description="Arcade user ID (optional, defaults to .env)")
    arcade_api_key: Optional[str] = Field(None, description="Arcade API key (optional, defaults to .env)")
    arcade_provider: Optional[str] = Field("x", description="Arcade provider name (defaults to 'x')")


class TwitterDeleteResponse(BaseModel):
    success: bool
    tweet_id: str
    message: str
    deleted_at: Optional[datetime] = None


# Style Agent schemas
class StyleTransferRequest(BaseModel):
    content: str = Field(..., description="The content to transform with style")
    style_description: str = Field(..., description="Description of the desired style")
    output_format: str = Field(default="tweet", description="Output format: tweet, thread, post, etc.")
    max_length: Optional[int] = Field(280, description="Maximum character length for output")
    
    # LLM Provider Configuration (with .env fallbacks)
    llm_provider: str = Field(default="anthropic", description="LLM provider: openai, anthropic, google")
    llm_model: Optional[str] = Field(None, description="Specific model to use (optional, defaults to provider default)")
    openai_api_key: Optional[str] = Field(None, description="OpenAI API key (optional, defaults to .env)")
    anthropic_api_key: Optional[str] = Field(None, description="Anthropic API key (optional, defaults to .env)")
    google_api_key: Optional[str] = Field(None, description="Google API key (optional, defaults to .env)")
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0, description="LLM temperature for creativity")


class StyleTransferResponse(BaseModel):
    success: bool
    transformed_content: Optional[str] = None
    original_content: str
    style_applied: str
    character_count: int
    llm_provider_used: str
    processing_time: float
    message: str


# Dashboard/UI specific schemas
class DashboardStats(BaseModel):
    total_input_sources: int
    active_runs: int
    pending_approvals: int
    published_today: int


class PostSummary(BaseModel):
    """Summary format expected by the UI dashboard."""
    id: str
    title: str
    author: Optional[str] = None
    score: int
    comments: int = 0
    time_ago: str
    priority: int
    url: Optional[str] = None
    preview: str
    subreddit: Optional[str] = None  # For Reddit posts
    platform: str = "twitter"  # twitter, reddit, etc.


class SubredditSummary(BaseModel):
    """Summary format for sidebar subreddit list."""
    name: str
    posts: int
    priority: str  # high, medium, low
