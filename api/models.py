from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, JSON, Enum, Float, UniqueConstraint
from sqlalchemy.orm import relationship
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
    # New lowercase format (preferred)
    TWEET_SINGLE = "tweet_single"
    TWEET_THREAD = "tweet_thread"
    SOCIAL_COMMENT = "social_comment"
    TWITTER_REPLY = "twitter_reply"
    LINKEDIN_POST = "linkedin_post"
    LINKEDIN_COMMENT = "linkedin_comment"
    BLOG_POST = "blog_post"
    REDDIT_COMMENT = "reddit_comment"
    FACEBOOK_COMMENT = "facebook_comment"
    INSTAGRAM_COMMENT = "instagram_comment"
    YOUTUBE_COMMENT = "youtube_comment"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    role = Column(Enum(UserRole), default=UserRole.USER)
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
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    reference_style = Column(JSON, nullable=True, default=None)

    # Relationships
    owner = relationship("User", back_populates="personas")
    output_schemas = relationship("OutputSchema", back_populates="persona")
    connections = relationship("PersonaIntegration", back_populates="persona", cascade="all, delete-orphan")


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
    reference_type = Column(String, nullable=True)  # "tweet", "url", "document", etc.
    persona_ids = Column(JSON, default=list)  # Array of persona IDs for style references
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    # Optional run relationship (null for manually added style references)
    run_id = Column(String, ForeignKey("runs.id"), nullable=True)
    # Optional generation run relationship (groups mixed sources for generation)
    generation_run_id = Column(String, ForeignKey("generation_runs.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="documents")
    run = relationship("Run", back_populates="documents")
    output_schemas = relationship("OutputSchema", back_populates="source_document")
    generation_run = relationship("GenerationRun", back_populates="documents")


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


class AppSetting(Base):
    """Global application settings (single row expected)."""
    __tablename__ = "app_settings"

    id = Column(String, primary_key=True, index=True)
    timezone = Column(String, nullable=False, default="UTC")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class GenerationRun(Base):
    """User-initiated batch of sources to generate content from (URLs, Twitter, etc.)."""
    __tablename__ = "generation_runs"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="created")  # created, loading, ready
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    documents = relationship("Document", back_populates="generation_run", cascade="all, delete-orphan")


class GenerationJobStatus(str, enum.Enum):
    CREATED = "created"
    PROCESSING = "processing"
    APPROVED = "approved"
    SCHEDULED = "scheduled"
    POSTED = "posted"
    FAILED = "failed"


class GenerationJob(Base):
    """A job to generate content from a generation run's sources for a persona."""
    __tablename__ = "generation_jobs"

    id = Column(String, primary_key=True, index=True)
    generation_run_id = Column(String, ForeignKey("generation_runs.id"), nullable=False)
    persona_id = Column(String, ForeignKey("personas.id"), nullable=False)
    content_type = Column(Enum(OutputType), nullable=False)
    source_selection = Column(String, default="all")  # For now only "all"
    status = Column(Enum(GenerationJobStatus), default=GenerationJobStatus.CREATED)
    generated_content = Column(Text)  # JSON string from LLM output
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    generation_run = relationship("GenerationRun")
    persona = relationship("Persona")


class Integration(Base):
    """Supported external integrations (e.g., Twitter, LinkedIn)."""
    __tablename__ = "integrations"

    id = Column(String, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)  # e.g., "twitter", "linkedin"
    name = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    persona_connections = relationship("PersonaIntegration", back_populates="integration", cascade="all, delete-orphan")


class PersonaIntegration(Base):
    """Join table linking a Persona to an Integration with metadata and status.

    Each persona can have at most one connection per integration type.
    """
    __tablename__ = "persona_integrations"

    id = Column(String, primary_key=True, index=True)
    persona_id = Column(String, ForeignKey("personas.id"), nullable=False)
    integration_id = Column(String, ForeignKey("integrations.id"), nullable=False)
    connected = Column(Boolean, default=False)
    meta = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("persona_id", "integration_id", name="uq_persona_integration"),
    )

    # Relationships
    persona = relationship("Persona", back_populates="connections")
    integration = relationship("Integration", back_populates="persona_connections")
