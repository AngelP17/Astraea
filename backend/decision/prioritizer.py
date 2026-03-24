from __future__ import annotations

from datetime import datetime, timezone
from math import exp
from typing import Dict, List

from backend.shared.schemas import Event, ModelAssessment, PrioritizedCase


class DecisionPrioritizationEngine:
    def __init__(self) -> None:
        self.weights = {
            "anomaly": 0.38,
            "failure": 0.30,
            "severity": 0.22,
            "recency": 0.10,
        }
        self.decay_lambda = 0.00015

    def prioritize(self, event: Event, assessment: ModelAssessment) -> PrioritizedCase:
        priority_score = self._priority_score(event, assessment)
        confidence_band = self._confidence_band(assessment)
        severity = self._severity_label(priority_score)
        review_required = self._review_required(assessment, priority_score)
        routing_bucket = self._routing_bucket(severity, review_required)
        rationale = self._rationale(event, assessment, priority_score, review_required)

        return PrioritizedCase(
            case_id=f"case_{event.event_id}",
            event_id=event.event_id,
            priority_score=round(priority_score, 4),
            confidence_band=confidence_band,
            severity=severity,
            rationale=rationale,
            requires_action=severity in {"critical", "high", "medium"},
            review_required=review_required,
            routing_bucket=routing_bucket,
        )

    def _priority_score(self, event: Event, assessment: ModelAssessment) -> float:
        severity_signal = self._event_severity(event)
        recency_signal = self._recency_score(event)

        score = (
            self.weights["anomaly"] * assessment.anomaly_score
            + self.weights["failure"] * assessment.failure_probability
            + self.weights["severity"] * severity_signal
            + self.weights["recency"] * recency_signal
        )

        if (
            event.metadata.get("duration_seconds", 0)
            and float(event.metadata.get("duration_seconds", 0)) > 300
        ):
            score += 0.08

        if assessment.uncertainty_low > 0.60:
            score += 0.05

        return min(max(score, 0.0), 1.0)

    def _event_severity(self, event: Event) -> float:
        severity_map: Dict[str, float] = {
            "vibration_spike": 0.90,
            "temperature_rise": 0.75,
            "stoppage": 0.98,
            "current_surge": 0.70,
            "pressure_anomaly": 0.80,
        }
        return severity_map.get(event.event_type, 0.40)

    def _recency_score(self, event: Event) -> float:
        now = datetime.now(timezone.utc).timestamp()
        elapsed_seconds = max(now - event.timestamp.timestamp(), 0.0)
        return exp(-self.decay_lambda * elapsed_seconds)

    def _confidence_band(self, assessment: ModelAssessment) -> str:
        if assessment.confidence >= 0.80:
            return "high"
        if assessment.confidence >= 0.55:
            return "medium"
        return "low"

    def _severity_label(self, score: float) -> str:
        if score >= 0.82:
            return "critical"
        if score >= 0.65:
            return "high"
        if score >= 0.45:
            return "medium"
        return "low"

    def _review_required(
        self, assessment: ModelAssessment, priority_score: float
    ) -> bool:
        interval_width = assessment.uncertainty_high - assessment.uncertainty_low
        return (
            assessment.confidence < 0.60
            or interval_width > 0.35
            or (priority_score >= 0.45 and assessment.uncertainty_low < 0.40)
        )

    def _routing_bucket(self, severity: str, review_required: bool) -> str:
        if severity == "critical":
            return "incident_now"
        if review_required:
            return "human_review"
        if severity == "high":
            return "maintenance_priority"
        if severity == "medium":
            return "scheduled_followup"
        return "monitor_only"

    def _rationale(
        self,
        event: Event,
        assessment: ModelAssessment,
        priority_score: float,
        review_required: bool,
    ) -> List[str]:
        reasons: List[str] = []

        if assessment.anomaly_score >= 0.70:
            reasons.append("high anomaly score")
        if assessment.failure_probability >= 0.60:
            reasons.append("elevated failure probability")
        if assessment.uncertainty_low > 0.60:
            reasons.append("high-confidence abnormal interval")
        if event.event_type in {"vibration_spike", "stoppage"}:
            reasons.append(f"critical event type: {event.event_type}")
        if float(event.metadata.get("duration_seconds", 0.0)) > 300:
            reasons.append("prolonged duration exceeded 300 seconds")
        if review_required:
            reasons.append("manual review required due to uncertainty band")
        if priority_score < 0.45:
            reasons.append("below active intervention threshold")

        return reasons or ["within expected operating envelope"]
