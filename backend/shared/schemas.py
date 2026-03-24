from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class Event:
    event_id: str
    machine_id: str
    line_id: str
    event_type: str
    timestamp: datetime
    raw_values: Dict[str, float]
    source: str
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        payload = asdict(self)
        payload["timestamp"] = self.timestamp.isoformat()
        return payload


@dataclass
class FeatureVector:
    event_id: str
    machine_id: str
    timestamp: datetime
    features: Dict[str, float]
    context: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
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
    top_features: List[str]
    explanation_factors: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class PrioritizedCase:
    case_id: str
    event_id: str
    priority_score: float
    confidence_band: str
    severity: str
    rationale: List[str]
    requires_action: bool
    review_required: bool
    routing_bucket: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Decision:
    case_id: str
    recommendation: str
    urgency: str
    owner: Optional[str]
    justification: List[str]
    next_steps: List[str]
    action_plan: List[Dict[str, Any]]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ExecutionPlan:
    case_id: str
    dispatch_status: str
    assigned_team: Optional[str]
    commands: List[str]
    notifications: List[str]

    def to_dict(self) -> Dict[str, Any]:
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
    reasoning: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class AuditRecord:
    case_id: str
    event_snapshot: Dict[str, Any]
    feature_snapshot: Dict[str, Any]
    model_snapshot: Dict[str, Any]
    prioritization_snapshot: Dict[str, Any]
    decision_snapshot: Dict[str, Any]
    execution_snapshot: Dict[str, Any]
    deterministic_hash: str
    timestamp: datetime

    def to_dict(self) -> Dict[str, Any]:
        payload = asdict(self)
        payload["timestamp"] = self.timestamp.isoformat()
        return payload


@dataclass
class PipelineResult:
    event_id: str
    case_id: str
    event: Dict[str, Any]
    features: Dict[str, Any]
    assessment: Dict[str, Any]
    prioritized_case: Dict[str, Any]
    decision: Dict[str, Any]
    execution: Dict[str, Any]
    consequence: Dict[str, Any]
    audit: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def create_case_id(event_id: str) -> str:
    return f"case_{event_id}"
