from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean, ForeignKey, JSON, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

from api.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"


class InputSourceType(str, enum.Enum):
    TWITTER_KEYWORDS = "twitter_keywords"
    TWITTER_USER = "twitter_user"
    TWITTER_HASHTAG = "twitter_hashtag"
    REDDIT_SUBREDDIT = "reddit_subreddit"
    URL_SCRAPER = "url_scraper"


class OutputStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHED = "published"


class OutputType(str, enum.Enum):
    TWEET_SINGLE = "TWEET_SINGLE"  # Match database values
    TWEET_THREAD = "TWITTER_THREAD"  # Match database values
    SOCIAL_COMMENT = "SOCIAL_COMMENT"  # Will add to database
    TWITTER_REPLY = "TWITTER_REPLY"  # Match database values
    LINKEDIN_POST = "LINKEDIN_POST"  # Will add to database
    LINKEDIN_COMMENT = "LINKEDIN_COMMENT"  # Will add to database
    BLOG_POST = "BLOG_POST"  # Match database values
    REDDIT_COMMENT = "REDDIT_COMMENT"  # Match database values
    FACEBOOK_COMMENT = "FACEBOOK_COMMENT"  # Will add to database
    INSTAGRAM_COMMENT = "INSTAGRAM_COMMENT"  # Will add to database
    YOUTUBE_COMMENT = "YOUTUBE_COMMENT"  # Will add to database


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    input_sources = relationship("InputSource", back_populates="owner")
    personas = relationship("Persona", back_populates="owner")
    documents = relationship("Document", back_populates="owner")


class Persona(Base):
    """Represents an 'author' persona for content generation."""
    __tablename__ = "personas"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    style_preferences = Column(JSON)  # Tone, voice, writing style preferences
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="personas")
    style_document_links = relationship("PersonaStyleLink", back_populates="persona", cascade="all, delete-orphan")
    output_schemas = relationship("OutputSchema", back_populates="persona")


class PersonaStyleLink(Base):
    """Links documents to personas as style references (many-to-many)."""
    __tablename__ = "persona_style_links"
    
    id = Column(String, primary_key=True, index=True)
    persona_id = Column(String, ForeignKey("personas.id"), nullable=False)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)  # Why this document represents the persona's style
    
    # Relationships
    persona = relationship("Persona", back_populates="style_document_links")
    document = relationship("Document", back_populates="persona_style_links")


class InputSource(Base):
    """Input sources/triggers for content generation."""
    __tablename__ = "input_sources"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    source_type = Column(Enum(InputSourceType), nullable=False)
    config = Column(JSON, nullable=False)  # Source-specific configuration
    schedule_config = Column(JSON)  # Scheduling configuration
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="input_sources")
    runs = relationship("Run", back_populates="input_source", cascade="all, delete-orphan")


class Run(Base):
    """Execution runs for input sources."""
    __tablename__ = "runs"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    input_source_id = Column(String, ForeignKey("input_sources.id"), nullable=False)
    status = Column(String, default="running")  # running, completed, failed
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    meta_data = Column(JSON)  # Run-specific metadata

    # Relationships
    input_source = relationship("InputSource", back_populates="runs")
    documents = relationship("Document", back_populates="run", cascade="all, delete-orphan")


class Document(Base):
    """Unified documents for both source materials and style references."""
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    url = Column(String)
    author = Column(String)
    score = Column(Integer, default=0)  # Ranking/relevance score
    priority = Column(Integer, default=0)  # Priority for processing
    platform_data = Column(JSON)  # Platform-specific metadata
    
    # Enhanced fields for unified model
    document_type = Column(String, default="source_material")  # "source_material" or "style_reference"
    reference_type = Column(String)  # url, tweet, document, pdf, markdown
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)  # Direct user ownership
    is_style_reference = Column(Boolean, default=False)  # Quick filter flag
    
    # Optional run relationship (null for manually added style references)
    run_id = Column(String, ForeignKey("runs.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="documents")
    run = relationship("Run", back_populates="documents")
    output_schemas = relationship("OutputSchema", back_populates="source_document")
    persona_style_links = relationship("PersonaStyleLink", back_populates="document", cascade="all, delete-orphan")


class OutputSchema(Base):
    """Generated content with approval workflow."""
    __tablename__ = "output_schemas"

    id = Column(String, primary_key=True, index=True)
    content_type = Column(Enum(OutputType), nullable=False)
    generated_content = Column(Text, nullable=False)
    status = Column(Enum(OutputStatus), default=OutputStatus.DRAFT)
    score = Column(Float)  # Quality/approval score (1-10)
    feedback_notes = Column(Text)  # Reviewer feedback
    
    # Foreign keys
    persona_id = Column(String, ForeignKey("personas.id"), nullable=False)
    source_document_id = Column(String, ForeignKey("documents.id"))
    
    # Workflow tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime)
    published_at = Column(DateTime)
    
    # Publishing metadata
    publish_config = Column(JSON)  # Platform-specific publishing configuration
    published_url = Column(String)  # URL of published content

    # Relationships
    persona = relationship("Persona", back_populates="output_schemas")
    source_document = relationship("Document", back_populates="output_schemas")
    approval_history = relationship("ApprovalHistory", back_populates="output_schema", cascade="all, delete-orphan")


class ApprovalHistory(Base):
    """Track approval workflow history."""
    __tablename__ = "approval_history"

    id = Column(String, primary_key=True, index=True)
    output_schema_id = Column(String, ForeignKey("output_schemas.id"), nullable=False)
    action = Column(String, nullable=False)  # edit, approve, reject, publish
    previous_status = Column(Enum(OutputStatus))
    new_status = Column(Enum(OutputStatus))
    notes = Column(Text)
    score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    output_schema = relationship("OutputSchema", back_populates="approval_history")
