from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

from stream_agent.common.schemas import Document
from stream_agent.api.schemas import SubredditConfig, AIGeneratedComment, User


class SubredditResponse(BaseModel):
    id: str
    subreddit: str
    time_range: str
    limit: int
    target_number: int
    audience_specification: str
    subreddit_description: str
    owner_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class RunResponse(BaseModel):
    id: str
    name: str
    subreddit_id: str
    created_at: datetime
    status: str

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    id: str
    title: str
    content: str
    url: Optional[str] = None
    created_at: datetime
    doc_metadata: Optional[Dict[str, Any]] = None
    run_id: str

    class Config:
        from_attributes = True


class CommentResponse(BaseModel):
    id: str
    content: str
    tone: str
    document_id: str
    comment_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProcessSubredditResponse(BaseModel):
    subreddit: str
    run_id: str
    documents_count: int
    document_ids: List[str]


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SubredditWithRunsResponse(BaseModel):
    id: str
    subreddit: str
    time_range: str
    limit: int
    target_number: int
    audience_specification: str
    subreddit_description: str
    owner_id: str
    created_at: datetime
    runs: List[RunResponse]

    class Config:
        from_attributes = True


class RunWithDocumentsResponse(BaseModel):
    id: str
    name: str
    subreddit_id: str
    created_at: datetime
    status: str
    documents: List[DocumentResponse]

    class Config:
        from_attributes = True


class DocumentWithCommentsResponse(BaseModel):
    id: str
    title: str
    content: str
    url: Optional[str] = None
    created_at: datetime
    doc_metadata: Optional[Dict[str, Any]] = None
    run_id: str
    comments: List[CommentResponse]

    class Config:
        from_attributes = True