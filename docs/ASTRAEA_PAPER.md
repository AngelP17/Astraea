# Astraea: A Deterministic Explainable Decision Engine for Event-Driven Systems

## Abstract

Modern decision systems often force a trade-off between predictive capability, interpretability, and operational usefulness. Machine learning systems can detect complex patterns but are frequently opaque. Rule-based systems are easy to explain but brittle under varied operating conditions. Dashboards can summarize system state but typically do not produce auditable, actionable decisions. Astraea addresses this gap through a deterministic decision architecture that transforms raw events into explainable, uncertainty-aware, replayable decisions. The system combines normalized event ingestion, threshold-aware feature engineering, anomaly scoring, operational prioritization, decision resolution, execution planning, and audit recording into a single end-to-end pipeline. The central claim of this work is that hybrid decision systems can remain operationally useful while also preserving reproducibility, traceability, and structured explanations. We propose evaluation along three dimensions: determinism, actionability, and explanation coverage, and compare Astraea against simpler threshold-only and model-only baselines. Astraea is intended as both a practical engineering artifact and a research prototype for trustworthy AI in industrial and event-driven environments.

## 1. Introduction

AI systems deployed in operational environments must satisfy requirements that extend beyond predictive accuracy. In manufacturing, cybersecurity, fraud detection, and reliability engineering, a useful decision system should not only detect anomalies, but also communicate why an event matters, what should happen next, and whether the outcome can be trusted and replayed later for inspection. In practice, many systems fail one or more of these requirements.

Pure machine learning systems can generate useful scores, but their outputs are often difficult to audit. Rule-based systems provide deterministic behavior, but they frequently fail to generalize beyond narrow cases. Monitoring dashboards offer observability, but they stop short of making explicit decisions. This gap between scoring, reasoning, and action motivates Astraea.

Astraea is a deterministic explainable decision engine for event-driven systems. It converts raw input events into structured decisions through a multi-stage pipeline that includes ingestion, feature engineering, anomaly assessment, prioritization, execution planning, and audit recording. Its emphasis is not on maximizing benchmark novelty through large models, but on building a trustworthy system architecture where every stage produces inspectable outputs.

## 2. Problem Statement

Modern operational decision systems commonly fall into one of three categories:

1. **Black-box predictors**
   - Strong at pattern recognition.
   - Weak at interpretability and replayability.

2. **Rule-only engines**
   - Strong at determinism and interpretability.
   - Weak at flexibility and adaptation.

3. **Analytics dashboards**
   - Strong at visibility.
   - Weak at actionability and formal decision output.

The problem addressed in this work is therefore:

> How can an event-driven system produce decisions that are deterministic, explainable, auditable, and operationally actionable, while still using model-derived signals and uncertainty-aware scoring?

## 3. Contributions

This work makes four concrete contributions:

1. **Deterministic decision pipeline architecture**
   - A multi-stage event processing architecture where identical inputs produce stable outputs and stable audit hashes.

2. **Hybrid model-plus-rules prioritization**
   - A decision path that combines anomaly and failure signals with severity and recency weighting to produce operationally meaningful case prioritization.

3. **Replayable audit mechanism**
   - Each processed case is stored as a replayable bundle containing the full decision lineage and a deterministic hash for integrity verification.

4. **Uncertainty-aware decision framing**
   - Model assessments include bounded uncertainty and confidence values, enabling downstream review gating instead of overconfident automation.

## 4. System Overview

Astraea consists of the following stages:

1. **Ingestion**
   - Raw events are normalized into a structured internal schema.

2. **Feature Engineering**
   - Raw telemetry is transformed into threshold-relative features, ratios, and contextual signals.

3. **Anomaly Detection**
   - Events receive anomaly and failure scores plus confidence and uncertainty bounds.

4. **Prioritization**
   - Assessment outputs are converted into a case score using weighted operational factors.

5. **Decision Resolution**
   - Cases are mapped into recommendations, urgency levels, and next steps.

6. **Execution Planning**
   - A dispatch layer converts decisions into actionable operational instructions.

7. **Audit Recording**
   - Full event, model, prioritization, decision, and execution snapshots are persisted with a deterministic hash.

### 4.1 Canonical Pipeline

\[
\text{Event} \rightarrow \text{Features} \rightarrow \text{Assessment} \rightarrow \text{Priority Case} \rightarrow \text{Decision} \rightarrow \text{Execution} \rightarrow \text{Audit}
\]

