from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    subreddits = relationship("Subreddit", back_populates="owner")


class Subreddit(Base):
    __tablename__ = "subreddits"

    id = Column(String, primary_key=True, index=True)
    subreddit = Column(String, nullable=False)
    time_range = Column(String, nullable=False)
    limit = Column(Integer, nullable=False)
    target_number = Column(Integer, nullable=False)
    audience_specification = Column(Text, nullable=False)
    subreddit_description = Column(Text, nullable=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="subreddits")
    runs = relationship("Run", back_populates="subreddit", cascade="all, delete-orphan")


class Run(Base):
    __tablename__ = "runs"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Date-based name
    subreddit_id = Column(String, ForeignKey("subreddits.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="completed")  # completed, failed, in_progress

    # Relationships
    subreddit = relationship("Subreddit", back_populates="runs")
    documents = relationship("Document", back_populates="run", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    doc_metadata = Column(JSON, nullable=True)
    run_id = Column(String, ForeignKey("runs.id"), nullable=False)

    # Relationships
    run = relationship("Run", back_populates="documents")
    comments = relationship("AIGeneratedComment", back_populates="document", cascade="all, delete-orphan")


class AIGeneratedComment(Base):
    __tablename__ = "ai_generated_comments"

    id = Column(String, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    tone = Column(String, nullable=False)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    comment_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="comments")