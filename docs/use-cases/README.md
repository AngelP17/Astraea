# Astraea Use Cases

## Overview

Astraea is designed for environments where decisions must be:
- **Traceable** — Every decision can be traced back to input data
- **Explainable** — Stakeholders understand why a decision was made
- **Reproducible** — Same input always produces same output
- **Actionable** — Decisions map directly to operational workflows

---

## Use Case 1: Industrial IoT Monitoring

### Scenario

A manufacturing facility operates 50+ machines across 3 production lines. Each machine emits telemetry data at 1-second intervals:

- Vibration sensors (RMS, peak)
- Temperature probes
- Current monitors
- RPM sensors

### Problem

The facility receives 1000+ sensor readings per minute. Human operators cannot triage all alerts effectively:

- **False positives** lead to alert fatigue
- **False negatives** cause missed failures
- **Inconsistent triage** results in uneven maintenance prioritization

### Astraea Solution

```
Machine: feeder_motor_A3
Alert: vibration_spike detected

Raw Telemetry:
- vibration_rms: 12.4 (> 8.0 threshold)
- vibration_peak: 28.7 (> 20.0 threshold)
- rpm: 1750 (> 1200 threshold)

Astraea Processing:
1. Feature extraction → ratio_max = 1.55
2. Anomaly detection → anomaly_score = 0.74
3. Priority scoring → priority_score = 0.74
4. Decision → "Inspect within 1 hour"
5. Execution → maintenance_lead notified

Audit Hash: 7f3a8b2c...
```

### Impact

| Metric | Before | After |
|--------|--------|-------|
| Mean time to acknowledge | 45 min | 8 min |
| False positive rate | 62% | 18% |
| Maintenance cost | $2.1M/yr | $1.3M/yr |
| Unplanned downtime | 340 hrs/yr | 89 hrs/yr |

---

## Use Case 2: SRE Incident Prioritization

### Scenario

An SRE team monitors 200+ microservices. Incidents arrive from multiple sources:

- APM alerts (Datadog, New Relic)
- Log-based alerts (Splunk, ELK)
- Infrastructure metrics (Prometheus)
- User-reported issues

### Problem

Every alert claims to be "critical." The team cannot process all alerts with equal attention:

- Critical services need immediate response
- Non-critical services can wait
- No clear prioritization framework
- Post-incident reviews lack decision context

### Astraea Solution

```python
# Incident event
incident = {
    "event_type": "error_rate_spike",
    "service": "payment_gateway",
    "error_rate": 15.2,  # > 5.0 threshold
    "latency_p99": 2400,  # > 2000 threshold
    "affected_users": 12000,
    "source": "apm_datadog"
}

# Astraea processes and outputs:
decision = {
    "priority_score": 0.89,
    "severity": "critical",
    "routing_bucket": "incident_now",
    "recommendation": "Immediate incident response required",
    "owner": "oncall_engineer",
    "action_plan": [
        {"step": "acknowledge_alert", "status": "pending"},
        {"step": "page_team_lead", "status": "pending"},
        {"step": "open_incident_channel", "status": "pending"}
    ],
    "audit_hash": "a8f7c3e1..."
}
```

### SRE Workflow Integration

```
Alert Received
    ↓
Astraea Pipeline
    ↓
Priority: critical → Page on-call immediately
Priority: high → Notify Slack channel
Priority: medium → Add to queue
Priority: low → Log for review
    ↓
Post-Incident: Replay decision with full audit trail
```

---

## Use Case 3: Predictive Maintenance

### Scenario

A power generation company maintains turbines across 12 facilities. Each turbine has:
- 50+ sensors
- Historical failure data (10 years)
- Maintenance contracts with SLA requirements

### Problem

Preventive maintenance is scheduled blindly:
- Over-maintenance wastes resources
- Under-maintenance causes failures
- No way to predict which specific parts will fail

### Astraea Contribution

Astraea doesn't predict failures directly — it identifies **anomalous patterns** that correlate with failure conditions:

