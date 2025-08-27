from datetime import datetime
import os

from sqlalchemy.orm import Session

from api.celery_app import celery
from api.database import SessionLocal
from api.models import OutputSchema, OutputStatus, OutputType
from megaforce.posting_agents.x.agent import post_tweet


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
        output = db.query(OutputSchema).filter(OutputSchema.id == output_id).first()
        if not output:
            return {"success": False, "message": f"Output {output_id} not found"}

        # Only attempt to post approved or scheduled content
        if str(output.status) not in {OutputStatus.APPROVED.value, "approved", "scheduled"}:
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
            return {"success": False, "message": f"Scheduling not supported for type {output.content_type}"}

        text = _extract_text(output.generated_content)

        # Use persona_id as the Arcade user_id for posting (fallback to env if missing)
        persona_user_id = output.persona_id
        api_key = os.getenv("ARCADE_API_KEY")
        provider = os.getenv("ARCADE_PROVIDER", "x")

        if not api_key or not persona_user_id:
            return {"success": False, "message": "Missing Arcade API key or persona_id for user_id"}

        # Post via agent
        # The agent is async; call it through celery by running loop.run_until_complete-like wrapper
        import asyncio

        async def _post():
            return await post_tweet(tweet_text=text, userid=persona_user_id, key=api_key, provider=provider)

        result = asyncio.run(_post())

        if result.get("success"):
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

        return {"success": False, "message": result.get("error", "Unknown error")}
    except Exception as e:  # pragma: no cover - operational guard
        db.rollback()
        return {"success": False, "message": str(e)}
    finally:
        db.close()


