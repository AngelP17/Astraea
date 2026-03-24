# Astraea Architecture

## System Overview

Astraea is a deterministic explainable decision engine for event-driven industrial systems. It transforms raw telemetry into auditable, replayable decisions with full uncertainty quantification.

---

## High-Level Architecture

```mermaid
flowchart TD
    subgraph INGESTION["Stage 1: Event Ingestion"]
        A[Raw Sensor Data] --> B[Normalizer]
        B --> C[Validated Event]
    end

    INGESTION --> FEATURE

    subgraph FEATURE["Stage 2: Feature Engineering"]
        C --> D[Feature Engine]
        D --> E[Threshold Analysis]
        D --> F[Ratio Computation]
        D --> G[Context Markers]
        E --> H[FeatureVector]
        F --> H
        G --> H
    end

    FEATURE --> DETECT

    subgraph DETECT["Stage 3: Anomaly Detection"]
        H --> I[Anomaly Detector]
        I --> J[Anomaly Score]
        I --> K[Failure Probability]
        I --> L[Confidence]
        I --> M[Uncertainty Interval]
    end

    DETECT --> PRIORITIZE

    subgraph PRIORITIZE["Stage 4: Decision Prioritization"]
        J --> N[Priority Engine]
        K --> N
        L --> N
        M --> N
        N --> O[Priority Score]
        N --> P[Routing Bucket]
        N --> Q[Severity Label]
    end

    PRIORITIZE --> DECIDE

    subgraph DECIDE["Stage 5: Decision Resolution"]
        O --> R[Decision Engine]
        R --> S[Recommendation]
        R --> T[Action Plan]
        R --> U[Owner Assignment]
    end

    DECIDE --> EXECUTE

    subgraph EXECUTE["Stage 6: Execution Planning"]
        T --> V[Execution Dispatcher]
        V --> W[Execution Plan]
        V --> X[Commands]
        V --> Y[Notifications]
    end

    EXECUTE --> AUDIT

    subgraph AUDIT["Stage 7: Audit & Replay"]
        C --> Z[Event Snapshot]
        H --> AA[Feature Snapshot]
        J --> AB[Model Snapshot]
        O --> AC[Prioritization Snapshot]
        S --> AD[Decision Snapshot]
        W --> AE[Execution Snapshot]
        Z --> AF[Audit Recorder]
        AA --> AF
        AB --> AF
        AC --> AF
        AD --> AF
        AE --> AF
        AF --> AG[SHA256 Hash]
        AG --> AH[Replay Store]
    end
```

---

## Data Flow

```mermaid
flowchart LR
    subgraph INPUT["Input"]
        E1[Event JSON] --> N[Normalizer]
    end

    subgraph PROCESSING["Processing Pipeline"]
        N --> FE[Feature Engine]
        FE --> AD[Anomaly Detector]
        AD --> PE[Prioritizer]
        PE --> DE[Decision Engine]
        DE --> ED[Execution Dispatcher]
    end

    subgraph OUTPUT["Output"]
        ED --> P[PipelineResult]
        ED --> A[AuditRecord]
    end

    style INPUT fill:#1a1a2e,color:#fff
    style PROCESSING fill:#16213e,color:#fff
    style OUTPUT fill:#0f3460,color:#fff
```

---

## Pipeline Stage Details

### Stage 1: Event Ingestion

```mermaid
sequenceDiagram
    participant Sensor as Raw Data Source
    participant Norm as Normalizer
    participant Event as Validated Event

    Sensor->>Norm: {raw_values, metadata, timestamp}
    Norm->>Norm: Validate required fields
    Norm->>Norm: Type-check raw_values (must be numeric)
    Norm->>Norm: Parse ISO8601 timestamp
    Norm->>Event: Event(event_id, machine_id, line_id, ...)
```

**Responsibilities:**
- Validate all required fields exist
- Ensure `raw_values` are numeric (float)
- Parse ISO8601 timestamps with timezone support
- Normalize metadata structure

---

### Stage 2: Feature Engineering

