from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Any, Optional


@dataclass
class Event:
    event_id: str
    machine_id: str
    line_id: str
    event_type: str
    timestamp: datetime
    raw_values: Dict[str, float]
    source: str
    metadata: Dict = field(default_factory=dict)


@dataclass
class FeatureVector:
    event_id: str
    machine_id: str
    timestamp: datetime
    features: Dict[str, float]
    context: Dict[str, Any]


@dataclass
class ModelAssessment:
    event_id: str
    anomaly_score: float
    failure_probability: float
    confidence: float
    model_version: str
    top_features: List[str]


@dataclass
class PrioritizedCase:
    case_id: str
    event_id: str
    priority_score: float
    confidence_band: str
    severity: str
    rationale: List[str]
    requires_action: bool


@dataclass
class Decision:
    case_id: str
    recommendation: str
    urgency: str
    owner: Optional[str]
    justification: List[str]
    next_steps: List[str]


@dataclass
class AuditRecord:
    case_id: str
    event_snapshot: Dict
    feature_snapshot: Dict
    model_snapshot: Dict
    prioritization_snapshot: Dict
    decision_snapshot: Dict
    timestamp: datetime