### 4.2 Priority Score Formulation

Astraea uses a weighted score to prioritize cases:

\[
P = w_a A + w_f F + w_s S + w_r R
\]

Where:
- \(A\) is the anomaly score
- \(F\) is the failure probability
- \(S\) is event severity
- \(R\) is recency
- \(w_a, w_f, w_s, w_r\) are weighting coefficients

This formulation is intentionally simple and inspectable. The goal is not opaque optimization, but transparent ranking behavior.

## 5. Research Questions

This system supports the following MSc-level research questions:

### RQ1
Can a hybrid decision system maintain deterministic, replayable outputs while still using model-derived scores?

### RQ2
Does combining model assessment with rule-based prioritization produce more operationally useful decisions than threshold-only or score-only baselines?

### RQ3
Can explanation coverage and audit completeness be measured as first-class system metrics alongside correctness and stability?

## 6. Evaluation Plan

Astraea should be evaluated along three primary axes.

### 6.1 Determinism

Measure whether the same input event produces identical output artifacts across repeated executions.

**Metric:** Hash Consistency Rate

\[
\text{Hash Consistency Rate} = \frac{\text{matching hashes}}{\text{total repeated runs}}
\]

Target: 100% under stable software conditions.

### 6.2 Decision Stability

Measure whether repeated pipeline runs produce the same severity labels, routing buckets, and decision recommendations.

**Metrics:**
- Decision Consistency Rate
- Priority Score Variance
- Severity Stability

### 6.3 Explainability Coverage

Measure the extent to which processed decisions include structured reasons and interpretable support.

**Metrics:**
- Mean rationale count per decision
- Percentage of cases with at least two explanation factors
- Percentage of decisions with complete audit snapshots

## 7. Baseline Comparison

To demonstrate Astraea's value, compare it against two simpler baselines.

### Baseline A: Threshold-only

A deterministic policy based solely on hard-coded thresholds.

Example:
- If vibration exceeds threshold, raise alert.
- If temperature exceeds threshold, escalate.

### Baseline B: Model-only

A score-driven policy based only on anomaly score.

Example:
- If anomaly score > 0.7, alert.
- Otherwise monitor.

### Expected comparison dimensions

| Dimension | Threshold-only | Model-only | Astraea |
|---|---:|---:|---:|
| Determinism | High | Medium to High | High |
| Explainability | High | Low to Medium | High |
| Flexibility | Low | Medium | High |
| Actionability | Low to Medium | Medium | High |
| Audit completeness | Low | Low | High |
| Replayability | Low | Low | High |

## 8. Results Template

This section should be populated with measured results once experiments are run.

### 8.1 Determinism Results
- Repeated runs: _N_
- Hash consistency rate: _X%_
- Priority variance: _Y_

### 8.2 Explainability Results
- Mean rationale count: _X_
- Cases with at least 2 reasons: _Y%_
- Cases with full audit record: _Z%_

### 8.3 Baseline Results
- Threshold-only actionability: _X_
- Model-only actionability: _Y_
- Astraea actionability: _Z_

## 9. Limitations

Astraea currently has several limitations.

1. **Synthetic scale**
   - Initial validation may rely on a small number of curated or synthetic events.

2. **Feature assumptions**
   - Thresholds and severity mappings are manually defined and may require domain tuning.

3. **Simplified model layer**
   - The current anomaly scoring pipeline is designed for interpretability and control rather than state-of-the-art predictive performance.

4. **Limited temporal reasoning**
   - The current implementation operates primarily at the single-event level, though it can be extended to multi-event correlation.

## 10. Future Work

Several extensions would strengthen Astraea as a research platform.

1. **Temporal correlation across event sequences**
2. **Graph-based reasoning across machines, lines, and shared anomaly patterns**
3. **Learning-based calibration using real operational datasets**
4. **Human-in-the-loop feedback incorporation**
5. **Streaming deployment for online event processing**

## 11. Conclusion

Astraea demonstrates a practical path toward trustworthy AI for event-driven decision systems. Rather than pursuing only predictive complexity, it emphasizes deterministic behavior, structured explanations, auditability, and operational usefulness. This makes it suitable both as a deployable engineering artifact and as an MSc-level research prototype exploring the design of explainable, uncertainty-aware decision infrastructure.
