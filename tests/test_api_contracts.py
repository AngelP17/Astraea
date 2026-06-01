"""
API contract tests for Astraea endpoints.
These tests verify that endpoints return expected structures and status codes.
"""

import json
from pathlib import Path

from fastapi.testclient import TestClient


def test_claims_endpoint_returns_expected_structure(monkeypatch, tmp_path):
    """Verify /api/claims returns the expected claim structure."""
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr("backend.api.main.DB_AVAILABLE", False)

    from backend.api.main import app

    client = TestClient(app)
    response = client.get("/api/claims")

    assert response.status_code == 200
    claims = response.json()

    assert isinstance(claims, list)
    assert len(claims) == 8

    for claim in claims:
        assert "claim" in claim
        assert "evidence_file" in claim
        assert "demo_surface" in claim
        assert "test" in claim
        assert "status" in claim
        assert claim["status"] in ["Verified", "Measured", "Partial", "Prototype"]


def test_claims_match_claim_matrix():
    """Verify API claims match docs/CLAIM_MATRIX.md."""
    matrix_path = Path("docs/CLAIM_MATRIX.md")
    assert matrix_path.exists()

    content = matrix_path.read_text()

    expected_claims = [
        "Determinism 100%",
        "Replay verified",
        "Every stage produces a SHA256 hash",
        "Streaming telemetry ingest",
        "Benchmark metrics",
        "Deterministic ML inference",
        "Graph-lite cascade reasoning",
        "Floci local cloud emulation",
    ]

    for claim in expected_claims:
        assert claim in content, f"Claim '{claim}' not found in CLAIM_MATRIX.md"


def test_evaluation_endpoint_returns_valid_json(monkeypatch, tmp_path):
    """Verify /api/evaluation/latest returns valid evaluation JSON."""
    monkeypatch.chdir(tmp_path)

    eval_dir = Path("artifacts/evaluation")
    eval_dir.mkdir(parents=True, exist_ok=True)

    eval_data = {
        "timestamp": "2026-05-29T16:21:47.436350+00:00",
        "total_evaluated_cases": 500,
        "hash_consistency_rate": 1.0,
        "replay_pass_rate": 1.0,
        "audit_completeness_rate": 1.0,
        "rationale_coverage_rate": 1.0,
        "mean_rationale_count": 7.0,
        "throughput_events_per_sec": 6160.12,
        "latency_mean_ms": 0.1623,
        "latency_p99_ms": 0.2469,
        "baselines": {
            "threshold_only": {
                "name": "Static threshold alerter",
                "precision": 0.625,
                "recall": 1.0,
                "routing_accuracy": 0.7,
                "false_escalation_rate": 0.6,
            },
            "scoring_only": {
                "name": "Deterministic scoring only",
                "precision": 0.8333,
                "recall": 1.0,
                "routing_accuracy": 0.9,
                "false_escalation_rate": 0.2,
            },
            "model_only": {
                "name": "Frozen logistic model",
                "precision": 1.0,
                "recall": 1.0,
                "routing_accuracy": 1.0,
                "false_escalation_rate": 0.0,
            },
            "astraea": {
                "name": "Astraea decision engine",
                "precision": 1.0,
                "recall": 1.0,
                "routing_accuracy": 1.0,
                "false_escalation_rate": 0.0,
            },
        },
        "model": {
            "version": "astraea_logreg_v1",
            "artifact_path": "artifacts/model/astraea_logreg_v1.json",
            "threshold": 0.5,
        },
    }

    (eval_dir / "eval_latest.json").write_text(json.dumps(eval_data, indent=2))

    from backend.api.main import app

    client = TestClient(app)
    response = client.get("/api/evaluation/latest")

    assert response.status_code == 200
    data = response.json()

    assert "timestamp" in data
    assert "hash_consistency_rate" in data
    assert "baselines" in data
    assert "astraea" in data["baselines"]
    assert data["model"]["version"] == "astraea_logreg_v1"


def test_deep_health_endpoint_returns_expected_structure(monkeypatch, tmp_path):
    """Verify /api/health/deep returns expected health structure."""
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr("backend.api.main.DB_AVAILABLE", False)

    from backend.api.main import app

    client = TestClient(app)
    response = client.get("/api/health/deep")

    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert "database" in data
    assert "configured" in data["database"]
    assert "floci" in data
    assert "enabled" in data["floci"]
    assert "celery" in data
    assert "pipeline" in data
    assert "stages_count" in data["pipeline"]
    assert data["pipeline"]["stages_count"] == 7
    assert "artifact_counts" in data


def test_replay_endpoint_returns_verified_status(monkeypatch, tmp_path):
    """Verify POST /api/replay/{case_id} returns verification status."""
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr("backend.api.main.DB_AVAILABLE", False)

    from backend.api.main import app
    from backend.ingestion.normalizer import normalize_event
    from tests.test_comprehensive import generate_realistic_events

    (tmp_path / "artifacts" / "results").mkdir(parents=True, exist_ok=True)
    (tmp_path / "artifacts" / "replays").mkdir(parents=True, exist_ok=True)

    events = [normalize_event(row) for row in generate_realistic_events(1)]
    monkeypatch.setattr("backend.api.main.load_events", lambda *_args, **_kwargs: events)

    client = TestClient(app)

    run_response = client.post("/api/run")
    assert run_response.status_code == 200
    case_id = run_response.json()["case_id"]

    replay_response = client.post(f"/api/replay/{case_id}")
    assert replay_response.status_code == 200

    data = replay_response.json()
    assert "case_id" in data
    assert "verified" in data
    assert "original_hash" in data
    assert "replay_hash" in data
    assert "stage_diffs" in data
    assert "replay_duration_ms" in data
    assert isinstance(data["verified"], bool)
    assert isinstance(data["stage_diffs"], list)


def test_benchmarks_endpoint_returns_expected_metrics(monkeypatch, tmp_path):
    """Verify /api/v1/observability/benchmarks returns benchmark metrics."""
    monkeypatch.chdir(tmp_path)

    eval_dir = Path("artifacts/evaluation")
    eval_dir.mkdir(parents=True, exist_ok=True)

    eval_data = {
        "timestamp": "2026-05-29T16:21:47.436350+00:00",
        "hash_consistency_rate": 1.0,
        "throughput_events_per_sec": 6160.12,
        "latency_mean_ms": 0.1623,
        "latency_p99_ms": 0.2469,
        "rationale_coverage_rate": 1.0,
        "baselines": {
            "threshold_only": {"routing_accuracy": 0.7},
            "astraea": {"routing_accuracy": 1.0},
        },
    }

    (eval_dir / "eval_latest.json").write_text(json.dumps(eval_data, indent=2))

    from backend.api.main import app

    client = TestClient(app)
    response = client.get("/api/v1/observability/benchmarks")

    assert response.status_code == 200
    data = response.json()

    assert "throughput_events_per_sec" in data
    assert "latency_mean_ms" in data
    assert "latency_p99_ms" in data
    assert "hash_stability_rate" in data
    assert "explainability_coverage_rate" in data
    assert data["throughput_events_per_sec"] == 6160.12
