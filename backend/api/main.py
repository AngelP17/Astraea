import json
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from backend.ingestion.normalizer import load_events
from backend.pipeline.feature_engine import FeatureEngine
from backend.ml.anomaly_detector import AnomalyDetector
from backend.decision.prioritizer import DecisionPrioritizationEngine
from backend.decision.engine import DecisionEngine
from backend.audit.recorder import AuditRecorder

app = FastAPI(title="Astraea", version="0.1.0")

feature_engine = FeatureEngine()
anomaly_detector = AnomalyDetector()
dpe = DecisionPrioritizationEngine()
decision_engine = DecisionEngine()
recorder = AuditRecorder()


@app.get("/decision")
def get_decision():
    events = load_events()
    if not events:
        return JSONResponse({"error": "no events found"}, status_code=404)

    event = events[0]

    fv = feature_engine.extract(event)
    assessment = anomaly_detector.assess(fv)
    case = dpe.prioritize(event, assessment)
    decision = decision_engine.resolve(case)
    audit = recorder.record(event, fv, assessment, case, decision)

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
        fv = feature_engine.extract(event)
        assessment = anomaly_detector.assess(fv)
        case = dpe.prioritize(event, assessment)
        decision = decision_engine.resolve(case)
        recorder.record(event, fv, assessment, case, decision)

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
        for r in recorder.get_all()
    ]
