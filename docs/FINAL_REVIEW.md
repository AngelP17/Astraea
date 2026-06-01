# Astraea Final Review

This document provides a comprehensive review of what is verified, measured, partial, and not production-claimed in the Astraea system.

## Claim-to-Proof Status

### Verified Claims (Backed by code, tests, and artifacts)

| Claim | Evidence | Test | Status |
|-------|----------|------|--------|
| Determinism 100% | `backend/audit/recorder.py` | `test_audit_hash_is_stable_for_same_input` | Verified |
| Replay verified | `backend/core/replay_engine.py` | `test_true_replay_hash_match` | Verified |
| Every stage produces a SHA256 hash | `backend/audit/recorder.py` | `test_stage_level_hashes_present_and_stable` | Verified |
| Deterministic ML inference | `backend/ml/model.py` | `test_model_artifact_exists_and_pipeline_uses_it` | Verified |

### Measured Claims (Backed by generated artifacts, synthetic evaluation)

| Claim | Evidence | Test | Status |
|-------|----------|------|--------|
| Streaming telemetry ingest | `backend/api/main.py` | `test_public_demo_endpoints_work_without_login` | Measured |
| Benchmark metrics | `artifacts/evaluation/eval_latest.json` | `test_evaluation_artifacts_exist_and_valid` | Measured |

### Partial Claims (Core implementation exists, narrower scope than production)

| Claim | Evidence | Test | Status |
|-------|----------|------|--------|
| Graph-lite cascade reasoning | `backend/reasoning/graph.py` | `test_demo_returns_graph_context` | Partial |
| Floci local cloud emulation | `backend/core/floci.py` | `test_floci_smoke` | Partial |

### Not Production-Claimed

- **Event data**: Generated synthetic industrial telemetry, not real plant data
- **Model training**: Frozen logistic model trained on synthetic data
- **Benchmarks**: Local synthetic evaluation, not external plant throughput
- **Deployment**: Optional Floci local emulation, not production cloud deployment
- **Graph reasoning**: Demo/session context only, not universal single-event inference

## Documentation Consistency

### Files with Claim References

| File | Claims Listed | Status |
|------|---------------|--------|
| `docs/CLAIM_MATRIX.md` | 8 claims | Source of truth |
| `README.md` | 9 claims | Needs alignment with CLAIM_MATRIX |
| `/api/claims` endpoint | 8 claims | Needs alignment with CLAIM_MATRIX |
| `/evaluation` page | 8 claims | Dynamic from `/api/claims` |

### Inconsistencies Found

1. **README.md "Audit complete" claim**: Listed as Verified but not in CLAIM_MATRIX
2. **Claim naming differences**:
   - "Streaming telemetry ingest" (CLAIM_MATRIX) vs "Streaming mode" (README) vs "Streaming Mode" (API)
   - "Floci local cloud emulation" (CLAIM_MATRIX) vs "Floci cloud path" (README) vs "Floci Local Cloud Emulation" (API)

## Quality Gates

Run these checks before treating a change as complete:

```bash
# Backend lint and tests
uv run ruff check backend tests
uv run pytest -q tests

# Frontend checks
npm run typecheck
npm run build
npm run lint
npm run test:e2e

# Security scan
python3 scripts/scan_staged_secrets.py --all-files

# Evaluation artifact (separate)
uv run python -m backend.evaluation.run_eval
```

## API Endpoint Coverage

### Documented Endpoints (README.md)

| Endpoint | Purpose | Tested |
|----------|---------|--------|
| `GET /api/cases` | List full pipeline results | Yes |
| `GET /api/cases/{case_id}` | Retrieve one full case | Yes |
| `POST /api/run` | Execute pipeline on sample events | Yes |
| `POST /api/replay` | Legacy replay verification | No |
| `POST /api/replay/{case_id}` | Re-execute stored event | No |
| `POST /api/demo` | Run 100-event demo batch | Yes |
| `GET /api/demo/stream` | SSE stream for pipeline | Yes |
| `GET /api/claims` | Claim-to-proof matrix | No |
| `GET /api/evaluation/latest` | Latest evaluation artifact | No |
| `GET /api/health/deep` | Runtime health status | No |
| `POST /api/v1/ingest/events` | Ingest events | No |
| `POST /api/v1/ingest/batch` | Batch ingest | No |
| `GET /api/v1/jobs/{job_id}` | Check job status | No |
| `GET /api/v1/cases` | Filtered case listing | No |
| `POST /api/v1/replay/{case_id}/verify` | Verify replay | No |
| `GET /api/v1/observability/metrics` | Pipeline metrics | No |
| `GET /api/v1/observability/benchmarks` | Benchmark view | No |
| `POST /auth/register` | Register user | No |
| `POST /auth/token` | Login for JWT | No |
| `GET /auth/me` | Current user profile | No |
| `POST /api/admin/cleanup` | Admin artifact cleanup | Yes |

### Test Coverage Summary

- **Backend unit tests**: 6 test files, ~15 test cases
- **Frontend e2e tests**: 4 test cases (one per page)
- **API contract tests**: Missing for `/api/claims`, `/api/evaluation/latest`, `/api/health/deep`, `/api/replay/{case_id}`

## Recommendations

### Immediate Actions

1. **Align README.md claims with CLAIM_MATRIX.md**:
   - Remove "Audit complete" or add it to CLAIM_MATRIX
   - Use consistent claim names across all documents

2. **Add missing API contract tests**:
   - Test `/api/claims` returns expected structure
   - Test `/api/evaluation/latest` returns valid JSON
   - Test `/api/health/deep` returns health status
   - Test `/api/replay/{case_id}` with valid case

3. **Extend Playwright e2e coverage**:
   - Add tests for replay functionality
   - Add tests for streaming demo
   - Add tests for error states

### Future Work

1. **Claim matrix expansion**: Add claims for v1 API endpoints
2. **API versioning**: Document v1 vs legacy endpoint differences
3. **Monitoring**: Add observability for claim verification status
4. **Automation**: CI check to verify claim consistency across files

## Last Updated

2026-06-01 - Initial review after documentation sync and Obsidian vault fixes