```mermaid
flowchart TD
    A[Raw Values] --> B{For each metric}
    B -->|Yes| C[raw_{key}]
    B -->|Yes| D[delta_{key}]
    B -->|Yes| E[ratio_{key}]
    B -->|Yes| F[{key}_above_threshold]
    C --> G[FeatureVector]
    D --> G
    E --> G
    F --> G
    B -->|No| H[Next metric]
    
    G --> I[ratio_max]
    G --> J[ratio_mean]
    G --> K[delta_max]
    G --> L[delta_mean]
```

**Thresholds Configuration:**
```python
THRESHOLDS = {
    "vibration_rms": 8.0,    # mm/s
    "vibration_peak": 20.0,  # mm/s
    "temperature_c": 85.0,    # Celsius
    "current_amps": 20.0,    # Amperes
    "rpm": 1200.0,           # Revolutions/min
}
```

**Event Baselines:**
```python
EVENT_BASELINES = {
    "vibration_spike": 0.90,
    "temperature_rise": 0.75,
    "stoppage": 0.95,
    "current_surge": 0.70,
    "pressure_anomaly": 0.80,
}
```

---

### Stage 3: Anomaly Detection

```mermaid
flowchart TD
    A[FeatureVector] --> B[Score Anomaly]
    A --> C[Score Failure]
    A --> D[Score Confidence]

    B --> E[anomaly_score]
    C --> F[failure_probability]
    D --> G[confidence]

    E --> H{Compute Interval}
    F --> H
    G --> H

    H --> I[uncertainty_low]
    H --> J[uncertainty_high]

    B --> K[Top Features]
    C --> L[Explanation Factors]
```

**Scoring Formulas:**

```python
# Anomaly Score
anomaly_score = (
    0.45 * threshold_component +
    0.35 * event_bias +
    duration_bonus +
    ratio_bonus
)

# Failure Probability
failure_probability = (
    0.45 * ratio_factor +
    0.35 * delta_factor +
    0.20 * duration_factor
)

# Confidence
confidence = (
    0.65 * top_signal +
    source_bonus +
    consistency_bonus
)
```

---

### Stage 4: Decision Prioritization

```mermaid
flowchart TD
    A[Event + Assessment] --> B[Compute Priority Score]

    B --> C["weights['anomaly'] * anomaly_score"]
    B --> D["weights['failure'] * failure_probability"]
    B --> E["weights['severity'] * severity_signal"]
    B --> F["weights['recency'] * recency_signal"]

    C --> G[Σ = Priority Score]
    D --> G
    E --> G
    F --> G

    G --> H{Severity Label}
    H -->|>= 0.82| I[critical]
    H -->|>= 0.65| J[high]
    H -->|>= 0.45| K[medium]
    H -->|else| L[low]

    G --> M{Review Required?}
    M -->|confidence < 0.60| N[true]
    M -->|interval_width > 0.35| N
    M -->|low confidence + high score| N
    M -->|else| O[false]

    I --> P[Routing Bucket]
    J --> P
    K --> P
    L --> P

    N --> Q[human_review]
    O --> R[Based on severity]
```

**Priority Weights:**
```python
weights = {
    "anomaly": 0.38,    # Primary signal weight
    "failure": 0.30,    # Secondary signal weight
    "severity": 0.22,    # Event type baseline
    "recency": 0.10,     # Time decay factor
}
```

---

### Stage 5: Decision Resolution

```mermaid
stateDiagram-v2
    [*] --> SeverityCheck
    SeverityCheck --> Critical: severity == critical
    SeverityCheck --> High: severity == high
    SeverityCheck --> Medium: severity == medium
    SeverityCheck --> Low: otherwise
    
    Critical --> IncidentNow: routing = incident_now
    Critical --> HumanReview: routing = human_review
    
    High --> MaintenancePriority: routing = maintenance_priority
    High --> HumanReview: routing = human_review
    
    Medium --> ScheduledFollowup: routing = scheduled_followup
    
    Low --> MonitorOnly: routing = monitor_only
    
    IncidentNow --> [*]: Immediate dispatch
    HumanReview --> [*]: Queue for review
    MaintenancePriority --> [*]: Schedule work order
    ScheduledFollowup --> [*]: Add to backlog
    MonitorOnly --> [*]: Passive monitoring
```

