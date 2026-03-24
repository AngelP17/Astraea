from __future__ import annotations

from datetime import datetime, timezone
from math import exp, sqrt, tanh
from typing import Dict, List, Optional, Tuple
from collections import deque

from backend.shared.schemas import Event, ModelAssessment, PrioritizedCase


class TemporalPatternDetector:
    def __init__(self, window_size: int = 10):
        self.window_size = window_size
        self.event_history: Dict[str, deque] = {}

    def record_event(self, event: Event) -> None:
        machine_key = f"{event.line_id}:{event.machine_id}"
        if machine_key not in self.event_history:
            self.event_history[machine_key] = deque(maxlen=self.window_size)
        self.event_history[machine_key].append(
            {
                "timestamp": event.timestamp,
                "event_type": event.event_type,
                "anomaly_score": 0.0,
            }
        )

    def detect_trend(self, machine_key: str) -> float:
        if machine_key not in self.event_history or len(self.event_history[machine_key]) < 3:
            return 0.0

        history = list(self.event_history[machine_key])
        scores = [e["anomaly_score"] for e in history]

        n = len(scores)
        if n < 2:
            return 0.0

        x_mean = sum(range(n)) / n
        y_mean = sum(scores) / n

        numerator = sum((i - x_mean) * (s - y_mean) for i, s in enumerate(scores))
        denominator = sum((i - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            return 0.0

        slope = numerator / denominator
        return tanh(slope * 0.5)

    def detect_repeated_pattern(self, machine_key: str, event_type: str) -> Tuple[bool, int]:
        if machine_key not in self.event_history:
            return False, 0

        history = list(self.event_history[machine_key])
        recent_same_type = [h for h in history[-5:] if h["event_type"] == event_type]

        if len(recent_same_type) >= 3:
            return True, len(recent_same_type)
        return False, len(recent_same_type)

    def get_inter_event_interval(self, machine_key: str, event_type: str) -> float:
        if machine_key not in self.event_history:
            return float("inf")

        history = list(self.event_history[machine_key])
        same_type_events = [h["timestamp"] for h in history if h["event_type"] == event_type]

        if len(same_type_events) < 2:
            return float("inf")

        intervals = [
            (same_type_events[i] - same_type_events[i - 1]).total_seconds()
            for i in range(1, len(same_type_events))
        ]
        return sum(intervals) / len(intervals) if intervals else float("inf")


class CorrelationAnalyzer:
    def __init__(self):
        self.correlation_matrix: Dict[str, Dict[str, float]] = {}
        self._init_default_correlations()

    def _init_default_correlations(self) -> None:
        self.correlation_matrix = {
            "vibration_spike": {
                "temperature_rise": 0.7,
                "current_surge": 0.5,
                "pressure_anomaly": 0.4,
            },
            "temperature_rise": {
                "vibration_spike": 0.7,
                "current_surge": 0.6,
                "pressure_anomaly": 0.5,
            },
            "current_surge": {
                "vibration_spike": 0.5,
                "temperature_rise": 0.6,
                "stoppage": 0.8,
            },
            "stoppage": {
                "current_surge": 0.8,
                "vibration_spike": 0.3,
            },
            "pressure_anomaly": {
                "temperature_rise": 0.5,
                "vibration_spike": 0.4,
            },
        }

    def get_correlation_score(self, event_type: str, other_events: List[str]) -> float:
        if event_type not in self.correlation_matrix:
            return 0.0

        total_correlation = 0.0
        count = 0

        for other_type in other_events:
            if other_type in self.correlation_matrix[event_type]:
                total_correlation += self.correlation_matrix[event_type][other_type]
                count += 1

        return total_correlation / count if count > 0 else 0.0


class EnsembleScorer:
    def __init__(self):
        self.weights = {
            "anomaly": 0.30,
            "failure": 0.25,
            "severity": 0.15,
            "recency": 0.08,
            "temporal": 0.10,
            "correlation": 0.07,
            "velocity": 0.05,
        }
        self.decay_lambda = 0.00015

    def compute_ensemble_score(
        self,
        event: Event,
        assessment: ModelAssessment,
        temporal_trend: float,
        correlation_score: float,
        velocity_score: float,
    ) -> float:
        severity_signal = self._event_severity(event)
        recency_signal = self._recency_score(event)

        score = (
            self.weights["anomaly"] * assessment.anomaly_score
            + self.weights["failure"] * assessment.failure_probability
            + self.weights["severity"] * severity_signal
            + self.weights["recency"] * recency_signal
            + self.weights["temporal"] * (temporal_trend + 1) / 2
            + self.weights["correlation"] * correlation_score
            + self.weights["velocity"] * velocity_score
        )

        score = self._apply_duration_bonus(event, score)
        score = self._apply_repetition_penalty(event, score)
        score = self._apply_uncertainty_bonus(assessment, score)

        return min(max(score, 0.0), 1.0)

    def _event_severity(self, event: Event) -> float:
        severity_map: Dict[str, float] = {
            "vibration_spike": 0.90,
            "temperature_rise": 0.75,
            "stoppage": 0.98,
            "current_surge": 0.70,
            "pressure_anomaly": 0.80,
        }
        base_severity = severity_map.get(event.event_type, 0.40)

        critical_context_multiplier = 1.0
        if event.metadata.get("safety_critical", False):
            critical_context_multiplier = 1.2
        if event.metadata.get("production_impact", False):
            critical_context_multiplier *= 1.15

        return min(base_severity * critical_context_multiplier, 1.0)

    def _recency_score(self, event: Event) -> float:
        now = datetime.now(timezone.utc).timestamp()
        elapsed_seconds = max(now - event.timestamp.timestamp(), 0.0)
        return exp(-self.decay_lambda * elapsed_seconds)

    def _apply_duration_bonus(self, event: Event, score: float) -> float:
        duration = float(event.metadata.get("duration_seconds", 0))
        if duration > 600:
            return score + 0.12
        elif duration > 300:
            return score + 0.08
        elif duration > 60:
            return score + 0.03
        return score

    def _apply_repetition_penalty(self, event: Event, score: float) -> float:
        repeat_count = int(event.metadata.get("repeat_count", 0))
        if repeat_count >= 5:
            return min(score * 1.5, 1.0)
        elif repeat_count >= 3:
            return min(score * 1.3, 1.0)
        elif repeat_count >= 2:
            return min(score * 1.15, 1.0)
        return score

    def _apply_uncertainty_bonus(self, assessment: ModelAssessment, score: float) -> float:
        if assessment.uncertainty_low > 0.65:
            return score + 0.06
        elif assessment.uncertainty_low > 0.55:
            return score + 0.03
        return score


class DecisionPrioritizationEngine:
    def __init__(self) -> None:
        self.temporal_detector = TemporalPatternDetector(window_size=10)
        self.correlation_analyzer = CorrelationAnalyzer()
        self.ensemble_scorer = EnsembleScorer()

        self._recent_events: Dict[str, List[Event]] = {}
        self._line_event_cache: Dict[str, List[str]] = {}

    def prioritize(self, event: Event, assessment: ModelAssessment) -> PrioritizedCase:
        self.temporal_detector.record_event(event)
        self._update_line_cache(event)

        machine_key = f"{event.line_id}:{event.machine_id}"

        temporal_trend = self.temporal_detector.detect_trend(machine_key)

        is_repeated, repeat_count = self.temporal_detector.detect_repeated_pattern(
            machine_key, event.event_type
        )

        recent_events = self._get_recent_events_on_line(event.line_id)
        correlation_score = self.correlation_analyzer.get_correlation_score(
            event.event_type, recent_events
        )

        velocity_score = self._compute_velocity_score(event, machine_key)

        priority_score = self.ensemble_scorer.compute_ensemble_score(
            event=event,
            assessment=assessment,
            temporal_trend=temporal_trend,
            correlation_score=correlation_score,
            velocity_score=velocity_score,
        )

        confidence_band = self._confidence_band(assessment)
        severity = self._severity_label(priority_score)
        review_required = self._review_required(assessment, priority_score)
        routing_bucket = self._routing_bucket(severity, review_required)
        rationale = self._rationale(
            event,
            assessment,
            priority_score,
            review_required,
            temporal_trend,
            is_repeated,
            repeat_count,
            correlation_score,
        )

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

    def _update_line_cache(self, event: Event) -> None:
        if event.line_id not in self._line_event_cache:
            self._line_event_cache[event.line_id] = []

        self._line_event_cache[event.line_id].append(event.event_type)
        if len(self._line_event_cache[event.line_id]) > 50:
            self._line_event_cache[event.line_id] = self._line_event_cache[event.line_id][-50:]

    def _get_recent_events_on_line(self, line_id: str) -> List[str]:
        return self._line_event_cache.get(line_id, [])[-10:]

    def _compute_velocity_score(self, event: Event, machine_key: str) -> float:
        if machine_key not in self.temporal_detector.event_history:
            return 0.0

        history = list(self.temporal_detector.event_history[machine_key])
        if len(history) < 3:
            return 0.0

        recent_scores = [h["anomaly_score"] for h in history[-3:]]
        velocity = recent_scores[-1] - recent_scores[0]

        if len(recent_scores) >= 3:
            acceleration = (recent_scores[-1] - 2 * recent_scores[-2] + recent_scores[0]) / 2
            velocity += acceleration * 0.5

        return tanh(velocity * 2)

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

    def _review_required(self, assessment: ModelAssessment, priority_score: float) -> bool:
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
        temporal_trend: float,
        is_repeated: bool,
        repeat_count: int,
        correlation_score: float,
    ) -> List[str]:
        reasons: List[str] = []

        if assessment.anomaly_score >= 0.70:
            reasons.append("high anomaly score detected")
        if assessment.failure_probability >= 0.60:
            reasons.append("elevated failure probability")
        if assessment.uncertainty_low > 0.60:
            reasons.append("high-confidence abnormal interval")
        if event.event_type in {"vibration_spike", "stoppage"}:
            reasons.append(f"critical event type: {event.event_type}")
        if float(event.metadata.get("duration_seconds", 0.0)) > 300:
            reasons.append("prolonged duration exceeded threshold")
        if review_required:
            reasons.append("manual review required due to uncertainty band")
        if priority_score < 0.45:
            reasons.append("below active intervention threshold")

        if temporal_trend > 0.3:
            reasons.append(f"escalating pattern detected (trend: {temporal_trend:.2f})")
        elif temporal_trend < -0.3:
            reasons.append("improving trend detected")

        if is_repeated:
            reasons.append(f"repeated pattern: {repeat_count} events in sequence")

        if correlation_score > 0.5:
            reasons.append(f"strong correlation with recent events ({correlation_score:.2f})")

        return reasons or ["within expected operating envelope"]
