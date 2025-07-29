import uuid
import asyncio
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from api.database import get_db
from api.auth import get_current_active_user
from api.models import User, InputSource, Run, Document, InputSourceType
from api.schemas import (
    TwitterSearchRequest, TwitterSearchResponse, DocumentResponse,
    InputSourceCreate, InputSourceResponse, RunResponse,
    TwitterPostRequest, TwitterPostResponse,
    TwitterDeleteRequest, TwitterDeleteResponse
)

# Import the existing Twitter agents (DO NOT CHANGE AGENT LOGIC)
from parser_agents.x.agent import get_content
from parser_agents.x.schemas import InputSchema, SearchType
from posting_agents.x.agent import post_tweet, delete_tweet

router = APIRouter()





@router.post("/search", response_model=TwitterSearchResponse)
async def search_twitter(
    request: TwitterSearchRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Search Twitter/X using the existing agent and save results."""
    try:
        # Convert API request to agent input schema
        search_type_map = {
            "keywords": SearchType.KEYWORDS,
            "user": SearchType.USER,
            "hashtag": SearchType.HASHTAG,
            "phrases": SearchType.PHRASES
        }
        
        if request.search_type not in search_type_map:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid search_type. Must be one of: {list(search_type_map.keys())}"
            )
        
        # Create input schema for the agent
        agent_input = InputSchema(
            search_type=search_type_map[request.search_type],
            search_query=request.search_query,
            limit=request.limit,
            target_number=request.target_number,
            audience_specification=request.audience_specification,
            rank_tweets=request.rank_tweets
        )
        
        # Create a temporary input source record
        input_source = InputSource(
            id=str(uuid.uuid4()),
            name=f"Twitter Search: {request.search_query}",
            source_type=InputSourceType.TWITTER_KEYWORDS,
            config={
                "search_type": request.search_type,
                "search_query": request.search_query,
                "limit": request.limit,
                "target_number": request.target_number,
                "audience_specification": request.audience_specification,
                "rank_tweets": request.rank_tweets
            },
            owner_id=current_user.id
        )
        db.add(input_source)
        db.commit()
        db.refresh(input_source)
        
        # Create a run record
        run = Run(
            id=str(uuid.uuid4()),
            name=f"Twitter Search - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            input_source_id=input_source.id,
            status="running"
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        
        # Execute Twitter search using the real agent (NO MOCKS)
        start_time = datetime.now()
        
        try:
            # Check if we have the necessary credentials (either from request or environment)
            import os
            user_id = request.arcade_user_id or os.getenv('USER_ID') or os.getenv('ARCADE_USER_ID')
            api_key = request.arcade_api_key or os.getenv('ARCADE_API_KEY')
            provider = request.arcade_provider or 'x'
            
            if not api_key:
                raise HTTPException(
                    status_code=400,
                    detail="Arcade API key is required. Set ARCADE_API_KEY environment variable or provide arcade_api_key in request."
                )
            
            if not user_id:
                raise HTTPException(
                    status_code=400,
                    detail="User ID is required. Set USER_ID environment variable or provide arcade_user_id in request."
                )
            
            print(f"DEBUG: Using user_id={user_id}, provider={provider}, api_key={'***' + api_key[-4:] if api_key else 'None'}")
            
            # Validate LLM credentials if ranking is enabled
            llm_api_key = None
            if request.rank_tweets:
                if request.llm_provider == "openai":
                    llm_api_key = request.openai_api_key or os.getenv('OPENAI_API_KEY')
                    if not llm_api_key:
                        raise HTTPException(
                            status_code=400,
                            detail="OpenAI API key is required when rank_tweets=True and llm_provider=openai. Provide openai_api_key in request or set OPENAI_API_KEY environment variable."
                        )
                elif request.llm_provider == "anthropic":
                    llm_api_key = request.anthropic_api_key or os.getenv('ANTHROPIC_API_KEY')
                    if not llm_api_key:
                        raise HTTPException(
                            status_code=400,
                            detail="Anthropic API key is required when rank_tweets=True and llm_provider=anthropic. Provide anthropic_api_key in request or set ANTHROPIC_API_KEY environment variable."
                        )
                elif request.llm_provider == "google_genai":
                    llm_api_key = request.google_api_key or os.getenv('GOOGLE_API_KEY')
                    if not llm_api_key:
                        raise HTTPException(
                            status_code=400,
                            detail="Google API key is required when rank_tweets=True and llm_provider=google_genai. Provide google_api_key in request or set GOOGLE_API_KEY environment variable."
                        )
                        
                print(f"DEBUG: LLM ranking enabled with provider={request.llm_provider}, model={request.llm_model}")
            
            # Use the existing Twitter agent with generous timeout and credentials
            documents = await asyncio.wait_for(
                get_content(
                    agent_input,
                    userid=user_id,
                    key=api_key,
                    provider=provider,
                    llm_provider=request.llm_provider if request.rank_tweets else None,
                    llm_model=request.llm_model if request.rank_tweets else None,
                    llm_api_key=llm_api_key if request.rank_tweets else None
                ), 
                timeout=120.0  # 2 minutes timeout for complex searches
            )
        except asyncio.TimeoutError:
            # Update run status and raise timeout error
            run.status = "failed"
            run.completed_at = datetime.now()
            run.metadata = {"error": "Twitter search timed out after 2 minutes"}
            db.commit()
            raise HTTPException(
                status_code=408,
                detail="Twitter search timed out. The search query may be too complex or Twitter API is slow. Try a simpler query."
            )
        except Exception as e:
            # Update run status and raise error
            run.status = "failed"
            run.completed_at = datetime.now()
            run.metadata = {"error": str(e)}
            db.commit()
            raise HTTPException(
                status_code=500,
                detail=f"Twitter search failed: {str(e)}"
            )
            
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Save documents to database
        saved_documents = []
        for doc in documents:
            # Convert HttpUrl to string if needed
            doc_url = getattr(doc, 'url', None)
            if doc_url and hasattr(doc_url, '__str__'):
                doc_url = str(doc_url)
            
            db_document = Document(
                id=str(uuid.uuid4()),
                title=doc.title,
                content=doc.content,
                url=doc_url,
                author=getattr(doc, 'author', None),
                score=getattr(doc, 'score', 0),
                priority=getattr(doc, 'priority', 0),
                platform_data=getattr(doc, 'metadata', {}),
                run_id=run.id
            )
            db.add(db_document)
            saved_documents.append(db_document)
        
        # Update run status
        run.status = "completed"
        run.completed_at = datetime.now()
        run.metadata = {
            "total_documents": len(saved_documents),
            "processing_time": processing_time,
            "search_params": request.dict()
        }
        
        db.commit()
        
        # Convert to response format
        document_responses = [
            DocumentResponse(
                id=doc.id,
                title=doc.title,
                content=doc.content,
                url=doc.url,
                author=doc.author,
                score=doc.score,
                priority=doc.priority,
                platform_data=doc.platform_data,
                run_id=doc.run_id,
                created_at=doc.created_at
            )
            for doc in saved_documents
        ]
        
        return TwitterSearchResponse(
            documents=document_responses,
            run_id=run.id,
            total_found=len(saved_documents),
            processing_time=processing_time
        )
        
    except Exception as e:
        # Update run status to failed
        if 'run' in locals():
            run.status = "failed"
            run.completed_at = datetime.now()
            run.metadata = {"error": str(e)}
            db.commit()
        
        raise HTTPException(
            status_code=500,
            detail=f"Twitter search failed: {str(e)}"
        )


@router.post("/input-sources", response_model=InputSourceResponse)
async def create_twitter_input_source(
    request: InputSourceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a Twitter input source for scheduled searches."""
    if request.source_type not in [
        InputSourceType.TWITTER_KEYWORDS,
        InputSourceType.TWITTER_USER,
        InputSourceType.TWITTER_HASHTAG
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid source_type for Twitter input source"
        )
    
    input_source = InputSource(
        id=str(uuid.uuid4()),
        name=request.name,
        source_type=request.source_type,
        config=request.config,
        schedule_config=request.schedule_config,
        owner_id=current_user.id
    )
    
    db.add(input_source)
    db.commit()
    db.refresh(input_source)
    
    return InputSourceResponse(
        id=input_source.id,
        name=input_source.name,
        source_type=input_source.source_type,
        config=input_source.config,
        schedule_config=input_source.schedule_config,
        owner_id=input_source.owner_id,
        is_active=input_source.is_active,
        created_at=input_source.created_at,
        updated_at=input_source.updated_at
    )


@router.get("/input-sources", response_model=List[InputSourceResponse])
async def get_twitter_input_sources(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all Twitter input sources for the current user."""
    input_sources = db.query(InputSource).filter(
        InputSource.owner_id == current_user.id,
        InputSource.source_type.in_([
            InputSourceType.TWITTER_KEYWORDS,
            InputSourceType.TWITTER_USER,
            InputSourceType.TWITTER_HASHTAG
        ])
    ).all()
    
    return [
        InputSourceResponse(
            id=source.id,
            name=source.name,
            source_type=source.source_type,
            config=source.config,
            schedule_config=source.schedule_config,
            owner_id=source.owner_id,
            is_active=source.is_active,
            created_at=source.created_at,
            updated_at=source.updated_at
        )
        for source in input_sources
    ]


@router.post("/post", response_model=TwitterPostResponse)
async def post_twitter_tweet(
    request: TwitterPostRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Post a tweet to X/Twitter using the posting agent."""
    try:
        # Check if we have the necessary credentials (either from request or environment)
        import os
        user_id = request.arcade_user_id or os.getenv('USER_ID') or os.getenv('ARCADE_USER_ID')
        api_key = request.arcade_api_key or os.getenv('ARCADE_API_KEY')
        provider = request.arcade_provider or 'x'
        
        if not api_key:
            raise HTTPException(
                status_code=400,
                detail="Arcade API key is required. Set ARCADE_API_KEY environment variable or provide arcade_api_key in request."
            )
        
        if not user_id:
            raise HTTPException(
                status_code=400,
                detail="User ID is required. Set USER_ID environment variable or provide arcade_user_id in request."
            )
        
        # Use the posting agent with credentials
        result = await post_tweet(
            tweet_text=request.tweet_text,
            userid=user_id,
            key=api_key,
            provider=provider
        )
        
        if result["success"]:
            # Extract tweet info from result
            tweet_info = result.get("output", {})
            tweet_id = None
            tweet_url = None
            
            # Handle different response formats
            if isinstance(tweet_info, dict):
                tweet_id = tweet_info.get("id")
                tweet_url = tweet_info.get("url")
                
                # If URL is not provided but ID is, construct the URL
                if tweet_id and not tweet_url:
                    # Extract username from the posting request if available
                    username = request.arcade_user_id.split('@')[0] if '@' in str(request.arcade_user_id) else "user"
                    tweet_url = f"https://x.com/{username}/status/{tweet_id}"
            
            return TwitterPostResponse(
                success=True,
                tweet_id=tweet_id,
                tweet_url=tweet_url,
                message="Tweet posted successfully!",
                posted_at=datetime.now()
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to post tweet: {result.get('error', 'Unknown error')}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error posting tweet: {str(e)}"
        )


@router.delete("/tweet/{tweet_id}", response_model=TwitterDeleteResponse)
async def delete_twitter_tweet(
    tweet_id: str,
    request: TwitterDeleteRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a tweet from X/Twitter using the posting agent."""
    try:
        # Check if we have the necessary credentials (either from request or environment)
        import os
        user_id = request.arcade_user_id or os.getenv('USER_ID') or os.getenv('ARCADE_USER_ID')
        api_key = request.arcade_api_key or os.getenv('ARCADE_API_KEY')
        provider = request.arcade_provider or 'x'
        
        if not api_key:
            raise HTTPException(
                status_code=400,
                detail="Arcade API key is required. Set ARCADE_API_KEY environment variable or provide arcade_api_key in request."
            )
        
        if not user_id:
            raise HTTPException(
                status_code=400,
                detail="User ID is required. Set USER_ID environment variable or provide arcade_user_id in request."
            )
        
        # Use the deletion agent with credentials
        result = await delete_tweet(
            tweet_id=tweet_id,
            userid=user_id,
            key=api_key,
            provider=provider
        )
        
        if result["success"]:
            return TwitterDeleteResponse(
                success=True,
                tweet_id=tweet_id,
                message="Tweet deleted successfully!",
                deleted_at=datetime.now()
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to delete tweet: {result.get('error', 'Unknown error')}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting tweet: {str(e)}"
        )
