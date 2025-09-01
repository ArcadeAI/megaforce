from datetime import datetime
import os

from sqlalchemy.orm import Session
from celery.utils.log import get_task_logger

from api.celery_app import celery
from api.database import SessionLocal
from api.models import OutputSchema, OutputStatus, OutputType, GenerationJob, GenerationJobStatus, Document, Persona
from megaforce.style_agent.agent import generate_related_content
from megaforce.common.schemas import (
    StyleTransferRequest as StyleTransferRequestFull,
    ReferenceStyle,
    Document as StyleDocument,
    OutputSchema as StyleOutputSchema,
    OutputType as StyleOutputType,
    TweetSingle,
)
from megaforce.common.schemas import (
    ContentType as StyleContentType,
    DocumentCategory as StyleDocumentCategory,
    WritingStyle,
)
from megaforce.posting_agents.x.agent import post_tweet


logger = get_task_logger(__name__)


def _extract_text(content: str) -> str:
    try:
        if isinstance(content, str) and content.startswith("{"):
            import json

            payload = json.loads(content)
            return payload.get("text") or payload.get("content") or content
    except Exception:
        pass
    return content


@celery.task(name="post_output_to_x")
def post_output_to_x_task(output_id: str) -> dict:
    """Background task: post an approved output to X/Twitter.

    Expects Arcade credentials in environment variables.
    """
    db: Session = SessionLocal()
    try:
        logger.info("[post_output_to_x] Start output_id=%s", output_id)
        output = db.query(OutputSchema).filter(OutputSchema.id == output_id).first()
        if not output:
            logger.info("[post_output_to_x] Output not found: %s", output_id)
            return {"success": False, "message": f"Output {output_id} not found"}

        # Only attempt to post approved or scheduled content
        if output.status not in {OutputStatus.APPROVED}:
            logger.info(
                "[post_output_to_x] Output %s not approved/scheduled. Status=%s",
                output_id,
                output.status,
            )
            return {"success": False, "message": f"Output {output_id} is not approved or scheduled"}

        # Only support tweet-like content for now
        allowed_types = {
            OutputType.TWEET_SINGLE.value,
            OutputType.TWEET_THREAD.value,
            OutputType.TWITTER_REPLY.value,
            "twitter",
            "x",
        }
        if str(output.content_type) not in allowed_types:
            logger.info(
                "[post_output_to_x] Unsupported content_type=%s for output_id=%s",
                output.content_type,
                output_id,
            )
            return {"success": False, "message": f"Scheduling not supported for type {output.content_type}"}

        text = _extract_text(output.generated_content)

        # Use persona_id as the Arcade user_id for posting (fallback to env if missing)
        persona_user_id = output.persona_id
        api_key = os.getenv("ARCADE_API_KEY")

        if not api_key or not persona_user_id:
            logger.info("[post_output_to_x] Missing Arcade API key or persona_user_id")
            return {"success": False, "message": "Missing Arcade API key or persona_id for user_id"}

        # Post via agent
        # The agent is async; call it through celery by running loop.run_until_complete-like wrapper
        import asyncio

        async def _post():
            return await post_tweet(tweet_text=text, userid=persona_user_id)

        result = asyncio.run(_post())

        if result.get("success"):
            logger.info("[post_output_to_x] Posted successfully output_id=%s", output_id)
            output.status = OutputStatus.PUBLISHED
            output.published_at = datetime.utcnow()

            tweet_info = result.get("output", {})
            tweet_id = tweet_info.get("id") if isinstance(tweet_info, dict) else None
            tweet_url = tweet_info.get("url") if isinstance(tweet_info, dict) else None
            if tweet_id and not tweet_url:
                tweet_url = f"https://x.com/user/status/{tweet_id}"

            output.published_url = tweet_url
            db.commit()
            db.refresh(output)
            return {"success": True, "tweet_id": tweet_id, "tweet_url": tweet_url}

        logger.info(
            "[post_output_to_x] Failed to post output_id=%s error=%s",
            output_id,
            result.get("error", "Unknown error"),
        )
        return {"success": False, "message": result.get("error", "Unknown error")}
    except Exception as e:  # pragma: no cover - operational guard
        db.rollback()
        logger.exception("[post_output_to_x] Exception output_id=%s err=%s", output_id, e)
        return {"success": False, "message": str(e)}
    finally:
        db.close()



