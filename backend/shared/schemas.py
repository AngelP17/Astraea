from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class Event:
    event_id: str
    machine_id: str
    line_id: str
    event_type: str
    timestamp: datetime
    raw_values: dict[str, float]
    source: str
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["timestamp"] = self.timestamp.isoformat()
        return payload


@dataclass
class FeatureVector:
    event_id: str
    machine_id: str
    timestamp: datetime
    features: dict[str, float]
    context: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["timestamp"] = self.timestamp.isoformat()
        return payload


@dataclass
class ModelAssessment:
    event_id: str
    anomaly_score: float
    failure_probability: float
    confidence: float
    uncertainty_low: float
    uncertainty_high: float
    model_version: str
    top_features: list[str]
    explanation_factors: list[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class PrioritizedCase:
    case_id: str
    event_id: str
    priority_score: float
    confidence_band: str
    severity: str
    rationale: list[str]
    requires_action: bool
    review_required: bool
    routing_bucket: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class Decision:
    case_id: str
    recommendation: str
    urgency: str
    owner: str | None
    justification: list[str]
    next_steps: list[str]
    action_plan: list[dict[str, Any]]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class ExecutionPlan:
    case_id: str
    dispatch_status: str
    assigned_team: str | None
    commands: list[str]
    notifications: list[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class DecisionConsequence:
    case_id: str
    downtime_avoided_minutes: float
    risk_level: str
    escalation_required: bool
    safety_impact: str
    production_impact: str
    cost_estimate_usd: float
    mtbf_impact_hours: float
    reasoning: list[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class AuditRecord:
    case_id: str
    event_snapshot: dict[str, Any]
    feature_snapshot: dict[str, Any]
    model_snapshot: dict[str, Any]
    prioritization_snapshot: dict[str, Any]
    decision_snapshot: dict[str, Any]
    execution_snapshot: dict[str, Any]
    deterministic_hash: str
    timestamp: datetime

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["timestamp"] = self.timestamp.isoformat()
        return payload


@dataclass
class PipelineResult:
    event_id: str
    case_id: str
    event: dict[str, Any]
    features: dict[str, Any]
    assessment: dict[str, Any]
    prioritized_case: dict[str, Any]
    decision: dict[str, Any]
    execution: dict[str, Any]
    consequence: dict[str, Any]
    audit: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def create_case_id(event_id: str) -> str:
    return f"case_{event_id}"
