#!/usr/bin/env python3
"""
Script to fix document classification for migrated data.
Updates documents with Twitter URLs to have proper reference_type="tweet" and document_type="source_material".
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import Document
from database import get_db_url
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_document_classification():
    """Fix document classification for existing data."""
    
    # Create database connection
    db_url = get_db_url()
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    with SessionLocal() as db:
        try:
            # Find documents with Twitter URLs that need classification
            twitter_docs = db.query(Document).filter(
                Document.url.like('%x.com/status/%')
            ).all()
            
            logger.info(f"Found {len(twitter_docs)} documents with Twitter URLs")
            
            updated_count = 0
            for doc in twitter_docs:
                # Update classification for Twitter documents
                if doc.reference_type != "tweet" or doc.document_type != "source_material":
                    logger.info(f"Updating document {doc.id}: {doc.title[:50]}...")
                    doc.reference_type = "tweet"
                    doc.document_type = "source_material"
                    updated_count += 1
            
            # Also check for old twitter.com URLs
            old_twitter_docs = db.query(Document).filter(
                Document.url.like('%twitter.com/status/%')
            ).all()
            
            logger.info(f"Found {len(old_twitter_docs)} documents with old Twitter URLs")
            
            for doc in old_twitter_docs:
                # Update classification for old Twitter documents
                if doc.reference_type != "tweet" or doc.document_type != "source_material":
                    logger.info(f"Updating document {doc.id}: {doc.title[:50]}...")
                    doc.reference_type = "tweet"
                    doc.document_type = "source_material"
                    updated_count += 1
            
            # Find documents that look like URLs but aren't classified
            url_docs = db.query(Document).filter(
                Document.url.like('http%'),
                Document.reference_type.is_(None)
            ).all()
            
            logger.info(f"Found {len(url_docs)} documents with URLs but no reference_type")
            
            for doc in url_docs:
                if 'x.com/status/' in doc.url or 'twitter.com/status/' in doc.url:
                    doc.reference_type = "tweet"
                    doc.document_type = "source_material"
                    updated_count += 1
                    logger.info(f"Classified as tweet: {doc.title[:50]}...")
                else:
                    doc.reference_type = "url"
                    doc.document_type = "source_material"
                    updated_count += 1
                    logger.info(f"Classified as URL: {doc.title[:50]}...")
            
            # Find documents without reference_type that might be documents/PDFs
            unclassified_docs = db.query(Document).filter(
                Document.reference_type.is_(None),
                Document.url.is_(None)
            ).all()
            
            logger.info(f"Found {len(unclassified_docs)} unclassified documents without URLs")
            
            for doc in unclassified_docs:
                # Default to document type for unclassified items
                doc.reference_type = "document"
                doc.document_type = "source_material"
                updated_count += 1
                logger.info(f"Classified as document: {doc.title[:50]}...")
            
            # Commit all changes
            db.commit()
            logger.info(f"Successfully updated {updated_count} documents")
            
        except Exception as e:
            logger.error(f"Error updating documents: {e}")
            db.rollback()
            raise

if __name__ == "__main__":
    fix_document_classification()
