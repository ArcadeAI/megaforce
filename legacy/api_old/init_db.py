from sqlalchemy import create_engine
from stream_agent.api.database import Base, DATABASE_URL
from stream_agent.api.models import User, Subreddit, Run, Document, AIGeneratedComment
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_tables():
    """Create all database tables."""
    logger.info("Creating database tables...")

    # Create engine
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
    )

    # Create all tables
    Base.metadata.create_all(bind=engine)

    logger.info("Database tables created successfully!")


if __name__ == "__main__":
    create_tables()