---

### Stage 6: Execution Planning

```mermaid
flowchart TD
    A[PrioritizedCase] --> B[Decision]

    B --> C{Routing Bucket}
    C -->|incident_now| D[prepared]
    C -->|human_review| E[queued_for_review]
    C -->|maintenance_priority| F[scheduled]
    C -->|scheduled_followup| G[backlog]
    C -->|monitor_only| H[monitoring_only]

    D --> I[operations_response]
    E --> J[reliability_engineering]
    F --> K[maintenance]
    G --> L[maintenance_planning]
    H --> M[None]
```

---

### Stage 7: Audit Recording

```mermaid
flowchart TD
    subgraph SNAPSHOTS["Pipeline Snapshots"]
        A[Event] --> B[Event Snapshot]
        C[FeatureVector] --> D[Feature Snapshot]
        E[ModelAssessment] --> F[Model Snapshot]
        G[PrioritizedCase] --> H[Prioritization Snapshot]
        I[Decision] --> J[Decision Snapshot]
        K[ExecutionPlan] --> L[Execution Snapshot]
    end

    SNAPSHOTS --> M[Audit Recorder]

    M --> N[JSON Serialization]
    N --> O[Sort Keys]
    N --> P[Stable Hashing]

    O --> Q[SHA256 Hash]
    P --> Q

    Q --> R[Replay Store]
    Q --> S[Timestamp]
```

---

## Uncertainty Quantification Model

```mermaid
flowchart TD
    A[Anomaly Score] --> B{Confidence >= 0.80?}
    
    B -->|Yes| C[High Confidence]
    B -->|No| D{Interval Wide?}
    
    C --> E[Standard Processing]
    D -->|Yes| F[Review Required]
    D -->|No| G[Medium Confidence]
    
    F --> H[Human-in-Loop]
    G --> E
    
    E --> I[Final Assessment]
    H --> I
    
    style F fill:#ff6b6b
    style H fill:#ff6b6b
```

**Uncertainty Interval Computation:**
```python
spread = max(0.05, 0.30 * (1.0 - confidence))
low = max(0.0, anomaly_score - spread)
high = min(1.0, anomaly_score + spread)
```

---

## Routing Bucket System

```mermaid
flowchart TD
    A[Prioritized Case] --> B{Routing Logic}
    
    B --> C{severity == critical?}
    C -->|Yes| D[incident_now]
    C -->|No| E{review_required?}
    
    E -->|Yes| F[human_review]
    E -->|No| G{severity == high?}
    
    G -->|Yes| H[maintenance_priority]
    G -->|No| I{severity == medium?}
    
    I -->|Yes| J[scheduled_followup]
    I -->|No| K[monitor_only]
```

| Bucket | Severity | Action | Team |
|--------|----------|--------|------|
| `incident_now` | critical | Immediate dispatch | operations_response |
| `human_review` | any (review flag) | Queue for review | reliability_engineering |
| `maintenance_priority` | high | Schedule work order | maintenance |
| `scheduled_followup` | medium | Add to backlog | maintenance_planning |
| `monitor_only` | low | Passive monitoring | None |

---

## Determinism Guarantee

```mermaid
flowchart LR
    subgraph RUN1["Run 1"]
        A1[Input Event] --> P1[Pipeline]
        P1 --> H1[Hash: abc123...]
    end

    subgraph RUN2["Run 2"]
        A2[Input Event] --> P2[Pipeline]
        P2 --> H2[Hash: abc123...]
    end

    H1 --> E[Compare]
    H2 --> E

    E --> R{Equal?}
    R -->|Yes| P[PASS - Deterministic]
    R -->|No| F[FAIL - Non-deterministic]

    style P fill:#51cf66
    style F fill:#ff6b6b
```

**Verification Command:**
```bash
python run_pipeline.py
sha256sum artifacts/results/case_evt_001.json
# Run again and compare - hashes will match exactly
```

---

## Component Dependencies

