import uuid
import asyncio
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from api.database import get_db
from api.auth import get_current_active_user
from api.models import User, InputSource, Run, Document, InputSourceType, OutputStatus, GenerationRun
from api.schemas import (
    TwitterSearchRequest, TwitterSearchResponse, DocumentResponse,
    InputSourceCreate, InputSourceResponse,
    TwitterPostRequest, TwitterPostResponse,
    TwitterDeleteRequest, TwitterDeleteResponse,
    TwitterConnectRequest, TwitterConnectResponse
)

# Import the existing Twitter agents (DO NOT CHANGE AGENT LOGIC)
from megaforce.parser_agents.x.tools import search_tweets, translate_items
# from megaforce.parser_agents.x.agent import get_content
from megaforce.parser_agents.x.schemas import SearchType
from megaforce.posting_agents.x.agent import post_tweet, delete_tweet
from arcadepy import AsyncArcade

router = APIRouter()


SEARCH_TYPE_TO_INPUT_SOURCE_TYPE = {
    SearchType.KEYWORDS: InputSourceType.TWITTER_KEYWORDS,
    SearchType.USER: InputSourceType.TWITTER_USER,
    SearchType.HASHTAG: InputSourceType.TWITTER_HASHTAG,
}


@router.post("/connect", response_model=TwitterConnectResponse)
async def connect_twitter_account(
    request: TwitterConnectRequest,
    response: Response,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Initiate Twitter/X OAuth via Arcade for a given persona.

    Placeholder implementation: returns a dummy OAuth URL and state. The
    real Arcade integration should generate a provider-specific authorization URL
    and persist any necessary state for later verification.
    """
    try:
        # Basic validation that persona exists and belongs to user
        from api.models import Persona
        persona = db.query(Persona).filter(
            Persona.id == request.persona_id,
            Persona.owner_id == current_user.id
        ).first()
        if not persona:
            raise HTTPException(status_code=404, detail="Persona not found")

        client = AsyncArcade()
        auth_request = await client.tools.authorize(
            tool_name="X.PostTweet",
            user_id=request.persona_id
        )

        if auth_request.status != "completed":
            # Store persona_id in a short-lived, HTTP-only cookie for the verifier to read
            # Configure cookie attributes for cross-site flows (HTTPS required for SameSite=None)
            try:
                import os as _os
                cookie_secure = _os.getenv("COOKIE_SECURE", "false").lower() == "true"
            except Exception:
                cookie_secure = False
            cookie_samesite = "none" if cookie_secure else "lax"
            response.set_cookie(
                key="arcade_auth_persona_id",
                value=request.persona_id,
                httponly=True,
                max_age=600,
                samesite=cookie_samesite,
                secure=cookie_secure,
            )

            return TwitterConnectResponse(
                oauth_url=auth_request.url,
                state=auth_request.status,
                message="Use oauth_url to connect your Twitter account."
            )
        else:
            return TwitterConnectResponse(
                oauth_url="",
                state="completed",
                message="Twitter account is already connected for this persona."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate Twitter connect: {str(e)}")


@router.post("/search", response_model=TwitterSearchResponse)
async def search(
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
            # TODO(Mateo): Add hashtag support
            # "hashtag": SearchType.HASHTAG,
        }

        if request.search_type not in search_type_map:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid search_type. Must be one of: {list(search_type_map.keys())}"
            )

        print(f"DEBUG: request search_type: {request.search_type}")
        print(f"DEBUG: request search_query: {request.search_query}")
        print(f"DEBUG: request limit: {request.limit}")
        print(f"DEBUG: request target_number: {request.target_number}")
        print(f"DEBUG: request rank_tweets: {request.rank_tweets}")

        # Create input schema for the agent
        # Force rank_tweets to default to False if not explicitly provided
        rank_tweets_value = False  # Always default to False
        if hasattr(request, 'rank_tweets') and request.rank_tweets is not None:
            rank_tweets_value = request.rank_tweets

        # Create a temporary input source record
        input_source = InputSource(
            id=str(uuid.uuid4()),
            name=f"Twitter Search: {request.search_query}",
            source_type=SEARCH_TYPE_TO_INPUT_SOURCE_TYPE[search_type_map[request.search_type]],
            config={
                "search_type": request.search_type,
                "search_query": request.search_query,
                "limit": request.limit,
                "target_number": request.target_number,
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
            # Use the existing Twitter agent with generous timeout and credentials
            documents = await asyncio.wait_for(
                translate_items(await search_tweets(
                    search_type=search_type_map[request.search_type],
                    search_query=request.search_query,
                    limit=request.limit,
                )),
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
            import traceback
            error_details = traceback.format_exc()
            print(f"DEBUG: Twitter search failed with error: {str(e)}")
            print(f"DEBUG: Full traceback: {error_details}")

            run.status = "failed"
            run.completed_at = datetime.now()
            run.metadata = {"error": str(e), "traceback": error_details}
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

            persona_ids_value = []
            try:
                if getattr(request, 'persona_id', None):
                    # Validate persona belongs to current user
                    from api.models import Persona
                    persona = db.query(Persona).filter(
                        Persona.id == request.persona_id,
                        Persona.owner_id == current_user.id
                    ).first()
                    if not persona:
                        raise HTTPException(status_code=404, detail="Persona not found")
                    persona_ids_value = [request.persona_id]
            except Exception:
                persona_ids_value = []

            # Optionally link to a GenerationRun when provided and owned by user
            generation_run_id = None
            try:
                if getattr(request, 'generation_run_id', None):
                    gen_run = db.query(GenerationRun).filter(
                        GenerationRun.id == request.generation_run_id,
                        GenerationRun.owner_id == current_user.id
                    ).first()
                    if gen_run:
                        generation_run_id = gen_run.id
            except Exception:
                generation_run_id = None

            db_document = Document(
                id=str(uuid.uuid4()),
                title=doc.title,
                content=doc.content,
                url=doc_url,
                author=getattr(doc, 'author', None),
                reference_type="tweet",
                run_id=run.id,
                owner_id=current_user.id,
                persona_ids=persona_ids_value,
                generation_run_id=generation_run_id,
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
                score=0,  # Default score since Document model doesn't have this field
                priority=0,  # Default priority since Document model doesn't have this field
                platform_data={},  # Default empty dict since Document model doesn't have this field
                document_type=doc.reference_type or "tweet",
                reference_type=doc.reference_type,
                owner_id=doc.owner_id,
                is_style_reference=False,  # Default for tweets
                persona_ids=doc.persona_ids or [],
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
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Post a tweet to X/Twitter using the posting agent.

    If output_id is provided, use that output's content and persona_id.
    Otherwise fallback to tweet_text and any provided arcade_user_id.
    """
    try:
        # Resolve content and persona from output_id when provided
        tweet_text: str
        persona_user_id: str | None = None
        if not request.output_id:
            raise HTTPException(status_code=400, detail="output_id is required")

        from api.models import OutputSchema
        output = db.query(OutputSchema).join(OutputSchema.persona).filter(
            OutputSchema.id == request.output_id,
            OutputSchema.persona.has(owner_id=current_user.id)
        ).first()
        if not output:
            raise HTTPException(status_code=404, detail="Output not found")

        # Only allow posting approved items
        print(f"DEBUG: Output status: {output.status}")
        print(f"DEBUG: Output status: {output.status in {OutputStatus.APPROVED}}")
        print(f"DEBUG: Output content: {output.generated_content}")
        if output.status not in {OutputStatus.APPROVED.value}:
            raise HTTPException(status_code=400, detail="Output must be approved before posting")

        # Extract text (handles JSON payloads with text/content fields)
        try:
            content = output.generated_content
            if isinstance(content, str) and content.startswith('{'):
                import json
                parsed = json.loads(content)
                tweet_text = parsed.get('text') or parsed.get('content') or content
            else:
                tweet_text = content
        except Exception:
            tweet_text = output.generated_content

        persona_user_id = output.persona_id

        # Credentials: prefer persona_user_id from output when available
        import os
        api_key = os.getenv('ARCADE_API_KEY')

        if not api_key:
            raise HTTPException(
                status_code=400,
                detail="Arcade API key is required. Set ARCADE_API_KEY environment variable or provide arcade_api_key in request."
            )

        # Use the posting agent with credentials
        result = await post_tweet(
            tweet_text=tweet_text,
            userid=persona_user_id,
        )

        if result["success"]:
            # Extract tweet info from result
            tweet_info = result.get("output", {})
            tweet_id = None
            tweet_url = None

            if isinstance(tweet_info, dict):
                tweet_id = tweet_info.get("id")
                tweet_url = tweet_info.get("url")
                if tweet_id and not tweet_url:
                    tweet_url = f"https://x.com/i/web/status/{tweet_id}"

            # If we posted an existing output, mark it published and save URL
            if request.output_id and tweet_url:
                output.published_url = tweet_url
                output.status = OutputStatus.PUBLISHED
                output.published_at = datetime.now()
                db.commit()
                db.refresh(output)

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

    except HTTPException:
        raise
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