@celery.task(name="post_generation_job_to_x")
def post_generation_job_to_x_task(job_id: str) -> dict:
    """Background task: post a GenerationJob's generated content to X/Twitter.

    Uses persona_id as Arcade user_id. Only supports tweet-like content for now.
    """
    db: Session = SessionLocal()
    try:
        logger.info("[post_generation_job_to_x] Start job_id=%s", job_id)
        job: GenerationJob | None = db.query(GenerationJob).filter(GenerationJob.id == job_id).first()
        if not job:
            logger.info("[post_generation_job_to_x] Job not found: %s", job_id)
            return {"success": False, "message": f"Job {job_id} not found"}

        if not job.generated_content:
            logger.info("[post_generation_job_to_x] No generated content for job_id=%s", job_id)
            return {"success": False, "message": "Job has no generated content"}

        # Only support tweet-like content for now
        allowed_types = {
            OutputType.TWEET_SINGLE,
            OutputType.TWEET_THREAD,
            OutputType.TWITTER_REPLY,
        }
        if job.content_type not in allowed_types:
            logger.info(
                "[post_generation_job_to_x] Unsupported content_type=%s for job_id=%s",
                job.content_type,
                job_id,
            )
            return {"success": False, "message": f"Posting not supported for type {job.content_type}"}

        text = _extract_text(job.generated_content)

        # Persona used as Arcade user id
        persona_user_id = job.persona_id
        import os
        api_key = os.getenv("ARCADE_API_KEY")
        if not api_key or not persona_user_id:
            logger.info("[post_generation_job_to_x] Missing Arcade API key or persona_user_id")
            return {"success": False, "message": "Missing Arcade API key or persona_id for user_id"}

        # Post via agent
        import asyncio

        async def _post():
            return await post_tweet(tweet_text=text, userid=persona_user_id)

        result = asyncio.run(_post())

        if result.get("success"):
            logger.info("[post_generation_job_to_x] Posted successfully job_id=%s", job_id)
            job.status = GenerationJobStatus.POSTED
            db.commit()
            db.refresh(job)

            tweet_info = result.get("output", {})
            tweet_id = tweet_info.get("id") if isinstance(tweet_info, dict) else None
            tweet_url = tweet_info.get("url") if isinstance(tweet_info, dict) else None
            if tweet_id and not tweet_url:
                tweet_url = f"https://x.com/user/status/{tweet_id}"

            return {"success": True, "tweet_id": tweet_id, "tweet_url": tweet_url}

        logger.info(
            "[post_generation_job_to_x] Failed to post job_id=%s error=%s",
            job_id,
            result.get("error", "Unknown error"),
        )
        return {"success": False, "message": result.get("error", "Unknown error")}
    except Exception as e:  # pragma: no cover - operational guard
        db.rollback()
        logger.exception("[post_generation_job_to_x] Exception job_id=%s err=%s", job_id, e)
        return {"success": False, "message": str(e)}
    finally:
        db.close()

