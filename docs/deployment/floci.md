# Floci Local Cloud Emulation

This guide explains how Astraea uses **Floci** (a local cloud emulator running on port `4566`) to simulate cloud-adjacent object storage and queuing workflows in local development and smoke-testing environments.

---

## 1. System Role & Boundaries
In the Astraea platform:
*   **Production Cloud Deployment**: Achieved via **Docker** and **Kubernetes** manifests, which deploy Astraea components alongside production databases and queues.
*   **Local Cloud Emulation (Floci)**: Emulates cloud infrastructure locally. It is used to validate artifact flows (saving audit hashes to S3 storage) and ingest flows (queue simulation) before code is pushed.
*   **Honest Framing**: The Floci local layer is a *local smoke-test tool* and *emulator* for platform credibility. It is **not** a production cloud deployment or active hosting claim.

---

## 2. Emulated Services
Astraea communicates optionally with the following local cloud services when `FLOCI_ENABLED=True`:
1.  **Object Storage (S3 Emulation)**:
    *   **Port**: `4566`
    *   **Bucket**: `astraea-audit-proofs`
    *   **Usage**: Simulates persisting deterministic audit hashes and evaluation JSON reports to a cloud bucket.
2.  **Message Queue (SQS Emulation)**:
    *   **Port**: `4566`
    *   **Queue URL**: `http://localhost:4566/000000000000/astraea-ingest-queue`
    *   **Usage**: Simulates queuing raw telemetry streams prior to ingestion by Astraea background workers.

---

## 3. Local Setup & Execution

### 3.1 Prerequisite: Launching Floci via Docker
Floci is powered by an optional Docker image (typically LocalStack or an S3 emulator) exposing standard port `4566`:

```bash
# Start the emulated local cloud container in the background
docker run --name astraea-floci -d -p 4566:4566 localstack/localstack:latest
```

Verify that the local cloud gateway is listening:
```bash
curl http://localhost:4566
```

### 3.2 Activating the Floci Profile
To wire the local environment to talk to the emulated cloud, append the following variables to your local `.env` file:

```env
# Enable Floci Local Cloud Emulation
FLOCI_ENABLED=True
FLOCI_URL=http://localhost:4566
FLOCI_BUCKET=astraea-audit-proofs
FLOCI_QUEUE_URL=http://localhost:4566/000000000000/astraea-ingest-queue
```

*Note: Running `npm run dev` or the core Python pytest suite does **not** require Floci to be active; S3/SQS operations fall back gracefully to local file artifacts when disabled.*

### 3.3 Running the Floci Smoke Test
We provide a dedicated test validating S3 artifact writes and SQS messaging through the local cloud gateway. You can run it with:

```bash
# Run the specific Floci S3/SQS smoke tests
uv run pytest tests/test_floci_smoke.py
```

---

## 4. UI Indicators
To maintain absolute engineering honesty, when the frontend displays system metrics or architecture, it labels the Floci integration clearly:
*   **"Local cloud emulation: configured / available"** (if Floci is running locally).
*   **"Local cloud emulation: unconfigured / fallback mode"** (using file system artifacts).
It **never** presents local emulation as a live production cloud deployment.
