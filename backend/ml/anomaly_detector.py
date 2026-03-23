from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple

from backend.shared.schemas import FeatureVector, ModelAssessment


class ConfidenceBand(Enum):
    HIGH_CONFidence_ANOMALY = "high_confidence_anomaly"
    REVIEW_NEEDED = "review_needed"
    HIGH_CONFIDENCE_NORMAL = "high_confidence_normal"


@dataclass
class ConformalResult:
    calibrated_score: float
    confidence_band: ConfidenceBand
    interval_low: float
    interval_high: float


class AnomalyDetector:
    VERSION = "conformal_v1"

    def __init__(self, alpha: float = 0.05):
        self.alpha = alpha
        self.q_hat: Optional[float] = None
        self._calibration_scores: List[float] = []
        self._calibration_labels: List[int] = []
        self._fitted = False

    def calibrate(self, scores: List[float], labels: List[int]) -> "AnomalyDetector":
        nonconf = [abs(s - l) for s, l in zip(scores, labels)]
        n = len(nonconf)
        if n == 0:
            self.q_hat = 0.5
            self._fitted = True
            return self

        q_level = min((n + 1) * (1 - self.alpha) / n, 1.0)
        sorted_scores = sorted(nonconf)
        q_idx = min(int(q_level * n), n - 1)
        self.q_hat = sorted_scores[q_idx]
        self._calibration_scores = scores
        self._calibration_labels = labels
        self._fitted = True
        return self

    def assess(self, fv: FeatureVector) -> ModelAssessment:
        anomaly_score = self._score_anomaly(fv)
        failure_prob = self._score_failure(fv)
        confidence = min(anomaly_score + 0.1, 1.0)
        top = self._top_features(fv)

        return ModelAssessment(
            event_id=fv.event_id,
            anomaly_score=round(anomaly_score, 4),
            failure_probability=round(failure_prob, 4),
            confidence=round(confidence, 4),
            model_version=self.VERSION,
            top_features=top,
        )

    def assess_with_uncertainty(
        self, fv: FeatureVector
    ) -> Tuple[ModelAssessment, ConformalResult]:
        assessment = self.assess(fv)

        if self.q_hat is not None:
            calibrated = assessment.anomaly_score
            interval_low = max(0.0, calibrated - self.q_hat)
            interval_high = min(1.0, calibrated + self.q_hat)

            includes_high = interval_high > 0.6
            includes_low = interval_low < 0.4

            if includes_high and not includes_low:
                band = ConfidenceBand.HIGH_CONFidence_ANOMALY
            elif includes_low and not includes_high:
                band = ConfidenceBand.HIGH_CONFIDENCE_NORMAL
            else:
                band = ConfidenceBand.REVIEW_NEEDED

            conformal_result = ConformalResult(
                calibrated_score=calibrated,
                confidence_band=band,
                interval_low=round(interval_low, 4),
                interval_high=round(interval_high, 4),
            )
        else:
            conformal_result = ConformalResult(
                calibrated_score=assessment.anomaly_score,
                confidence_band=ConfidenceBand.REVIEW_NEEDED,
                interval_low=0.0,
                interval_high=1.0,
            )

        return assessment, conformal_result

    def _score_anomaly(self, fv: FeatureVector) -> float:
        above = sum(
            1 for k, v in fv.context.items() if k.endswith("_above_threshold") and v
        )
        total = sum(1 for k in fv.context if k.endswith("_above_threshold"))
        if total == 0:
            return 0.3

        base = above / total

        event_type = fv.context.get("event_type", "")
        if event_type == "vibration_spike":
            base = min(base + 0.25, 1.0)
        elif event_type == "temperature_rise":
            base = min(base + 0.15, 1.0)
        elif event_type == "stoppage":
            base = min(base + 0.3, 1.0)

        return base

    def _score_failure(self, fv: FeatureVector) -> float:
        ratios = [v for k, v in fv.features.items() if k.startswith("ratio_")]
        if not ratios:
            return 0.2

        max_ratio = max(ratios)
        severity_weight = 1.0

        if fv.context.get("event_type") == "vibration_spike":
            severity_weight = 1.2
        elif fv.context.get("event_type") == "stoppage":
            severity_weight = 1.3

        return min(max_ratio * 0.8 * severity_weight, 1.0)

    def _top_features(self, fv: FeatureVector) -> List[str]:
        sorted_feats = sorted(
            fv.features.items(), key=lambda x: abs(x[1]), reverse=True
        )
        return [k for k, _ in sorted_feats[:3]]
