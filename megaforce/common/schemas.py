from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, HttpUrl

class ContentType(str, Enum):
    """Defines the allowed content types for a ContentItem."""

    TWITTER = "Twitter"
    BLOG = "Blog"
    LINKEDIN = "LinkedIn"
    REDDIT = "Reddit"
    FACEBOOK = "Facebook"
    INSTAGRAM = "Instagram"
    TIKTOK = "TikTok"


class DocumentCategory(str, Enum):
    """Categories for document classification."""

    CASUAL = "Casual"
    FORMAL = "Formal"
    VERY_FORMAL = "Very Formal"
    FUNNY = "Funny"
    PROFESSIONAL = "Professional"
    TECHNICAL = "Technical"
    CREATIVE = "Creative"
    ACADEMIC = "Academic"
    JOURNALISTIC = "Journalistic"
    MARKETING = "Marketing"


class DocumentType(str, Enum):
    """Supported file types for documents."""

    TXT = "txt"
    MARKDOWN = "markdown"
    HTML = "website"
    PDF = "pdf"
    DOCX = "docx"


class Document(BaseModel):
    """Comprehensive document schema for input documents."""

    url: HttpUrl = Field(description="URL to the document")
    type: ContentType = Field(
        description="Type of content (e.g., Twitter, LinkedIn, Blog, etc.)",
    )
    category: DocumentCategory = Field(
        description="Category (e.g., Casual, Formal, Very Formal, Funny, etc.)",
    )
    file_type: DocumentType | None = Field(
        default=None,
        description="File type if applicable",
    )
    title: str | None = Field(default=None, description="Document title if available")
    author: str | None = Field(default=None, description="Document author if available")
    date_published: datetime | None = Field(
        default=None,
        description="Publication date if available",
    )
    content: str | None = Field(
        default=None,
        description="The actual text content of the document",
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata",
    )