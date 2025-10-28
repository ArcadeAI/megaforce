from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

# Auth from workOS
from workos import WorkOSClient

from api.database import get_db, engine, Base, SessionLocal
from api.routers import auth, input_sources, runs, documents, outputs, twitter, style, personas
from api.routers import jobs as jobs_router
from api.routers import integrations as integrations_router
from api.routers import generation_runs as generation_runs_router
from api.routers import url as url_router
from api.routers import settings as settings_router
from dotenv import load_dotenv

import logging
import os


load_dotenv()

workos = WorkOSClient(
    api_key=os.getenv("WORKOS_API_KEY"),
    client_id=os.getenv("WORKOS_CLIENT_ID")
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed default integrations if missing
try:
    from api.models import Integration
    with SessionLocal() as _db:
        existing = _db.query(Integration).all()
        keys = {i.key for i in existing}
        seeds = [
            {"key": "twitter", "name": "Twitter / X", "description": "Connect a Twitter account for this persona."},
        ]
        new_items = []
        import uuid as _uuid
        for s in seeds:
            if s["key"] not in keys:
                new_items.append(Integration(id=str(_uuid.uuid4()), **s))
        if new_items:
            _db.add_all(new_items)
            _db.commit()
except Exception as _seed_err:
    print(f"DEBUG: Integration seeding skipped or failed: {_seed_err}")
    logger.warning(f"Integration seeding skipped or failed: {_seed_err}")

# Create FastAPI app
app = FastAPI(
    title="Megaforce Social Media API",
    description="API for managing social media content generation and approval workflows",
    version="1.0.0"
)

# Add CORS middleware
# Allow localhost for development and custom domains configured via env
_default_allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003",
    "http://localhost:8000",
]

# Include known production domains by default
_default_allowed_origins.extend([
    "https://megaforce.tech",
    "https://www.megaforce.tech",
    # While not strictly necessary (allowed origins are client origins), including the API
    # domain can help in some proxy setups where redirects or intermediate responses occur.
    "https://api.megaforce.tech",
])

_cors_env = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
if _cors_env:
    _extra = [o.strip() for o in _cors_env.split(",") if o.strip()]
    _default_allowed_origins.extend(_extra)

# Support wildcard subdomains for megaforce.tech via regex while keeping explicit list
# to ensure credentials can be used safely. If env provides additional origins,
# they are appended above.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_allowed_origins,
    allow_origin_regex=r"https:\/\/(.*\\.)?megaforce\\.tech$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(input_sources.router, prefix="/api/v1/input-sources", tags=["input-sources"])
app.include_router(runs.router, prefix="/api/v1/runs", tags=["runs"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(outputs.router, prefix="/api/v1/outputs", tags=["outputs"])
app.include_router(jobs_router.router, prefix="/api/v1/jobs", tags=["jobs"])
app.include_router(personas.router, prefix="/api/v1/personas", tags=["personas"])

app.include_router(twitter.router, prefix="/api/v1/twitter", tags=["twitter"])
app.include_router(integrations_router.router, prefix="/api/v1/integrations", tags=["integrations"])

# URL ingestion
app.include_router(url_router.router, prefix="/api/v1/url", tags=["url"])

# Generation Runs
app.include_router(generation_runs_router.router, prefix="/api/v1/generation-runs", tags=["generation-runs"])

# Settings
app.include_router(settings_router.router, prefix="/api/v1/settings", tags=["settings"])
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
