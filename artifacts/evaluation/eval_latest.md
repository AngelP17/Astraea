# Astraea Evaluation Report

Generated: `2026-05-29T16:21:47.436350+00:00`

Dataset: `generated_labeled_synthetic_v1`

Cases: `500`

## Metrics

| Metric | Value |
| --- | ---: |
| Replay pass rate | 100.00% |
| Audit completeness | 100.00% |
| Rationale coverage | 100.00% |
| Mean latency | 0.1623 ms |
| P99 latency | 0.2469 ms |
| Throughput | 6160.12 events/sec |

## Baselines

| System | Precision | Recall | Routing Accuracy | False Escalation |
| --- | ---: | ---: | ---: | ---: |
| Threshold only | 62.50% | 100.00% | 70.00% | 60.00% |
| Scoring only | 83.33% | 100.00% | 90.00% | 20.00% |
| Frozen model | 100.00% | 100.00% | 100.00% | 0.00% |
| Astraea | 100.00% | 100.00% | 100.00% | 0.00% |

Economic values are synthetic and derived from labeled simulation outcomes.
