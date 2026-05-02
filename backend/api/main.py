import asyncio
import hashlib
import json
import os
import time
import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from enum import Enum
from pathlib import Path
from typing import Annotated, Any

import structlog
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth.models import User
from backend.auth.routes import get_current_user
from backend.auth.routes import router as auth_router
from backend.core.config import settings
from backend.core.logging import configure_logging
from backend.core.pipeline import AstraeaPipeline
from backend.core.rate_limit import check_rate_limit
from backend.core.replay import ReplayStore
from backend.core.retention import get_retention_policy
from backend.core.validators import validate_case_id
from backend.db.crud import get_case_by_id, upsert_case
from backend.db.crud import get_cases as db_get_cases
from backend.db.session import get_db
from backend.ingestion.normalizer import load_events
from backend.shared.schemas import Event

logger = structlog.get_logger()

configure_logging()

app = FastAPI(
    title="Astraea API",
    description="Deterministic Decision Engine",
    version="1.0.0",
)

app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    logger.info(
        "request_completed",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=round(duration * 1000, 2),
    )
    return response


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)

    ip = request.client.host if request.client else "unknown"
    is_auth = "Authorization" in request.headers

    allowed, message = check_rate_limit(ip, is_auth)
    if not allowed:
        return JSONResponse(status_code=429, content={"error": message})

    return await call_next(request)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", path=request.url.path, error=str(exc))
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


pipeline = AstraeaPipeline()
replay_store = ReplayStore()

DB_AVAILABLE = os.environ.get("DATABASE_URL") is not None


class ReplayRequest(BaseModel):
    case_id: str


STAGE_NAMES = [
    ("event_capture", "Event Capture", "SIGNAL_ENTRY"),
    ("normalization", "Normalization", "CONTRACT_LOCK"),
    ("feature_extraction", "Feature Extraction", "STATE_EXTRACTION"),
    ("anomaly_scoring", "Anomaly Scoring", "RISK_MODEL"),
    ("prioritization", "Prioritization", "OPERATING_STANCE"),
    ("decision_dispatch", "Decision Dispatch", "ACTION_BUNDLE"),
    ("audit_proof", "Audit Proof", "REPLAY_GUARANTEE"),
]


def build_partial_payload(
    event: Event,
    *,
    features: Any | None = None,
    assessment: Any | None = None,
    prioritized_case: Any | None = None,
    decision: Any | None = None,
    execution: Any | None = None,
    consequence: Any | None = None,
    audit: Any | None = None,
) -> dict[str, Any]:
    partial: dict[str, Any] = {
        "event": event.to_dict(),
    }

    if features is not None:
        partial["features"] = features.to_dict()
    if assessment is not None:
        partial["assessment"] = assessment.to_dict()
    if prioritized_case is not None:
        partial["prioritized_case"] = prioritized_case.to_dict()
    if decision is not None:
        partial["decision"] = decision.to_dict()
    if execution is not None:
        partial["execution"] = execution.to_dict()
    if consequence is not None:
        partial["consequence"] = consequence.to_dict()
    if audit is not None:
        partial["audit"] = audit.to_dict()

    return partial


def iter_case_files(*directories: Path):
    for directory in directories:
        if not directory.exists():
            continue

        yield from sorted(directory.glob("*.json"))