@celery.task(name="process_generation_job")
def process_generation_job_task(job_id: str) -> dict:
    """Background task: generate related content for a GenerationJob using ALL run sources."""
    db: Session = SessionLocal()
    try:
        logger.info("[process_generation_job] Start job_id=%s", job_id)
        job: GenerationJob | None = db.query(GenerationJob).filter(GenerationJob.id == job_id).first()
        if not job:
            logger.info("[process_generation_job] Job not found: %s", job_id)
            return {"success": False, "message": f"Job {job_id} not found"}

        # Move to processing
        job.status = GenerationJobStatus.PROCESSING
        db.commit()
        db.refresh(job)
        logger.info(
            "[process_generation_job] Moved to PROCESSING run_id=%s persona_id=%s",
            job.generation_run_id,
            job.persona_id,
        )

        # Load persona
        persona: Persona | None = db.query(Persona).filter(Persona.id == job.persona_id).first()
        if not persona:
            job.status = GenerationJobStatus.FAILED
            db.commit()
            logger.info("[process_generation_job] Persona not found for job_id=%s", job_id)
            return {"success": False, "message": "Persona not found"}

        # Collect ALL documents for this generation run
        docs: list[Document] = (
            db.query(Document)
            .filter(Document.generation_run_id == job.generation_run_id)
            .order_by(Document.created_at.desc())
            .all()
        )
        logger.info(
            "[process_generation_job] Found %d source docs for run_id=%s",
            len(docs),
            job.generation_run_id,
        )
        if not docs:
            job.status = GenerationJobStatus.FAILED
            db.commit()
            logger.info("[process_generation_job] No documents in run for job_id=%s", job_id)
            return {"success": False, "message": "No documents in run"}

        # Build reference style from persona style, linked reference documents, or a sensible default
        ref_docs_schema: list[StyleDocument] = []
        try:
            # Prefer dialect-aware JSONB contains when available (PostgreSQL)
            from sqlalchemy import cast
            from sqlalchemy.dialects.postgresql import JSONB

            ref_docs_db = (
                db.query(Document)
                .filter(cast(Document.persona_ids, JSONB).contains([persona.id]))
                .all()
            )
        except Exception:
            # Fallback for other databases or if JSON operator support isn't available
            ref_docs_db = db.query(Document).all()
            ref_docs_db = [doc for doc in ref_docs_db if doc.persona_ids and persona.id in doc.persona_ids]

        for ref in ref_docs_db:
            if ref.content:
                ref_docs_schema.append(
                    StyleDocument(
                        url=ref.url or "https://example.com/style-reference",
                        type=StyleContentType.TWITTER,
                        category=StyleDocumentCategory.CASUAL,
                        content=ref.content,
                        title=ref.title,
                        author=ref.author,
                    )
                )
        logger.info(
            "[process_generation_job] persona_id=%s reference_docs=%d has_style=%s",
            persona.id,
            len(ref_docs_schema),
            bool(persona.reference_style),
        )

        style_def = None
        if persona.reference_style:
            style_def = persona.reference_style
        elif not ref_docs_schema:
            # Create a default style definition if no style or reference documents are available
            style_def = WritingStyle(
                tone="professional",
                formality_level=0.7,
                sentence_structure="varied",
                vocabulary_level="moderate",
            )

        # Build StyleTransferRequest for related content with tweet_single only
        reference = ReferenceStyle(
            name=persona.name,
            description=persona.description or None,
            documents=ref_docs_schema or None,
            style_definition=style_def,
        )

        target_documents = [
            StyleDocument(
                url="https://example.com" if not d.url else d.url,
                type=StyleContentType.TWITTER,
                category=StyleDocumentCategory.PROFESSIONAL,
                content=(d.content or ""),
                title=d.title,
                author=d.author,
                metadata={"id": d.id},
            )
            for d in docs
        ]

        output_schema = StyleOutputSchema(
            name="tweet_single",
            output_type=StyleOutputType.TWEET_SINGLE,
            tweet_single=TweetSingle(url_allowed=True, text="placeholder"),
            format="json",
            description="Single tweet",
            platform="twitter",
        )

        request = StyleTransferRequestFull(
            reference_style=[reference],
            intent=None,
            focus="generate related tweet from sources",
            target_content=target_documents,
            target_schemas=[output_schema],
        )

        # Run agent
        import asyncio

        async def _run():
            return await generate_related_content(request=request)

        logger.info(
            "[process_generation_job] Invoking agent targets=%d reference_styles=%d",
            len(target_documents),
            1,
        )
        responses = asyncio.run(_run())

        # Store generated content as JSON string
        if responses and len(responses) > 0:
            logger.info(
                "[process_generation_job] Agent returned %d responses for job_id=%s",
                len(responses),
                job.id,
            )
            job.generated_content = responses[0].content
            job.status = GenerationJobStatus.APPROVED  # Next step in workflow to approve/schedule/post
            db.commit()
            db.refresh(job)
            return {"success": True, "job_id": job.id}

        logger.info("[process_generation_job] No content generated for job_id=%s", job_id)
        job.status = GenerationJobStatus.APPROVED
        db.commit()
        return {"success": False, "message": "No content generated"}
    except Exception as e:  # pragma: no cover - operational guard
        db.rollback()
        try:
            job = db.query(GenerationJob).filter(GenerationJob.id == job_id).first()
            if job:
                job.status = GenerationJobStatus.APPROVED
                db.commit()
        except Exception:
            pass
        logger.exception("[process_generation_job] Exception job_id=%s err=%s", job_id, e)
        return {"success": False, "message": str(e)}
    finally:
        db.close()