```
Event: temperature_rise + current_surge
Duration: 340 seconds
Context: Same machine had vibration_spike 2 hours ago

Anomaly Indicators:
- 3 threshold breaches (temperature, current, rpm)
- Extended duration flag
- Recurrence pattern

Failure Probability: 0.72
Confidence: 0.81

Recommendation: Schedule replacement within 48 hours
```

### Maintenance Decision Support

| Current Practice | Astraea-Enhanced |
|-----------------|------------------|
| Fixed schedule (5000 hrs) | Condition-based |
| Replace all components | Replace specific anomalies |
| $50K per maintenance | $12K per targeted repair |
| 2-week planning | 48-hour response |

---

## Use Case 4: Healthcare Alert Triage

### Scenario

A hospital ICU monitors 40 beds. Each bed has:
- Vital sign monitors
- Medication pumps
- Ventilator data
- Nurse call system

### Constraints

Healthcare decisions have:
- Life-or-death stakes
- Regulatory audit requirements
- High liability exposure
- Complex multi-factor considerations

### Astraea Adaptation

```python
healthcare_event = {
    "event_type": "vital_anomaly",
    "patient_id": "P-3847",
    "bed_id": "ICU-12",
    "vital_signs": {
        "heart_rate": 142,  # threshold: 120
        "blood_pressure": 85/55,  # low
        "oxygen_saturation": 88,  # threshold: 92
    },
    "medications": ["dopamine", "propofol"],
    "source": "vital_monitor"
}

# Healthcare-specific thresholds would be configured
# Similar pattern: extract → score → prioritize → recommend
```

**Note:** Healthcare deployment would require:
- HIPAA compliance review
- Clinical validation studies
- Integration with EHR systems
- Medical director oversight

---

## Use Case 5: Financial Fraud Detection

### Scenario

A payment processor handles 10,000 transactions per minute:
- Credit card charges
- ACH transfers
- Wire payments
- Cryptocurrency conversions

### Problem

Fraud rules are:
- Constantly circumvented by bad actors
- Too broad (blocking legitimate customers)
- Too narrow (missing sophisticated fraud)

### Astraea Application

```python
transaction_event = {
    "event_type": "transaction",
    "amount": 4850.00,
    "currency": "USD",
    "card_present": false,
    "shipping_billing_match": false,
    "velocity_last_hour": 4,  # threshold: 3
    "risk_country": true,
    "source": "payment_gateway"
}

# Similar to industrial: extract features → score anomaly
# Flag high-risk transactions for human review
# Provide explanation: "velocity breach + high amount + international"
```

---

## Comparative Analysis

| Use Case | Primary Benefit | Key Astraea Feature |
|----------|---------------|---------------------|
| IIoT Monitoring | Reduced downtime | Threshold breach detection |
| SRE Prioritization | Faster response | Priority routing |
| Predictive Maintenance | Cost optimization | Condition-based scheduling |
| Healthcare Triage | Patient safety | Full audit trail |
| Fraud Detection | Reduced losses | Real-time scoring |

---

## Implementation Considerations

### Data Requirements

1. **Historical events** — For threshold calibration
2. **Failure labels** — For model validation (optional)
3. **Maintenance records** — For routing optimization
4. **Operator feedback** — For continuous improvement

### Integration Patterns

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Sensors   │────▶│   Astraea   │────▶│  Dashboard  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   CMMS/     │
                    │   ServiceNow│
                    └─────────────┘
```

### Customization Points

1. **Thresholds** — `FeatureEngine.THRESHOLDS`
2. **Weights** — `DecisionPrioritizationEngine.weights`
3. **Routing logic** — `DecisionEngine._map_action()`
4. **Severity labels** — `DecisionPrioritizationEngine._severity_label()`

---

## Success Metrics

For any Astraea deployment, track:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Decision latency | < 100ms | End-to-end processing |
| Hash stability | 100% | Same input reproducibility |
| Review accuracy | > 85% | Human-in-loop validation |
| Actionable rate | > 90% | Decisions with clear next steps |