import structlog
from celery import shared_task

from ..core.retention import get_retention_policy

logger = structlog.get_logger()


@shared_task(name="retention.cleanup_artifacts")
def cleanup_artifacts_task():
    policy = get_retention_policy()
    deleted = policy.run_cleanup()
    logger.info("retention_task_complete", deleted=deleted)
    return deleted