```mermaid
flowchart TD
    subgraph CORE["Core Pipeline"]
        P[Pipeline.py]
    end

    subgraph MODULES["Processing Modules"]
        N[normalizer.py]
        F[feature_engine.py]
        A[anomaly_detector.py]
        DP[prioritizer.py]
        DE[decision/engine.py]
        ED[execution/dispatcher.py]
        AR[audit/recorder.py]
    end

    subgraph SCHEMAS["Data Contracts"]
        S[shared/schemas.py]
    end

    N --> F
    F --> A
    A --> DP
    DP --> DE
    DE --> ED
    ED --> AR

    P --> N
    P --> F
    P --> A
    P --> DP
    P --> DE
    P --> ED
    P --> AR

    N --> S
    F --> S
    A --> S
    DP --> S
    DE --> S
    ED --> S
    AR --> S
```

---

## Deployment Architecture

```mermaid
flowchart TB
    subgraph FRONTEND["Next.js Frontend"]
        UI[React Components]
        API[API Routes]
    end

    subgraph BACKEND["Python Backend"]
        PL[Python Pipeline]
        FS[File System]
    end

    UI -->|fetch /api/run| API
    API -->|exec python run_pipeline.py| PL
    PL -->|save JSON| FS
    FS -->|read JSON| API
    API -->|return PipelineResult| UI

    style FRONTEND fill:#1a1a2e,color:#fff
    style BACKEND fill:#16213e,color:#fff
```

---

## Performance Characteristics

| Operation | Mean Latency | P95 Latency | P99 Latency |
|-----------|-------------|--------------|--------------|
| Feature extraction | 0.0076 ms | 0.009 ms | 0.015 ms |
| Anomaly detection | 0.0070 ms | 0.008 ms | 0.012 ms |
| Decision prioritization | 0.0060 ms | 0.008 ms | 0.010 ms |
| Decision resolution | 0.0011 ms | 0.001 ms | 0.002 ms |
| Audit hashing | 0.0541 ms | 0.060 ms | 0.080 ms |
| **Total pipeline** | **0.076 ms** | **0.101 ms** | **0.645 ms** |

**Throughput:** 13,893 events/second (sustained load)

---

## File Structure

```
Astraea/
├── backend/
│   ├── shared/
│   │   └── schemas.py          # Event, FeatureVector, ModelAssessment, etc.
│   ├── ingestion/
│   │   └── normalizer.py        # Event validation and normalization
│   ├── pipeline/
│   │   └── feature_engine.py    # Threshold analysis, ratio computation
│   ├── ml/
│   │   └── anomaly_detector.py # Scoring with uncertainty quantification
│   ├── decision/
│   │   ├── prioritizer.py      # Priority scoring and routing
│   │   └── engine.py          # Decision resolution
│   ├── execution/
│   │   └── dispatcher.py        # Execution planning
│   ├── audit/
│   │   └── recorder.py        # SHA256 hashing and replay
│   └── core/
│       ├── pipeline.py         # Main orchestrator
│       └── replay.py           # Case replay functionality
├── app/                        # Next.js frontend
│   ├── api/
│   │   ├── cases/route.ts     # GET /api/cases
│   │   ├── run/route.ts       # POST /api/run
│   │   └── replay/route.ts    # POST /api/replay
│   ├── engine/page.tsx        # Deep dive case study
│   └── page.tsx              # Landing page
├── data/
│   └── sample_events.json      # Sample industrial events
├── tests/
│   ├── test_pipeline.py       # Basic pytest tests
│   ├── test_comprehensive.py   # Comprehensive test suite
│   └── test_benchmarks.py     # Performance benchmarks
└── artifacts/
    ├── results/               # Pipeline output JSON
    └── replays/               # Replayable case bundles
```

---

## Key Design Decisions

### 1. Determinism First
Every component uses pure mathematical operations with no side effects. This guarantees bit-exact reproducibility.

### 2. Stage Isolation
Each pipeline stage has clear inputs/outputs, enabling independent testing and modular replacement.

### 3. Audit as First-Class Citizen
Audit recording is built into every stage, not bolted on afterward.

### 4. Uncertainty Quantification
Every prediction includes calibrated confidence intervals, enabling informed human review.

### 5. Operational Routing
Decisions map directly to real-world workflows (maintenance queues, incident response, etc.).
