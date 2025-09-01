import os

from celery import Celery


def _default_redis_url() -> str:
    # In Docker compose, the Redis hostname is 'redis'
    return os.getenv("REDIS_URL", "redis://redis:6379/0")


CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", _default_redis_url())
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", _default_redis_url())

celery = Celery(
    "megaforce",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
)

# Basic, safe config
celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone=os.getenv("TZ", "UTC"),
    enable_utc=True,
)

# Import tasks so Celery sees them
try:
    # import for side-effects
    import api.tasks  # noqa: F401  # pylint: disable=unused-import
except Exception as e:  # pragma: no cover - avoid failing import during partial setups
    print(f"[celery_app] WARNING: Failed to import api.tasks: {e}", flush=True)


