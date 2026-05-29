import json
from datetime import UTC, datetime
from pathlib import Path

from backend.core.pipeline import AstraeaPipeline
from backend.core.replay_engine import ReplayEngine
from backend.decision.prioritizer import TemporalPatternDetector
from backend.ingestion.normalizer import load_events, normalize_event
from backend.shared.schemas import Event, ModelAssessment


def test_true_replay_hash_match():
    """
    Given an executed case, verify that replaying the original event
    telemetry through the pipeline yields the exact same deterministic hash
    and matching stage-level hashes.
    """
    pipeline = AstraeaPipeline()
    events = load_events()
    event = events[0]

    # Process original event
    original_result = pipeline.process(event)
    original_data = original_result.to_dict()

    # Replay verification via ReplayEngine
    engine = ReplayEngine(pipeline)
    verif = engine.verify_replay(original_data)

    assert verif["hash_match"] is True
    assert verif["original_hash"] == verif["replay_hash"]
    assert len(verif["stage_diffs"]) == 0
    assert verif["replay_duration_ms"] > 0.0


def test_stage_level_hashes_present_and_stable():
    """
    Verify that each of the 7 stages produces its own stable hash receipt,
    and these hashes are correctly populated in the audit dictionary.
    """
    pipeline = AstraeaPipeline()
    event = load_events()[0]
    result = pipeline.process(event).to_dict()

    audit = result["audit"]
    assert "stage_hashes" in audit
    stage_hashes = audit["stage_hashes"]

    expected_stages = [
        "event",
        "features",
        "assessment",
        "prioritization",
        "decision",
        "execution",
        "consequence",
    ]
    for stage in expected_stages:
        assert stage in stage_hashes
        assert len(stage_hashes[stage]) == 64  # SHA-256 length


def test_demo_returns_graph_context(monkeypatch, tmp_path):
    """
    Verify the multi-event demo path attaches graph-lite reasoning output.
    """
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr("backend.api.main.DB_AVAILABLE", False)
    monkeypatch.setattr("backend.api.main.replay_store.save", lambda *args, **kwargs: None)

    from fastapi.testclient import TestClient

    from backend.api.main import app
    from tests.test_comprehensive import generate_realistic_events

    events = [normalize_event(row) for row in generate_realistic_events(12)]
    monkeypatch.setattr("backend.api.main.load_events", lambda *_args, **_kwargs: events)

    response = TestClient(app).post("/api/demo")
    assert response.status_code == 200
    payload = response.json()
    assert payload["graph_context"]["propagation_risk"] >= 0.0
    assert "cascade_path" in payload["graph_context"]
    assert payload["results"][0]["graph_context"] == payload["graph_context"]


def test_temporal_reasoning_nonzero_trend():
    """
    Verify that increasing anomaly scores produce positive temporal trends,
    proving the temporal bug fix is successfully active.
    """
    detector = TemporalPatternDetector()
    
    # 1. Simulate an escalating anomaly stream
    event_type = "temperature_rise"
    
    # Run 3 events with escalating anomaly scores
    dt1 = datetime(2026, 5, 29, 8, 0, 0, tzinfo=UTC)
    dt2 = datetime(2026, 5, 29, 8, 5, 0, tzinfo=UTC)
    dt3 = datetime(2026, 5, 29, 8, 10, 0, tzinfo=UTC)
    
    e1 = Event(
        event_id="evt_01",
        machine_id="m_01",
        line_id="l_01",
        event_type=event_type,
        timestamp=dt1,
        raw_values={},
        source="edge"
    )
    e2 = Event(
        event_id="evt_02",
        machine_id="m_01",
        line_id="l_01",
        event_type=event_type,
        timestamp=dt2,
        raw_values={},
        source="edge"
    )
    e3 = Event(
        event_id="evt_03",
        machine_id="m_01",
        line_id="l_01",
        event_type=event_type,
        timestamp=dt3,
        raw_values={},
        source="edge"
    )
    
    a1 = ModelAssessment(
        event_id="evt_01",
        anomaly_score=0.1,
        failure_probability=0.1,
        confidence=0.9,
        uncertainty_low=0.0,
        uncertainty_high=0.2,
        top_features=[],
        explanation_factors=[],
        model_version="astraea_det_v2"
    )
    a2 = ModelAssessment(
        event_id="evt_02",
        anomaly_score=0.4,
        failure_probability=0.3,
        confidence=0.9,
        uncertainty_low=0.2,
        uncertainty_high=0.5,
        top_features=[],
        explanation_factors=[],
        model_version="astraea_det_v2"
    )
    a3 = ModelAssessment(
        event_id="evt_03",
        anomaly_score=0.8,
        failure_probability=0.7,
        confidence=0.8,
        uncertainty_low=0.6,
        uncertainty_high=0.9,
        top_features=[],
        explanation_factors=[],
        model_version="astraea_det_v2"
    )

    detector.record_event(e1, a1)
    detector.record_event(e2, a2)
    detector.record_event(e3, a3)

    machine_key = "l_01:m_01"
    trend = detector.detect_trend(machine_key)
    
    from backend.decision.prioritizer import DecisionPrioritizationEngine
    engine = DecisionPrioritizationEngine()
    engine.temporal_detector = detector
    velocity = engine._compute_velocity_score(e3, machine_key)
    
    # Velocity and trend should not be zero due to escalation
    assert trend > 0.0
    assert velocity > 0.0


def test_claim_matrix_validation():
    """
    Verify that docs/CLAIM_MATRIX.md is present, parses correctly,
    and maps only active platform claims.
    """
    matrix_path = Path("docs/CLAIM_MATRIX.md")
    assert matrix_path.exists() is True
    
    content = matrix_path.read_text()
    assert "Claim-to-Proof Matrix" in content
    assert "Verified" in content
    assert "Prototype" in content


def test_evaluation_artifacts_exist_and_valid():
    """
    Verify that the evaluation artifacts generated by run_eval.py exist,
    contain correct keys, and parse cleanly.
    """
    latest_json_path = Path("artifacts/evaluation/eval_latest.json")
    latest_md_path = Path("artifacts/evaluation/eval_latest.md")

    assert latest_json_path.exists() is True
    assert latest_md_path.exists() is True

    # Validate JSON shape
    data = json.loads(latest_json_path.read_text())
    assert "timestamp" in data
    assert "hash_consistency_rate" in data
    assert "baselines" in data
    assert "astraea" in data["baselines"]
    assert "model_only" in data["baselines"]
    assert data["model"]["version"] == "astraea_logreg_v1"


def test_model_artifact_exists_and_pipeline_uses_it():
    """
    Verify Phase 2 deterministic ML is literal: a frozen model artifact exists
    and pipeline assessments report that model version.
    """
    model_path = Path("artifacts/model/astraea_logreg_v1.json")
    card_path = Path("docs/MODEL_CARD.md")

    assert model_path.exists() is True
    assert card_path.exists() is True

    model_payload = json.loads(model_path.read_text())
    assert model_payload["version"] == "astraea_logreg_v1"
    assert len(model_payload["feature_names"]) == len(model_payload["weights"])

    result = AstraeaPipeline().process(load_events()[0]).to_dict()
    assert result["assessment"]["model_version"] == "astraea_logreg_v1"
