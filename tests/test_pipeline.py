from __future__ import annotations

from backend.core.pipeline import AstraeaPipeline
from backend.ingestion.normalizer import load_events


def test_full_pipeline_runs_end_to_end() -> None:
    events = load_events()
    assert len(events) == 3

    pipeline = AstraeaPipeline()

    results = [pipeline.process(event) for event in events]
    assert len(results) == 3

    for result in results:
        payload = result.to_dict()
        assert payload["event_id"]
        assert payload["case_id"].startswith("case_")
        assert 0.0 <= payload["assessment"]["anomaly_score"] <= 1.0
        assert 0.0 <= payload["assessment"]["failure_probability"] <= 1.0
        assert 0.0 <= payload["assessment"]["confidence"] <= 1.0
        assert payload["decision"]["recommendation"]
        assert payload["execution"]["dispatch_status"]
        assert payload["audit"]["deterministic_hash"]


def test_vibration_spike_has_elevated_priority() -> None:
    pipeline = AstraeaPipeline()
    events = load_events()

    vibration_event = next(e for e in events if e.event_type == "vibration_spike")
    result = pipeline.process(vibration_event).to_dict()

    assert result["prioritized_case"]["priority_score"] >= 0.45
    assert result["prioritized_case"]["severity"] in {"medium", "high", "critical"}


def test_stoppage_has_actionable_decision() -> None:
    pipeline = AstraeaPipeline()
    events = load_events()

    stoppage_event = next(e for e in events if e.event_type == "stoppage")
    result = pipeline.process(stoppage_event).to_dict()

    assert result["prioritized_case"]["requires_action"] is True
    assert result["decision"]["urgency"] in {"medium", "high", "critical"}


def test_audit_hash_is_stable_for_same_input() -> None:
    pipeline_a = AstraeaPipeline()
    pipeline_b = AstraeaPipeline()
    event = load_events()[0]

    result_a = pipeline_a.process(event).to_dict()
    result_b = pipeline_b.process(event).to_dict()

    assert result_a["audit"]["deterministic_hash"] == result_b["audit"]["deterministic_hash"]