def load_case_records(*directories: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []

    for file in iter_case_files(*directories):
        try:
            payload = json.loads(file.read_text())
            payload["_source_file"] = file.name
            payload["_source_dir"] = file.parent.name
            payload["_source_mtime"] = file.stat().st_mtime
            records.append(payload)
        except Exception:
            continue

    records.sort(
        key=lambda item: (
            item.get("case_id", ""),
            item.get("_source_mtime", 0.0),
        )
    )
    deduped: dict[str, dict[str, Any]] = {}
    for item in records:
        case_id = str(item.get("case_id", ""))
        deduped[case_id] = item

    return [
        {key: value for key, value in item.items() if not key.startswith("_source_")}
        for item in deduped.values()
    ]


def find_case_file(case_id: str, *directories: Path) -> Path | None:
    for directory in directories:
        if not directory.exists():
            continue

        candidate = directory / f"{case_id}.json"
        if candidate.exists():
            return candidate

    return None


async def run_streaming_demo(
    event_path: str = "data/synthetic_events_100.json",
    event_count: int = 100,
    stage_interval_ms: int = 300,
    event_interval_ms: int = 600,
) -> AsyncGenerator[dict[str, Any], None]:
    events = load_events(event_path)
    if not events:
        return

    events = events[:event_count]

    for event in events:
        features = pipeline.feature_engine.extract(event)
        assessment = pipeline.anomaly_detector.assess(features)
        prioritized_case = pipeline.prioritizer.prioritize(event, assessment)
        decision = pipeline.decision_engine.resolve(prioritized_case)
        execution = pipeline.dispatcher.dispatch(prioritized_case, decision)
        consequence = pipeline.consequence_calculator.calculate(
            prioritized_case, decision, assessment, event
        )
        audit = pipeline.audit_recorder.record(
            event, features, assessment, prioritized_case, decision, execution
        )

        stage_payloads = [
            build_partial_payload(event),
            build_partial_payload(event),
            build_partial_payload(event, features=features),
            build_partial_payload(event, features=features, assessment=assessment),
            build_partial_payload(
                event,
                features=features,
                assessment=assessment,
                prioritized_case=prioritized_case,
            ),
            build_partial_payload(
                event,
                features=features,
                assessment=assessment,
                prioritized_case=prioritized_case,
                decision=decision,
                execution=execution,
            ),
            build_partial_payload(
                event,
                features=features,
                assessment=assessment,
                prioritized_case=prioritized_case,
                decision=decision,
                execution=execution,
                consequence=consequence,
                audit=audit,
            ),
        ]

        for stage_index, partial in enumerate(stage_payloads):
            yield {
                "stage": stage_index,
                "stage_name": STAGE_NAMES[stage_index][0],
                "stage_label": STAGE_NAMES[stage_index][2],
                "event_id": event.event_id,
                "case_id": prioritized_case.case_id
                if stage_index >= 4
                else f"case_{event.event_id}",
                "partial_result": partial,
                "completed": False,
                "timestamp": datetime.now(UTC).isoformat(),
            }
            await asyncio.sleep(stage_interval_ms / 1000.0)

        yield {
            "stage": 7,
            "stage_name": "complete",
            "stage_label": "DONE",
            "event_id": event.event_id,
            "case_id": prioritized_case.case_id,
            "partial_result": build_partial_payload(
                event,
                features=features,
                assessment=assessment,
                prioritized_case=prioritized_case,
                decision=decision,
                execution=execution,
                consequence=consequence,
                audit=audit,
            ),
            "completed": True,
            "timestamp": datetime.now(UTC).isoformat(),
        }

        await asyncio.sleep(event_interval_ms / 1000.0)


@app.on_event("startup")
async def startup_event():
    logger.info("astraea_startup", version="1.0.0")
    if DB_AVAILABLE:
        try:
            from backend.db.init_db import init_db

            await init_db()
        except Exception as e:
            logger.error("database_initialization_failed", error=str(e))


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(UTC).isoformat(),
        "database_available": DB_AVAILABLE,
    }


@app.post("/api/run")
async def run_pipeline(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        events = load_events("data/sample_events.json")
        if not events:
            raise HTTPException(status_code=404, detail="No events found")

        event = events[0]
        result = pipeline.process(event)
        result_dict = result.to_dict()

        if DB_AVAILABLE:
            try:
                await upsert_case(db, result_dict)
            except Exception as db_err:
                logger.warning("database_save_failed", error=str(db_err))

        replay_store.save(result.case_id, result_dict)
        output_dir = Path("artifacts/results")
        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / f"{result.case_id}.json").write_text(json.dumps(result_dict, indent=2))

        return result_dict
    except HTTPException:
        raise
    except Exception as err:
        logger.error("run_pipeline_error", error=str(err))
        raise HTTPException(status_code=500, detail="Internal server error") from err


@app.post("/api/demo")
async def run_demo(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        events = load_events("data/synthetic_events_100.json")
        if not events:
            raise HTTPException(status_code=404, detail="No events found")

        results = []
        output_dir = Path("artifacts/demo_results")
        output_dir.mkdir(parents=True, exist_ok=True)

        for event in events[:100]:
            result = pipeline.process(event)
            result_dict = result.to_dict()
            results.append(result_dict)

            if DB_AVAILABLE:
                try:
                    await upsert_case(db, result_dict)
                except Exception as db_err:
                    logger.warning("database_save_failed", error=str(db_err))

            replay_store.save(result.case_id, result_dict)
            (output_dir / f"{result.case_id}.json").write_text(json.dumps(result_dict, indent=2))

        return {"count": len(results), "results": results}
    except HTTPException:
        raise
    except Exception as err:
        logger.error("run_demo_error", error=str(err))
        raise HTTPException(status_code=500, detail="Internal server error") from err


@app.get("/api/demo/stream")
async def demo_stream():
    async def event_generator():
        try:
            async for message in run_streaming_demo():
                event_type = "complete" if message.get("completed") else "stage"
                yield f"event: {event_type}\ndata: {json.dumps(message)}\n\n"
        except Exception as e:
            logger.error("stream_error", error=str(e))
            yield f"event: error\ndata: {json.dumps({'error': 'Stream failed'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/cases")
