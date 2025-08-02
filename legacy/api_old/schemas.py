from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field, EmailStr
from stream_agent.common.schemas import DocumentCategory


class AIGeneratedComment(BaseModel):
    """Schema for AI-generated comments."""

    id: str = Field(description="Unique identifier for the comment")
    document_id: str = Field(description="ID of the document this comment relates to")
    content: str = Field(description="The AI-generated comment content")
    tone: DocumentCategory = Field(description="The tone/category of the comment")
    created_at: datetime = Field(default_factory=datetime.now, description="When the comment was created")
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata about the comment generation",
    )


class SubredditConfig(BaseModel):
    """Configuration for a subreddit to be processed."""

    subreddit: str = Field(description="The subreddit name")
    time_range: str = Field(description="Time range for fetching posts")
    limit: int = Field(description="Maximum number of posts to fetch")
    target_number: int = Field(description="Target number of posts to return")
    audience_specification: str = Field(description="Audience specification for content filtering")
    subreddit_description: str = Field(description="Description of the subreddit")
    active: bool = Field(default=True, description="Whether this subreddit is active for processing")
    created_at: datetime = Field(default_factory=datetime.now, description="When the subreddit was added")


# Authentication Schemas
class UserCreate(BaseModel):
    """Schema for user registration."""
    username: str = Field(min_length=3, max_length=50, description="Username")
    email: EmailStr = Field(description="Email address")
    password: str = Field(min_length=8, description="Password")


class UserLogin(BaseModel):
    """Schema for user login."""
    username: str = Field(description="Username")
    password: str = Field(description="Password")


class User(BaseModel):
    """Schema for user information."""
    id: str = Field(description="Unique user identifier")
    username: str = Field(description="Username")
    email: EmailStr = Field(description="Email address")
    is_active: bool = Field(default=True, description="Whether the user is active")
    created_at: datetime = Field(default_factory=datetime.now, description="When the user was created")


class Token(BaseModel):
    """Schema for authentication token."""
    access_token: str = Field(description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")


class TokenData(BaseModel):
    """Schema for token data."""
    username: Optional[str] = None