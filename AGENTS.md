# Astraea Agent & Developer Playbook

This repo is a deterministic decision-infrastructure prototype. Future agent work should preserve the claim-to-proof discipline: public UI/docs claims must be backed by code, tests, and generated artifacts.

## Product Standard

Target language: austere technical instrument, not generic dark AI SaaS.

- `DESIGN_VARIANCE 6`: deliberate, precise, asymmetric where useful.
- `MOTION_INTENSITY 3`: motion communicates state, replay, or verification only.
- `VISUAL_DENSITY 6`: cockpit density with real data; avoid fake metrics.

Do not add glow orbs, radial-gradient decoration, placeholder images, vanity `100%` tiles, or fabricated hashes. When the backend is unavailable, frontend surfaces must show an explicit offline/error state.

## Claim Discipline

Use [docs/CLAIM_MATRIX.md](/Users/apinzon/Desktop/Projects/Astraea/docs/CLAIM_MATRIX.md) as the source of truth for public claims.

- `Verified`: backed by code, tests, and artifact/demo surface.
- `Measured`: backed by a generated artifact.
- `Partial`: code exists, but scope is narrower than the marketing phrase.
- `Prototype`: present directionally, not production-grade.

Current honesty rules:

- “ML” means the frozen deterministic logistic model in `artifacts/model/astraea_logreg_v1.json`.
  Keep `docs/MODEL_CARD.md` and the evaluation artifact in sync with it.
- “Benchmarks” means local synthetic evaluation unless a real external benchmark artifact is added.
- “Graph reasoning” is graph-lite session/demo context, not universal single-event inference.
- “Floci” is optional local emulation until production deployment evidence exists.

## Runtime Layout

- Frontend: Next.js on `http://localhost:3000`
- Backend: FastAPI on `http://localhost:8000`
- Optional Redis/Celery: Redis commonly on `6379`
- Optional Floci/LocalStack-style emulation: commonly on `4566`
- Persistence: PostgreSQL when `DATABASE_URL` is configured; JSON artifacts are used for demo/local cases.

## Commands

Install:

```bash
npm install
uv sync
git config core.hooksPath .githooks
```

Run:

```bash
npm run dev
uv run uvicorn backend.api.main:app --reload
```

Frontend verification:

```bash
npm run typecheck
npm run build
npm run lint
npm run test:e2e
```

Backend verification:

```bash
uv run ruff check backend tests
uv run pytest -q tests
```

Evaluation artifact:

```bash
uv run python -m backend.evaluation.run_eval
```

Security scan:

```bash
python3 scripts/scan_staged_secrets.py --all-files
```

## Key Paths

- `backend/core/pipeline.py`: deterministic pipeline assembly
- `backend/audit/recorder.py`: bundle hash and per-stage hashes
- `backend/core/replay_engine.py`: true replay re-execution and hash comparison
- `backend/reasoning/graph.py`: graph-lite reasoning engine
- `backend/evaluation/run_eval.py`: synthetic evaluation and benchmark artifact generation
- `backend/ml/model.py`: deterministic model training/loading
- `artifacts/model/astraea_logreg_v1.json`: frozen model artifact
- `backend/shared/schemas.py`: Python API/result contracts
- `backend/api/main.py`: FastAPI endpoints
- `lib/data.ts`: frontend data contracts and proxy helpers
- `app/page.tsx`: homepage assembly
- `app/engine/page.tsx`: inspection cockpit
- `app/evaluation/page.tsx`: measured artifact and claim matrix
- `app/architecture/page.tsx`: topology/health view
- `docs/CLAIM_MATRIX.md`: claim-to-proof spine
- `docs/MODEL_CARD.md`: frozen model card
- `RESULTS.md`: generated evaluation summary

## Generated and Avoid-Edit Paths

Do not edit or commit generated caches:

- `.next/`
- `node_modules/`
- `.venv/`
- `.pytest_cache/`
- `.ruff_cache/`
- `test-results/`
- `playwright-report/`
- `__pycache__/`

Be careful with runtime artifacts:

- `artifacts/results/`
- `artifacts/replays/`
- `artifacts/evaluation/`
- `artifacts/model/`

The tracked seed/demo/model artifacts may change when the evaluator or demo regeneration is
intentionally run. Dated evaluation outputs are ignored; `eval_latest.json`, `eval_latest.md`,
and `astraea_logreg_v1.json` are the shareable latest artifacts.

## API Surfaces to Keep Consistent

- `GET /api/cases`
- `GET /api/cases/{case_id}`
- `POST /api/run`
- `POST /api/replay`
- `POST /api/replay/{case_id}`
- `POST /api/demo`
- `GET /api/demo/stream`
- `GET /api/claims`
- `GET /api/evaluation/latest`
- `GET /api/health/deep`
- `GET /api/v1/observability/benchmarks`

Next.js proxy routes under `app/api/` should not substitute mock proof data when FastAPI is unavailable.

## Done When

A code task is done when:

- The changed claim is reflected in code, tests, docs, and UI copy where applicable.
- Public numbers come from `artifacts/evaluation/eval_latest.json` or are labeled synthetic/mock.
- Replay still re-executes the original event and compares stored vs recomputed hashes.
- Frontend offline/error states are honest.
- Relevant tests and checks above pass, or the blocker is explicitly reported.

A documentation task is done when:

- README, `AGENTS.md`, and `docs/CLAIM_MATRIX.md` agree on claim status.
- Setup, build, lint, typecheck, test, evaluation, and security commands are documented from repo manifests/scripts.
- Unknowns and limitations are listed instead of hidden.
