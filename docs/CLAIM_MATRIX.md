# Astraea Claim-to-Proof Matrix

This file is the source of truth for public claims. A claim should not appear in the product surface unless it has a row here with an honest status.

| Public claim | Evidence module | Verification test | Generated artifact | Demo surface | Status |
| --- | --- | --- | --- | --- | --- |
| Determinism 100% | `backend/audit/recorder.py` | `tests/test_pipeline.py::test_audit_hash_is_stable_for_same_input` | `artifacts/results/*.json` | Replay Verification Panel | Verified |
| Replay verified | `backend/core/replay_engine.py` | `tests/test_platform.py::test_true_replay_hash_match` | replay verification response | Engine Replay Diff Panel | Verified |
| Every stage produces a SHA256 hash | `backend/audit/recorder.py` | `tests/test_platform.py::test_stage_level_hashes_present_and_stable` | `audit.stage_hashes` | Stage Hash Rail | Verified |
| Streaming telemetry ingest | `backend/api/main.py` | `tests/test_public_demo_endpoints.py::test_public_demo_endpoints_work_without_login` | SSE stream events | Hero live trace | Measured |
| Benchmark metrics | `backend/evaluation/run_eval.py` | `tests/test_platform.py::test_evaluation_artifacts_exist_and_valid` | `artifacts/evaluation/eval_latest.json` | `/evaluation` | Measured |
| Deterministic ML inference | `backend/ml/model.py` | `tests/test_platform.py::test_model_artifact_exists_and_pipeline_uses_it` | `artifacts/model/astraea_logreg_v1.json` + `docs/MODEL_CARD.md` | Decision Trace | Verified |
| Graph-lite cascade reasoning | `backend/reasoning/graph.py` | `tests/test_platform.py::test_demo_returns_graph_context` | demo `graph_context` | `/architecture` | Partial |
| Floci local cloud emulation | `backend/core/floci.py` | `tests/test_floci_smoke.py` | optional Floci smoke payload | `/architecture` | Partial |

## Status Key

- **Verified**: backed by deterministic code and automated tests.
- **Measured**: backed by a generated artifact or live endpoint, but tied to synthetic/local evaluation.
- **Partial**: core implementation exists, but scope is intentionally narrower than a production claim.
- **Prototype**: conceptual or early implementation. Do not use as a banner claim.

## Honesty Notes

- “ML anomaly detection” now refers to the frozen logistic model artifact. The deterministic scoring path remains useful as a baseline/fallback, but it is not the primary Phase 2 claim.
- Benchmarks are generated from a labeled synthetic evaluation harness and must be regenerated with `uv run python -m backend.evaluation.run_eval`.
- The model card is generated at `docs/MODEL_CARD.md`; it must stay tied to `artifacts/model/astraea_logreg_v1.json`.
- Floci is local cloud emulation only. It is not a production deployment claim.