async def get_cases(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        if DB_AVAILABLE:
            try:
                cases = await db_get_cases(db)
                return [
                    {
                        "case_id": c.id,
                        "event_id": c.event_id,
                        "machine_id": c.machine_id,
                        "line_id": c.line_id,
                        "event_type": c.event_type,
                        "severity": c.severity,
                        "priority_score": c.priority_score,
                        "confidence": c.confidence,
                        "recommendation": c.recommendation,
                        "routing_bucket": c.routing_bucket,
                        "risk_level": c.risk_level,
                        "created_at": c.created_at.isoformat() if c.created_at else None,
                        "result_data": c.result_data,
                    }
                    for c in cases
                ]
            except Exception as db_err:
                logger.warning("database_query_fallback", error=str(db_err))

        return load_case_records(Path("artifacts/results"), Path("artifacts/demo_results"))
    except Exception as err:
        logger.error("get_cases_error", error=str(err))
        raise HTTPException(status_code=500, detail="Internal server error") from err


@app.post("/api/replay")
async def replay_case(
    request: ReplayRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        case_id = request.case_id
        is_valid, error = validate_case_id(case_id)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error)

        if DB_AVAILABLE:
            try:
                case = await get_case_by_id(db, case_id)
                if case and case.result_data:
                    return case.result_data
            except Exception as db_err:
                logger.warning("database_query_fallback", error=str(db_err))

        case_file = find_case_file(
            case_id,
            Path("artifacts/replays"),
            Path("artifacts/results"),
            Path("artifacts/demo_results"),
        )

        if not case_file:
            raise HTTPException(status_code=404, detail=f"Replay not found for case: {case_id}")

        content = case_file.read_text()
        data = json.loads(content)
        return data
    except HTTPException:
        raise
    except Exception as err:
        logger.error("replay_case_error", error=str(err))
        raise HTTPException(status_code=500, detail="Internal server error") from err


@app.get("/decision")
def get_decision():
    events = load_events()
    if not events:
        return JSONResponse({"error": "no events found"}, status_code=404)

    event = events[0]

    fv = pipeline.feature_engine.extract(event)
    assessment = pipeline.anomaly_detector.assess(fv)
    case = pipeline.prioritizer.prioritize(event, assessment)
    decision = pipeline.decision_engine.resolve(case)
    execution = pipeline.dispatcher.dispatch(case, decision)
    pipeline.audit_recorder.record(event, fv, assessment, case, decision, execution)

    return {
        "case_id": case.case_id,
        "priority_score": case.priority_score,
        "recommendation": decision.recommendation,
        "confidence": case.confidence_band,
        "rationale": case.rationale,
    }


@app.get("/decisions")
def get_all_decisions():
    events = load_events()
    results = []

    for event in events:
        fv = pipeline.feature_engine.extract(event)
        assessment = pipeline.anomaly_detector.assess(fv)
        case = pipeline.prioritizer.prioritize(event, assessment)
        decision = pipeline.decision_engine.resolve(case)
        execution = pipeline.dispatcher.dispatch(case, decision)
        pipeline.audit_recorder.record(event, fv, assessment, case, decision, execution)

        results.append(
            {
                "case_id": case.case_id,
                "priority_score": case.priority_score,
                "recommendation": decision.recommendation,
                "confidence": case.confidence_band,
                "rationale": case.rationale,
            }
        )

    return results


@app.get("/audit")
def get_audit():
    return [
        {
            "case_id": r.case_id,
            "timestamp": r.timestamp.isoformat(),
            "priority_score": r.prioritization_snapshot.get("priority_score"),
            "recommendation": r.decision_snapshot.get("recommendation"),
        }
        for r in pipeline.audit_recorder.get_all()
    ]


@app.post("/api/admin/cleanup")
async def cleanup_artifacts(current_user: Annotated[User, Depends(get_current_user)]):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    policy = get_retention_policy()
    deleted = policy.run_cleanup()
    return {"deleted": deleted, "message": "Cleanup completed"}


@app.get("/api/admin/artifacts-stats")
async def get_artifacts_stats(current_user: Annotated[User, Depends(get_current_user)]):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    policy = get_retention_policy()
    stats = {
        "retention_days": policy.retention_days,
        "max_replays": policy.max_replays,
        "max_demo_results": policy.max_demo_results,
        "counts": {
            "results": len(list((policy.artifacts_dir / "results").glob("*.json")))
            if (policy.artifacts_dir / "results").exists()
            else 0,
            "demo_results": len(list((policy.artifacts_dir / "demo_results").glob("*.json")))
            if (policy.artifacts_dir / "demo_results").exists()
            else 0,
            "replays": len(list((policy.artifacts_dir / "replays").glob("*.json")))
            if (policy.artifacts_dir / "replays").exists()
            else 0,
        },
    }
    return stats


# ============================================================
# v1 API Routes
# ============================================================


class JobStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


app_v1 = FastAPI(title="Astraea v1 API", version="1.0.0")


class JobStore:
    def __init__(self):
        self._jobs: dict[str, dict] = {}

    def create_job(self, job_type: str, params: dict) -> str:
        job_id = str(uuid.uuid4())
        self._jobs[job_id] = {
            "id": job_id,
            "type": job_type,
            "params": params,
            "status": JobStatus.PENDING,
            "created_at": datetime.now(UTC).isoformat(),
            "result": None,
            "error": None,
        }
        return job_id

    def get_job(self, job_id: str) -> dict | None:
        return self._jobs.get(job_id)

    def update_job(self, job_id: str, status: JobStatus, result: Any = None, error: str = None):
        if job_id in self._jobs:
            self._jobs[job_id]["status"] = status.value
            if result is not None:
                self._jobs[job_id]["result"] = result
            if error:
                self._jobs[job_id]["error"] = error


job_store = JobStore()


def compute_result_hash(result_dict: dict) -> str:
    canonical = json.dumps(result_dict, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()


@app_v1.post("/ingest/events")
async def ingest_events(
    events: list[Event],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    results = []
    for event in events:
        result = pipeline.process(event)
        result_dict = result.to_dict()

        if DB_AVAILABLE:
            try:
                await upsert_case(db, result_dict)
            except Exception as db_err:
                logger.warning("database_save_failed", error=str(db_err))

        results.append(
            {
                "event_id": event.event_id,
                "case_id": result.case_id,
                "status": "processed",
            }
        )

    return {"ingested": len(results), "results": results}


@app_v1.post("/ingest/batch")
async def ingest_batch(
    events: list[Event],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    job_id = job_store.create_job("batch_ingest", {"event_count": len(events)})
    job_store.update_job(job_id, JobStatus.RUNNING)

    try:
        results = []
        for event in events:
            result = pipeline.process(event)
            result_dict = result.to_dict()

            if DB_AVAILABLE:
                try:
                    await upsert_case(db, result_dict)
                except Exception as db_err:
                    logger.warning("database_save_failed", error=str(db_err))

            results.append(
                {
                    "event_id": event.event_id,
                    "case_id": result.case_id,
                }
            )

        job_store.update_job(
            job_id, JobStatus.COMPLETED, {"processed": len(results), "cases": results}
        )
        return {"job_id": job_id, "status": JobStatus.COMPLETED.value, "processed": len(results)}
    except Exception as e:
        job_store.update_job(job_id, JobStatus.FAILED, error=str(e))
        raise HTTPException(status_code=500, detail=f"Batch ingestion failed: {str(e)}") from e


@app_v1.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    return job


@app_v1.get("/cases")
async def list_cases_v1(
    db: Annotated[AsyncSession, Depends(get_db)],
    machine_id: str | None = None,
    line_id: str | None = None,
    event_type: str | None = None,
    severity: str | None = None,
    min_priority: float | None = None,
    limit: int = 100,
    offset: int = 0,
):
    if DB_AVAILABLE:
        try:
            from sqlalchemy import and_, select

            from backend.db.models import Case

            query = select(Case)

            filters = []
            if machine_id:
                filters.append(Case.machine_id == machine_id)
            if line_id:
                filters.append(Case.line_id == line_id)
            if event_type:
                filters.append(Case.event_type == event_type)
            if severity:
                filters.append(Case.severity == severity)
            if min_priority is not None:
                filters.append(Case.priority_score >= min_priority)

            if filters:
                query = query.where(and_(*filters))

            query = query.offset(offset).limit(limit)
            result = await db.execute(query)
            cases = result.scalars().all()

            return {
                "total": len(cases),
                "limit": limit,
                "offset": offset,
                "cases": [
                    {
                        "case_id": c.id,
                        "event_id": c.event_id,
                        "machine_id": c.machine_id,
                        "line_id": c.line_id,
                        "event_type": c.event_type,
                        "severity": c.severity,
                        "priority_score": c.priority_score,
                        "confidence": c.confidence,
                        "recommendation": c.recommendation,
                        "risk_level": c.risk_level,
                        "created_at": c.created_at.isoformat() if c.created_at else None,
                    }
                    for c in cases
                ],
            }
        except Exception as db_err:
            logger.warning("database_query_failed", error=str(db_err))

    return load_case_records(Path("artifacts/results"), Path("artifacts/demo_results"))[:limit]


@app_v1.get("/cases/{case_id}")
async def get_case_v1(
    case_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    is_valid, error = validate_case_id(case_id)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)

    if DB_AVAILABLE:
        try:
            case = await get_case_by_id(db, case_id)
            if case:
                return {
                    "case_id": case.id,
                    "event_id": case.event_id,
                    "machine_id": case.machine_id,
                    "line_id": case.line_id,
                    "event_type": case.event_type,
                    "severity": case.severity,
                    "priority_score": case.priority_score,
                    "confidence": case.confidence,
                    "recommendation": case.recommendation,
                    "routing_bucket": case.routing_bucket,
                    "risk_level": case.risk_level,
                    "created_at": case.created_at.isoformat() if case.created_at else None,
                    "result_data": case.result_data,
                }
        except Exception as db_err:
            logger.warning("database_query_failed", error=str(db_err))

    case_file = find_case_file(
        case_id,
        Path("artifacts/results"),
        Path("artifacts/demo_results"),
    )

    if not case_file:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")

    return json.loads(case_file.read_text())


@app_v1.post("/replay/{case_id}/verify")
async def verify_replay(
    case_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    is_valid, error = validate_case_id(case_id)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)

    original_data = None

    if DB_AVAILABLE:
        try:
            case = await get_case_by_id(db, case_id)
            if case and case.result_data:
                original_data = case.result_data
        except Exception:
            pass

    if not original_data:
        case_file = find_case_file(
            case_id,
            Path("artifacts/results"),
            Path("artifacts/demo_results"),
        )
        if case_file:
            original_data = json.loads(case_file.read_text())

    if not original_data:
        raise HTTPException(status_code=404, detail=f"Original case not found: {case_id}")

    original_event_dict = original_data.get("event", {})
    original_event = Event(**original_event_dict)

    replay_result = pipeline.process(original_event)
    replay_data = replay_result.to_dict()

    original_hash = compute_result_hash(original_data)
    replay_hash = compute_result_hash(replay_data)

    return {
        "case_id": case_id,
        "verified": original_hash == replay_hash,
        "original_hash": original_hash,
        "replay_hash": replay_hash,
        "original_case_id": original_data.get("case_id"),
        "replay_case_id": replay_data.get("case_id"),
        "stage_outputs_match": original_data.get("case_id") == replay_data.get("case_id"),
        "replay_result": replay_data,
    }


@app_v1.get("/observability/metrics")
async def get_metrics():
    return {
        "pipeline": {
            "stages": len(STAGE_NAMES),
            "stage_names": [s[0] for s in STAGE_NAMES],
        },
        "jobs": {
            "active": len(
                [j for j in job_store._jobs.values() if j["status"] == JobStatus.RUNNING.value]
            ),
            "total": len(job_store._jobs),
        },
        "artifacts": {
            "results": len(list(Path("artifacts/results").glob("*.json")))
            if Path("artifacts/results").exists()
            else 0,
            "demo_results": len(list(Path("artifacts/demo_results").glob("*.json")))
            if Path("artifacts/demo_results").exists()
            else 0,
            "replays": len(list(Path("artifacts/replays").glob("*.json")))
            if Path("artifacts/replays").exists()
            else 0,
        },
    }


@app_v1.get("/observability/health")
async def get_health_v1():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "database_available": DB_AVAILABLE,
        "timestamp": datetime.now(UTC).isoformat(),
    }


app.mount("/api/v1", app_v1)
