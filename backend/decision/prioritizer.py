from math import exp, log
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum

from backend.shared.schemas import (
    Event,
    ModelAssessment,
    FeatureVector,
    PrioritizedCase,
)


class ConfidenceTier(Enum):
    STANDARD = "standard"
    TENTATIVE = "tentative"
    SPECULATIVE = "speculative"


class CaseClassification(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    IGNORE = "ignore"


@dataclass
class StageResult:
    stage_name: str
    passed: bool
    score: float = 0.0
    details: Dict[str, Any] = field(default_factory=dict)
    reasoning: List[str] = field(default_factory=list)


@dataclass
class RankingPipelineResult:
    case: PrioritizedCase
    pipeline_trace: List[StageResult]
    confidence_tier: ConfidenceTier
    classification: CaseClassification
    raw_score: float
    adjusted_score: float


@dataclass
class QualityGate:
    name: str
    threshold: float
    weight: float = 1.0


class DecisionPrioritizationEngine:
    QUALITY_GATES = [
        QualityGate("anomaly_threshold", 0.3),
        QualityGate("failure_threshold", 0.25),
        QualityGate("confidence_threshold", 0.4),
        QualityGate("data_quality", 0.2),
    ]

    def __init__(self):
        self.weights = {
            "anomaly": 0.35,
            "failure": 0.30,
            "severity": 0.25,
            "recency": 0.10,
        }
        self.decay_lambda = 0.08
        self._event_history: Dict[str, List[datetime]] = {}
        self._domain_authority = {
            "edu": 1.0,
            "gov": 1.0,
            "org": 0.7,
            "com": 0.5,
            "io": 0.5,
            "local-file": 0.8,
            "unknown": 0.3,
        }

    def compute_score(
        self, event: Event, assessment: ModelAssessment, current_time: float
    ) -> float:
        elapsed = current_time - event.timestamp.timestamp()
        recency = exp(-self.decay_lambda * elapsed)

        score = (
            self.weights["anomaly"] * assessment.anomaly_score
            + self.weights["failure"] * assessment.failure_probability
            + self.weights["severity"] * self._severity(event)
            + self.weights["recency"] * recency
        )

        if self._repeated(event):
            score *= 1.4

        return min(score, 1.0)

    def _severity(self, event: Event) -> float:
        severity_map = {
            "vibration_spike": 0.9,
            "temperature_rise": 0.7,
            "stoppage": 0.95,
            "current_surge": 0.6,
            "pressure_anomaly": 0.75,
        }
        return severity_map.get(event.event_type, 0.4)

    def _repeated(self, event: Event) -> bool:
        duration = event.metadata.get("duration_seconds", 0)
        if duration > 300:
            return True
        machine_id = event.machine_id
        if machine_id not in self._event_history:
            self._event_history[machine_id] = []
        self._event_history[machine_id].append(event.timestamp)
        recent_count = sum(
            1
            for t in self._event_history[machine_id]
            if (datetime.now(timezone.utc) - t).total_seconds() < 3600
        )
        return recent_count > 3

    def _tokenize(self, text: str) -> List[str]:
        import re

        return [
            t.lower() for t in re.sub(r"[^a-z0-9\s]", " ", text).split() if len(t) > 1
        ]

    def _jaccard_similarity(self, left: str, right: str) -> float:
        left_tokens = set(self._tokenize(left))
        right_tokens = set(self._tokenize(right))
        if not left_tokens or not right_tokens:
            return 0.0
        intersection = len(left_tokens & right_tokens)
        union = len(left_tokens | right_tokens)
        return intersection / union if union > 0 else 0.0

    def _detect_conflict(
        self, candidate_content: str, other_contents: List[str], threshold: float = 0.42
    ) -> bool:
        import re

        candidate_numbers = list(
            set(re.findall(r"\b\d+(?:\.\d+)?\b", candidate_content or ""))
        )[:6]
        if not candidate_numbers:
            return False
        for other in other_contents:
            if (
                self._jaccard_similarity(candidate_content or "", other or "")
                < threshold
            ):
                continue
            other_numbers = list(set(re.findall(r"\b\d+(?:\.\d+)?\b", other or "")))[:6]
            if not other_numbers:
                continue
            if not set(candidate_numbers) & set(other_numbers):
                return True
        return False

    def _compute_authority_score(self, source: str) -> float:
        if not source:
            return 0.3
        source_lower = source.lower()
        for domain, score in self._domain_authority.items():
            if source_lower.endswith(f".{domain}") or source_lower == domain:
                return score
        return 0.3

    def _quality_score(self, event: Event, assessment: ModelAssessment) -> float:
        words_in_values = sum(len(str(v)) for v in event.raw_values.values())
        content_score = min(words_in_values / 500, 1.0) * 0.2
        anomaly_score = assessment.anomaly_score * 0.4
        confidence_score = assessment.confidence * 0.3
        authority = self._compute_authority_score(event.source) * 0.1
        return min(1.0, content_score + anomaly_score + confidence_score + authority)

    def _stage1_filter(
        self,
        event: Event,
        assessment: ModelAssessment,
        feature_vector: Optional[FeatureVector],
    ) -> StageResult:
        result = StageResult(
            stage_name="quality_filter",
            passed=True,
            details={},
            reasoning=[],
        )

        quality = self._quality_score(event, assessment)
        result.score = quality

        anomaly_pass = assessment.anomaly_score >= self.QUALITY_GATES[0].threshold
        failure_pass = assessment.failure_probability >= self.QUALITY_GATES[1].threshold
        confidence_pass = assessment.confidence >= self.QUALITY_GATES[2].threshold
        quality_pass = quality >= self.QUALITY_GATES[3].threshold

        result.details = {
            "anomaly_check": {
                "passed": anomaly_pass,
                "value": assessment.anomaly_score,
            },
            "failure_check": {
                "passed": failure_pass,
                "value": assessment.failure_probability,
            },
            "confidence_check": {
                "passed": confidence_pass,
                "value": assessment.confidence,
            },
            "quality_check": {"passed": quality_pass, "value": quality},
        }

        if not (anomaly_pass or failure_pass):
            result.passed = False
            result.reasoning.append("Failed minimum threshold checks")

        if quality_pass:
            result.reasoning.append("Passed quality gate")
        else:
            result.reasoning.append("Low quality signal - flagged for review")

        return result

    def _stage2_rescore(
        self, event: Event, assessment: ModelAssessment, current_time: float
    ) -> StageResult:
        result = StageResult(
            stage_name="multi_factor_rescore",
            passed=True,
            details={},
            reasoning=[],
        )

        elapsed = current_time - event.timestamp.timestamp()
        recency = exp(-self.decay_lambda * elapsed)

        base_score = (
            self.weights["anomaly"] * assessment.anomaly_score
            + self.weights["failure"] * assessment.failure_probability
            + self.weights["severity"] * self._severity(event)
        )

        recency_weighted = self.weights["recency"] * recency
        severity_factor = self._severity(event)
        repeated_penalty = 1.4 if self._repeated(event) else 1.0

        final_score = min((base_score + recency_weighted) * repeated_penalty, 1.0)

        result.score = final_score
        result.details = {
            "base_score": base_score,
            "recency_contribution": recency_weighted,
            "severity_factor": severity_factor,
            "repeated_multiplier": repeated_penalty,
            "components": {
                "anomaly": assessment.anomaly_score,
                "failure": assessment.failure_probability,
                "severity": severity_factor,
                "recency": recency,
            },
        }

        if repeated_penalty > 1.0:
            result.reasoning.append("Applied repeat event multiplier")
        if severity_factor > 0.7:
            result.reasoning.append(f"High severity event: {event.event_type}")

        return result

    def _stage3_classify(
        self, score: float, assessment: ModelAssessment, event: Event
    ) -> Tuple[StageResult, CaseClassification, ConfidenceTier]:
        result = StageResult(
            stage_name="classification",
            passed=True,
            score=score,
            details={},
            reasoning=[],
        )

        if score > 0.8:
            classification = CaseClassification.CRITICAL
            result.reasoning.append("Critical priority - immediate action required")
        elif score > 0.65:
            classification = CaseClassification.HIGH
            result.reasoning.append("High priority - action within 1 hour")
        elif score > 0.45:
            classification = CaseClassification.MEDIUM
            result.reasoning.append("Medium priority - scheduled action")
        elif score > 0.25:
            classification = CaseClassification.LOW
            result.reasoning.append("Low priority - monitor only")
        else:
            classification = CaseClassification.IGNORE
            result.passed = False
            result.reasoning.append("Below action threshold")

        if assessment.confidence > 0.8 and score > 0.5:
            confidence_tier = ConfidenceTier.STANDARD
            result.reasoning.append("High confidence - standard processing")
        elif assessment.confidence > 0.5:
            confidence_tier = ConfidenceTier.TENTATIVE
            result.reasoning.append("Medium confidence - tentative classification")
        else:
            confidence_tier = ConfidenceTier.SPECULATIVE
            result.reasoning.append("Low confidence - speculative classification")

        result.details = {
            "classification": classification.value,
            "confidence_tier": confidence_tier.value,
            "raw_confidence": assessment.confidence,
            "model_version": assessment.model_version,
        }

        return result, classification, confidence_tier

    def _stage4_prioritize(
        self,
        event: Event,
        assessment: ModelAssessment,
        score: float,
        classification: CaseClassification,
        confidence_tier: ConfidenceTier,
    ) -> PrioritizedCase:
        severity_map = {
            CaseClassification.CRITICAL: "critical",
            CaseClassification.HIGH: "high",
            CaseClassification.MEDIUM: "medium",
            CaseClassification.LOW: "low",
            CaseClassification.IGNORE: "low",
        }

        confidence_band_map = {
            ConfidenceTier.STANDARD: "high",
            ConfidenceTier.TENTATIVE: "medium",
            ConfidenceTier.SPECULATIVE: "low",
        }

        rationale = []
        if assessment.anomaly_score > 0.6:
            rationale.append("High anomaly score detected")
        if assessment.failure_probability > 0.5:
            rationale.append("Elevated failure probability")
        if self._repeated(event):
            rationale.append("Repeated event pattern detected")
        if event.event_type in ("vibration_spike", "stoppage"):
            rationale.append(f"Critical event type: {event.event_type}")
        if self._quality_score(event, assessment) < 0.35:
            rationale.append("Low quality signal - requires verification")

        if classification == CaseClassification.IGNORE:
            rationale.append("Below action threshold")
        elif classification == CaseClassification.CRITICAL:
            rationale.insert(0, "CRITICAL - Immediate inspection required")

        return PrioritizedCase(
            case_id=f"case_{event.event_id}",
            event_id=event.event_id,
            priority_score=round(score, 4),
            confidence_band=confidence_band_map.get(confidence_tier, "low"),
            severity=severity_map.get(classification, "low"),
            rationale=rationale
            if rationale
            else ["Within normal operating parameters"],
            requires_action=classification != CaseClassification.IGNORE,
        )

    def run_pipeline(
        self,
        event: Event,
        assessment: ModelAssessment,
        feature_vector: Optional[FeatureVector] = None,
    ) -> RankingPipelineResult:
        pipeline_trace: List[StageResult] = []

        stage1_result = self._stage1_filter(event, assessment, feature_vector)
        pipeline_trace.append(stage1_result)

        if not stage1_result.passed:
            case = PrioritizedCase(
                case_id=f"case_{event.event_id}",
                event_id=event.event_id,
                priority_score=0.0,
                confidence_band="low",
                severity="low",
                rationale=["Failed quality filter - requires manual review"],
                requires_action=False,
            )
            return RankingPipelineResult(
                case=case,
                pipeline_trace=pipeline_trace,
                confidence_tier=ConfidenceTier.SPECULATIVE,
                classification=CaseClassification.IGNORE,
                raw_score=0.0,
                adjusted_score=0.0,
            )

        now = datetime.now(timezone.utc).timestamp()
        stage2_result = self._stage2_rescore(event, assessment, now)
        pipeline_trace.append(stage2_result)

        stage3_result, classification, confidence_tier = self._stage3_classify(
            stage2_result.score, assessment, event
        )
        pipeline_trace.append(stage3_result)

        adjusted_score = stage2_result.score
        if confidence_tier == ConfidenceTier.SPECULATIVE:
            adjusted_score *= 0.8
            pipeline_trace[2].reasoning.append("Applied speculative discount")
        elif confidence_tier == ConfidenceTier.STANDARD and classification in (
            CaseClassification.CRITICAL,
            CaseClassification.HIGH,
        ):
            adjusted_score = min(adjusted_score * 1.1, 1.0)
            pipeline_trace[2].reasoning.append("Applied high-confidence boost")

        case = self._stage4_prioritize(
            event, assessment, adjusted_score, classification, confidence_tier
        )

        return RankingPipelineResult(
            case=case,
            pipeline_trace=pipeline_trace,
            confidence_tier=confidence_tier,
            classification=classification,
            raw_score=stage2_result.score,
            adjusted_score=adjusted_score,
        )

    def prioritize(
        self,
        event: Event,
        assessment: ModelAssessment,
        feature_vector: Optional[FeatureVector] = None,
    ) -> PrioritizedCase:
        result = self.run_pipeline(event, assessment, feature_vector)
        return result.case

    def rerank_cases(
        self, cases: List[PrioritizedCase], events: List[Event]
    ) -> List[PrioritizedCase]:
        if len(cases) <= 1:
            return cases

        docs = [f"{e.event_type} {e.machine_id} {e.line_id}" for e in events]

        for i, case in enumerate(cases):
            if i < len(docs):
                other_docs = [d for j, d in enumerate(docs) if j != i]
                conflict = self._detect_conflict(docs[i], other_docs)
                if conflict:
                    case.priority_score *= 0.9
                    case.rationale.append(
                        "Potential conflict detected - score adjusted"
                    )

        return sorted(cases, key=lambda c: c.priority_score, reverse=True)
