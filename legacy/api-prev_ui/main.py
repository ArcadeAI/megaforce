import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from api.database import get_db, engine, Base
from api.auth import get_current_user
from api.models import User as UserModel, InputSource, Run, Document, OutputSchema
from api.schemas import (
    UserCreate, UserLogin, User, Token,
    InputSourceCreate, InputSourceResponse,
    RunResponse, DocumentResponse, OutputSchemaResponse,
    TwitterSearchRequest, TwitterSearchResponse
)
from api.routers import auth, input_sources, runs, documents, outputs, twitter, style, personas

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
    title="Megaforce Social Media API",
    description="API for managing social media content generation and approval workflows",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Allow all origins for production
        "http://localhost:3000",  # Next.js dev server
        "http://localhost:3001",  # Alternative Next.js port
        "http://127.0.0.1:3000",  # Alternative localhost format
        "http://127.0.0.1:3001",  # Alternative localhost format
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(input_sources.router, prefix="/api/v1/input-sources", tags=["input-sources"])
app.include_router(runs.router, prefix="/api/v1/runs", tags=["runs"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(outputs.router, prefix="/api/v1/outputs", tags=["outputs"])
app.include_router(personas.router, prefix="/api/v1/personas", tags=["personas"])

app.include_router(twitter.router, prefix="/api/v1/twitter", tags=["twitter"])
app.include_router(style.router, prefix="/api/v1/style", tags=["style-agent"])

@app.get("/")
async def root():
    return {"message": "Megaforce Social Media API", "version": "1.0.0"}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint for monitoring."""
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected",
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
