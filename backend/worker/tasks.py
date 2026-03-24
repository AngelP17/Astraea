from __future__ import annotations

import json
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from celery import shared_task

from backend.ingestion.normalizer import normalize_event
from backend.pipeline.feature_engine import FeatureEngine
from backend.ml.anomaly_detector import AnomalyDetector
from backend.decision.prioritizer import DecisionPrioritizationEngine
from backend.decision.engine import DecisionEngine
from backend.audit.recorder import AuditRecorder
from backend.execution.dispatcher import ExecutionDispatcher
from backend.shared.schemas import Event, FeatureVector, ModelAssessment


feature_engine = FeatureEngine()
anomaly_detector = AnomalyDetector()
dpe = DecisionPrioritizationEngine()
decision_engine = DecisionEngine()
audit_recorder = AuditRecorder()
dispatcher = ExecutionDispatcher()


@shared_task(bind=True, name="backend.worker.tasks.process_event")
def process_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        event = normalize_event(event_data)

        features = feature_engine.extract(event)

        assessment = anomaly_detector.assess(features)

        prioritized_case = dpe.prioritize(event, assessment)

        decision = decision_engine.resolve(prioritized_case)

        execution = dispatcher.dispatch(prioritized_case, decision)

        audit_record = audit_recorder.record(
            event=event,
            features=features,
            assessment=assessment,
            case=prioritized_case,
            decision=decision,
            execution=execution,
        )

        return {
            "status": "success",
            "case_id": prioritized_case.case_id,
            "priority_score": prioritized_case.priority_score,
            "recommendation": decision.recommendation,
            "audit_hash": audit_record.deterministic_hash,
            "processing_time": self.request.id,
        }
    except Exception as exc:
        return {
            "status": "failed",
            "error": str(exc),
            "event_id": event_data.get("event_id", "unknown"),
        }


@shared_task(bind=True, name="backend.worker.tasks.run_pipeline")
def run_pipeline(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        from backend.core.pipeline import AstraeaPipeline

        pipeline = AstraeaPipeline()
        event = normalize_event(event_data)
        result = pipeline.process(event)

        return {
            "status": "success",
            "result": result.to_dict(),
            "task_id": self.request.id,
        }
    except Exception as exc:
        return {
            "status": "failed",
            "error": str(exc),
            "event_id": event_data.get("event_id", "unknown"),
        }


@shared_task(bind=True, name="backend.worker.tasks.replay_case")
def replay_case(self, case_id: str) -> Dict[str, Any]:
    try:
        from backend.core.replay import ReplayStore

        replay_store = ReplayStore()
        result = replay_store.load(case_id)

        return {
            "status": "success",
            "case_id": case_id,
            "result": result,
            "verified": True,
            "task_id": self.request.id,
        }
    except Exception as exc:
        return {
            "status": "failed",
            "error": str(exc),
            "case_id": case_id,
        }


@shared_task(bind=True, name="backend.worker.tasks.batch_process")
def batch_process(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
    results = []
    for event_data in events:
        result = run_pipeline.delay(event_data)
        results.append(
            {
                "event_id": event_data.get("event_id"),
                "task_id": result.id,
            }
        )

    return {
        "status": "queued",
        "batch_id": str(uuid.uuid4()),
        "total": len(events),
        "tasks": results,
    }


@shared_task(name="backend.worker.tasks.cleanup_old_artifacts")
def cleanup_old_artifacts(days: int = 90) -> Dict[str, Any]:
    import os
    from pathlib import Path

    artifacts_dir = Path("/app/artifacts")
    if not artifacts_dir.exists():
        return {"status": "skipped", "reason": "artifacts directory not found"}

    cutoff = datetime.now(timezone.utc).timestamp() - (days * 86400)
    deleted = 0

    for file_path in artifacts_dir.rglob("*.json"):
        if file_path.stat().st_mtime < cutoff:
            file_path.unlink()
            deleted += 1

    return {
        "status": "completed",
        "deleted_files": deleted,
        "cutoff_days": days,
    }
