import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from stream_agent.common.schemas import Document
from stream_agent.api.schemas import SubredditConfig, AIGeneratedComment, UserCreate, UserLogin, User, Token
from stream_agent.api.response_models import (
    SubredditResponse, DocumentResponse, CommentResponse, ProcessSubredditResponse,
    UserResponse, RunResponse, SubredditWithRunsResponse, RunWithDocumentsResponse,
    DocumentWithCommentsResponse
)
from stream_agent.api.models import (
    User as UserModel, Subreddit as SubredditModel, Run as RunModel,
    Document as DocumentModel, AIGeneratedComment as CommentModel
)
from stream_agent.api.database import get_db, engine, Base
from stream_agent.api.auth import (
    authenticate_user, create_access_token, get_password_hash, get_current_user,
    get_user_by_username, get_user_by_email
)
from stream_agent.parser_agents.reddit.agent import get_content, InputSchema
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Stream Agent API",
    description="API for managing subreddits, documents, and AI-generated comments",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication endpoints
@app.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if username already exists
    if get_user_by_username(db, user_data.username):
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )

    # Check if email already exists
    if get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)

    user = UserModel(
        id=user_id,
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        is_active=True
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    logger.info(f"Registered new user: {user_data.username}")
    return UserResponse.from_orm(user)


@app.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login and get access token."""
    user = authenticate_user(db, user_data.username, user_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    logger.info(f"User logged in: {user.username}")
    return Token(access_token=access_token, token_type="bearer")


@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserModel = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse.from_orm(current_user)

# Subreddit endpoints
@app.post("/subreddits/", response_model=SubredditResponse)
async def add_subreddit(
    config: SubredditConfig,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new subreddit configuration."""
    subreddit_id = str(uuid.uuid4())

    subreddit = SubredditModel(
        id=subreddit_id,
        subreddit=config.subreddit,
        time_range=config.time_range,
        limit=config.limit,
        target_number=config.target_number,
        audience_specification=config.audience_specification,
        subreddit_description=config.subreddit_description,
        owner_id=current_user.id
    )

    db.add(subreddit)
    db.commit()
    db.refresh(subreddit)

    logger.info(f"Added subreddit: {config.subreddit} by user: {current_user.username}")
    return SubredditResponse.from_orm(subreddit)

@app.get("/subreddits/", response_model=List[SubredditResponse])
async def get_subreddits(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all subreddit configurations for the current user."""
    subreddits = db.query(SubredditModel).filter(SubredditModel.owner_id == current_user.id).all()
    return [SubredditResponse.from_orm(subreddit) for subreddit in subreddits]

@app.get("/subreddits/{subreddit_id}", response_model=SubredditWithRunsResponse)
async def get_subreddit(
    subreddit_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific subreddit configuration with its runs."""
    subreddit = db.query(SubredditModel).filter(
        SubredditModel.id == subreddit_id,
        SubredditModel.owner_id == current_user.id
    ).first()

    if not subreddit:
        raise HTTPException(status_code=404, detail="Subreddit not found")

    return SubredditWithRunsResponse.from_orm(subreddit)

@app.put("/subreddits/{subreddit_id}", response_model=SubredditResponse)
async def update_subreddit(
    subreddit_id: str,
    config: SubredditConfig,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a subreddit configuration."""
    subreddit = db.query(SubredditModel).filter(
        SubredditModel.id == subreddit_id,
        SubredditModel.owner_id == current_user.id
    ).first()

    if not subreddit:
        raise HTTPException(status_code=404, detail="Subreddit not found")

    subreddit.subreddit = config.subreddit
    subreddit.time_range = config.time_range
    subreddit.limit = config.limit
    subreddit.target_number = config.target_number
    subreddit.audience_specification = config.audience_specification
    subreddit.subreddit_description = config.subreddit_description

    db.commit()
    db.refresh(subreddit)

    logger.info(f"Updated subreddit: {config.subreddit} by user: {current_user.username}")
    return SubredditResponse.from_orm(subreddit)

@app.delete("/subreddits/{subreddit_id}")
async def delete_subreddit(
    subreddit_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a subreddit configuration."""
    subreddit = db.query(SubredditModel).filter(
        SubredditModel.id == subreddit_id,
        SubredditModel.owner_id == current_user.id
    ).first()

    if not subreddit:
        raise HTTPException(status_code=404, detail="Subreddit not found")

    subreddit_name = subreddit.subreddit
    db.delete(subreddit)
    db.commit()

    logger.info(f"Deleted subreddit: {subreddit_name} by user: {current_user.username}")
    return {"message": f"Subreddit {subreddit_name} deleted successfully"}

@app.post("/subreddits/{subreddit_id}/process", response_model=ProcessSubredditResponse)
async def process_subreddit(
    subreddit_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process a subreddit and save the documents in a new run."""
    subreddit = db.query(SubredditModel).filter(
        SubredditModel.id == subreddit_id,
        SubredditModel.owner_id == current_user.id
    ).first()

    if not subreddit:
        raise HTTPException(status_code=404, detail="Subreddit not found")

    # Convert SubredditModel to InputSchema
    input_schema = InputSchema(
        subreddit=subreddit.subreddit,
        time_range=subreddit.time_range,
        limit=subreddit.limit,
        target_number=subreddit.target_number,
        audience_specification=subreddit.audience_specification,
        subreddit_description=subreddit.subreddit_description
    )

    try:
        # Get content from the subreddit
        documents = await get_content(input_schema)

        # Create a new run
        run_id = str(uuid.uuid4())
        run_name = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        run = RunModel(
            id=run_id,
            name=run_name,
            subreddit_id=subreddit_id,
            status="completed"
        )

        db.add(run)
        db.commit()
        db.refresh(run)

        # Save documents to the run
        document_ids = []
        for doc in documents:
            doc_id = str(uuid.uuid4())
            document = DocumentModel(
                id=doc_id,
                title=doc.title,
                content=doc.content,
                url=str(doc.url),  # Convert HttpUrl to string
                doc_metadata=doc.metadata,
                run_id=run_id
            )
            db.add(document)
            document_ids.append(doc_id)

        db.commit()

        logger.info(f"Processed subreddit {subreddit.subreddit}: {len(documents)} documents saved in run {run_name}")

        return ProcessSubredditResponse(
            subreddit=subreddit.subreddit,
            run_id=run_id,
            documents_count=len(documents),
            document_ids=document_ids
        )
    except Exception as e:
        logger.error(f"Error processing subreddit {subreddit.subreddit}: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing subreddit: {str(e)}")

# Run endpoints
@app.get("/runs/", response_model=List[RunResponse])
async def get_runs(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all runs for the current user's subreddits."""
    runs = db.query(RunModel).join(SubredditModel).filter(
        SubredditModel.owner_id == current_user.id
    ).all()
    return [RunResponse.from_orm(run) for run in runs]

@app.get("/runs/{run_id}", response_model=RunWithDocumentsResponse)
async def get_run(
    run_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific run with its documents."""
    run = db.query(RunModel).join(SubredditModel).filter(
        RunModel.id == run_id,
        SubredditModel.owner_id == current_user.id
    ).first()

    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    return RunWithDocumentsResponse.from_orm(run)

@app.delete("/runs/{run_id}")
async def delete_run(
    run_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a run and all its documents."""
    run = db.query(RunModel).join(SubredditModel).filter(
        RunModel.id == run_id,
        SubredditModel.owner_id == current_user.id
    ).first()

    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    run_name = run.name
    db.delete(run)
    db.commit()

    logger.info(f"Deleted run: {run_name} by user: {current_user.username}")
    return {"message": f"Run {run_name} deleted successfully"}

# Document endpoints
@app.get("/documents/", response_model=List[DocumentResponse])
async def get_documents(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all documents for the current user."""
    documents = db.query(DocumentModel).join(RunModel).join(SubredditModel).filter(
        SubredditModel.owner_id == current_user.id
    ).all()
    return [DocumentResponse.from_orm(doc) for doc in documents]

@app.get("/documents/{document_id}", response_model=DocumentWithCommentsResponse)
async def get_document(
    document_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific document with its comments."""
    document = db.query(DocumentModel).join(RunModel).join(SubredditModel).filter(
        DocumentModel.id == document_id,
        SubredditModel.owner_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentWithCommentsResponse.from_orm(document)

@app.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a document."""
    document = db.query(DocumentModel).join(RunModel).join(SubredditModel).filter(
        DocumentModel.id == document_id,
        SubredditModel.owner_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(document)
    db.commit()

    logger.info(f"Deleted document: {document_id} by user: {current_user.username}")
    return {"message": f"Document {document_id} deleted successfully"}

# AI-generated comment endpoints
@app.post("/comments/", response_model=CommentResponse)
async def add_comment(
    comment: AIGeneratedComment,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new AI-generated comment."""
    # Verify the document belongs to the current user
    document = db.query(DocumentModel).join(RunModel).join(SubredditModel).filter(
        DocumentModel.id == comment.document_id,
        SubredditModel.owner_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    comment_id = str(uuid.uuid4())
    new_comment = CommentModel(
        id=comment_id,
        content=comment.content,
        tone=comment.tone,
        document_id=comment.document_id,
        comment_metadata=comment.metadata
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    logger.info(f"Added comment for document: {comment.document_id} by user: {current_user.username}")
    return CommentResponse.from_orm(new_comment)

@app.get("/comments/", response_model=List[CommentResponse])
async def get_comments(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all AI-generated comments for the current user."""
    comments = db.query(CommentModel).join(DocumentModel).join(RunModel).join(SubredditModel).filter(
        SubredditModel.owner_id == current_user.id
    ).all()
    return [CommentResponse.from_orm(comment) for comment in comments]

@app.get("/comments/{comment_id}", response_model=CommentResponse)
async def get_comment(
    comment_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific AI-generated comment."""
    comment = db.query(CommentModel).join(DocumentModel).join(RunModel).join(SubredditModel).filter(
        CommentModel.id == comment_id,
        SubredditModel.owner_id == current_user.id
    ).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    return CommentResponse.from_orm(comment)

@app.get("/documents/{document_id}/comments", response_model=List[CommentResponse])
async def get_document_comments(
    document_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all comments for a specific document."""
    # Verify the document belongs to the current user
    document = db.query(DocumentModel).join(RunModel).join(SubredditModel).filter(
        DocumentModel.id == document_id,
        SubredditModel.owner_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    comments = db.query(CommentModel).filter(CommentModel.document_id == document_id).all()
    return [CommentResponse.from_orm(comment) for comment in comments]

@app.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an AI-generated comment."""
    comment = db.query(CommentModel).join(DocumentModel).join(RunModel).join(SubredditModel).filter(
        CommentModel.id == comment_id,
        SubredditModel.owner_id == current_user.id
    ).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    db.delete(comment)
    db.commit()

    logger.info(f"Deleted comment: {comment_id} by user: {current_user.username}")
    return {"message": f"Comment {comment_id} deleted successfully"}

# Health check endpoint
@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint."""
    subreddits_count = db.query(SubredditModel).count()
    documents_count = db.query(DocumentModel).count()
    comments_count = db.query(CommentModel).count()

    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "subreddits_count": subreddits_count,
        "documents_count": documents_count,
        "comments_count": comments_count
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)