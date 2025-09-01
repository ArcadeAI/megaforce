from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

from api.models import UserRole, InputSourceType, OutputStatus, OutputType
from megaforce.common.schemas import ReferenceStyle


# General verification schema (Arcade custom verifier)
class VerifyResponse(BaseModel):
    success: bool
    auth_id: Optional[str] = None
    next_uri: Optional[str] = None
    status: Optional[str] = None
    message: Optional[str] = None
    persona_id: Optional[str] = None


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


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, description="New password must be at least 8 characters")


# Auth/session exposure schemas
class WorkOSUser(BaseModel):
    """Shape of the WorkOS user object we expose to clients (no org info)."""
    object: str
    id: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email_verified: Optional[bool] = None
    profile_picture_url: Optional[str] = None
    last_sign_in_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    external_id: Optional[str] = None
    metadata: Dict[str, Any] = {}


class MeResponse(BaseModel):
    authenticated: bool
    user: WorkOSUser


# Persona schemas
class PersonaBase(BaseModel):
    name: str
    description: Optional[str] = None
    reference_style: ReferenceStyle | None = None


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
    input_source: Optional[InputSourceResponse] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


"""
Generation Runs
"""
class GenerationRunBase(BaseModel):
    name: str
    status: str = "created"


class GenerationRunCreate(BaseModel):
    name: Optional[str] = None


class GenerationRunResponse(GenerationRunBase):
    id: str
    owner_id: str
    created_at: datetime
    sources_count: int = 0

    class Config:
        from_attributes = True


# Document schemas (unified for source materials and style references)
class DocumentBase(BaseModel):
    title: str
    content: str
    url: Optional[str] = None
    author: Optional[str] = None
    score: int = 0
    priority: int = 0
    platform_data: Optional[Dict[str, Any]] = None
    reference_type: Optional[str] = None  # "tweet", "url", "document", etc.
    document_type: str = "source_material"  # "source_material" or "style_reference"
    is_style_reference: bool = False


class DocumentCreate(DocumentBase):
    run_id: Optional[str] = None  # Optional for manually added style references
    owner_id: Optional[str] = None  # Will be set to current user if not provided
    persona_ids: Optional[List[str]] = []  # Array of persona IDs for style references
    generation_run_id: Optional[str] = None


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    url: Optional[str] = None
    author: Optional[str] = None
    score: Optional[int] = None
    priority: Optional[int] = None
    platform_data: Optional[Dict[str, Any]] = None
    reference_type: Optional[str] = None
    persona_ids: Optional[List[str]] = None


class DocumentResponse(DocumentBase):
    id: str
    owner_id: str
    run_id: Optional[str] = None
    generation_run_id: Optional[str] = None
    created_at: datetime
    persona_count: Optional[int] = 0  # Number of linked personas
    persona_ids: Optional[List[str]] = []  # Array of linked persona IDs

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
    published_url: Optional[str] = None


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


# Scheduling schemas
class ScheduleRequest(BaseModel):
    schedule_time: datetime


class ScheduleResponse(BaseModel):
    message: str
    task_id: str
    scheduled_at: datetime


# Settings schemas
class AppSettings(BaseModel):
    id: str
    timezone: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UpdateAppSettings(BaseModel):
    timezone: str


# Twitter-specific schemas
class TwitterSearchRequest(BaseModel):
    search_type: str = Field(..., description="keywords, user, hashtag")
    search_query: str
    limit: int = Field(default=20, ge=1, le=100)
    target_number: int = Field(default=20, ge=1, le=50)
    rank_tweets: bool
    persona_id: Optional[str] = Field(None, description="Optional persona ID to assign found tweets to")
    generation_run_id: Optional[str] = Field(None, description="Generation run ID to group found tweets under")

class TwitterSearchResponse(BaseModel):
    documents: List[DocumentResponse]
    run_id: str
    total_found: int
    processing_time: float

    class Config:
        from_attributes = True


# Twitter posting schemas
class TwitterPostRequest(BaseModel):
    output_id: Optional[str] = Field(None, description="Output ID to post (uses its content and persona_id)")

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


# Twitter OAuth connect schemas
class TwitterConnectRequest(BaseModel):
    persona_id: str = Field(..., description="Persona to associate the Twitter account with")


class TwitterConnectResponse(BaseModel):
    oauth_url: str = Field(..., description="URL to redirect the user to complete OAuth")
    state: str = Field(..., description="Opaque state used to correlate the OAuth flow")
    message: Optional[str] = None


# Style Agent schemas
class StyleTransferRequest(BaseModel):
    content: str = Field(..., description="The content to transform with style")
    style_description: Optional[str] = Field(None, description="Description of the desired style (optional if persona_id provided)")
    persona_id: Optional[str] = Field(None, description="ID of persona to use for style transfer (optional, overrides style_description)")
    output_format: str = Field(default="tweet", description="Output format: tweet, thread, post, etc.")
    max_length: Optional[int] = Field(280, description="Maximum character length for output")
    
    # LLM Provider Configuration (with .env fallbacks)
    llm_provider: str = Field(default="openai", description="LLM provider: openai, anthropic, google")
    llm_model: Optional[str] = Field(None, description="Specific model to use (optional, defaults to provider default)")
    
    @field_validator('style_description')
    @classmethod
    def validate_style_or_persona(cls, v, info):
        """Ensure either style_description or persona_id is provided."""
        if not v and not info.data.get('persona_id'):
            raise ValueError('Either style_description or persona_id must be provided')
        return v
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


# Comment generation schemas
class Comment(BaseModel):
    """Individual comment data."""
    text: str
    
class CommentResponse(BaseModel):
    """Response from comment generation endpoint."""
    success: bool
    comment: Comment
    style: str
    confidence: int
    output_id: str
    post_context: str
    llm_provider_used: str
    processing_time: float
    message: str


# URL schemas
class URLRequest(BaseModel):
    url: str
    # TODO(Mateo): Add tone inference fields here in the future
    persona_id: Optional[str] = Field(None, description="Persona ID to assign the document to")
    generation_run_id: Optional[str] = Field(None, description="Generation run ID to group this source under")

class URLResponse(BaseModel):
    document: DocumentResponse