from __future__ import annotations

import os
from celery import Celery

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")

celery_app = Celery(
    "astraea",
    broker=f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
    backend=f"redis://{REDIS_HOST}:{REDIS_PORT}/1",
    include=["backend.worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    task_soft_time_limit=270,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    result_expires=3600,
    task_routes={
        "backend.worker.tasks.process_event": {"queue": "astraea_events"},
        "backend.worker.tasks.run_pipeline": {"queue": "astraea_pipeline"},
        "backend.worker.tasks.replay_case": {"queue": "astraea_replay"},
    },
    task_default_queue="astraea_default",
    task_annotations={
        "backend.worker.tasks.process_event": {"rate_limit": "1000/m"},
        "backend.worker.tasks.run_pipeline": {"rate_limit": "100/m"},
    },
)

celery_app.autodiscover_tasks(["backend.worker"])
