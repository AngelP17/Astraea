from __future__ import annotations

from typing import List, Tuple

from backend.shared.schemas import FeatureVector, ModelAssessment


class AnomalyDetector:
    VERSION = "astraea_det_v2"

    def __init__(self, alpha: float = 0.10):
        self.alpha = alpha

    def assess(self, fv: FeatureVector) -> ModelAssessment:
        anomaly_score = self._score_anomaly(fv)
        failure_probability = self._score_failure(fv)
        confidence = self._score_confidence(fv, anomaly_score, failure_probability)
        interval_low, interval_high = self._uncertainty_interval(
            anomaly_score=anomaly_score,
            confidence=confidence,
        )
        top_features = self._top_features(fv)
        explanation_factors = self._explanation_factors(
            fv, anomaly_score, failure_probability
        )

        return ModelAssessment(
            event_id=fv.event_id,
            anomaly_score=round(anomaly_score, 4),
            failure_probability=round(failure_probability, 4),
            confidence=round(confidence, 4),
            uncertainty_low=round(interval_low, 4),
            uncertainty_high=round(interval_high, 4),
            model_version=self.VERSION,
            top_features=top_features,
            explanation_factors=explanation_factors,
        )

    def _score_anomaly(self, fv: FeatureVector) -> float:
        triggered = [
            key
            for key, value in fv.context.items()
            if key.endswith("_above_threshold") and value is True
        ]
        total_checks = len([k for k in fv.context if k.endswith("_above_threshold")])

        if total_checks == 0:
            threshold_component = 0.20
        else:
            threshold_component = len(triggered) / total_checks

        event_bias = float(fv.context.get("baseline_severity", 0.4))
        duration_bonus = 0.10 if fv.context.get("extended_duration", False) else 0.0
        ratio_bonus = min(float(fv.features.get("ratio_max", 0.0)) * 0.10, 0.20)

        score = (
            0.45 * threshold_component
            + 0.35 * event_bias
            + duration_bonus
            + ratio_bonus
        )
        return min(max(score, 0.0), 1.0)

    def _score_failure(self, fv: FeatureVector) -> float:
        ratio_max = float(fv.features.get("ratio_max", 0.0))
        delta_max = float(fv.features.get("delta_max", 0.0))
        duration_seconds = float(fv.features.get("duration_seconds", 0.0))

        duration_factor = min(duration_seconds / 600.0, 1.0)
        ratio_factor = min(ratio_max / 2.0, 1.0)
        delta_factor = min(max(delta_max, 0.0) / 25.0, 1.0)

        score = 0.45 * ratio_factor + 0.35 * delta_factor + 0.20 * duration_factor
        return min(max(score, 0.0), 1.0)

    def _score_confidence(
        self,
        fv: FeatureVector,
        anomaly_score: float,
        failure_probability: float,
    ) -> float:
        top_signal = max(anomaly_score, failure_probability)
        source = str(fv.context.get("source", "")).lower()

        source_bonus = 0.05 if source in {"sensor_gateway", "plc_monitor"} else 0.0
        consistency_bonus = (
            0.05 if abs(anomaly_score - failure_probability) < 0.25 else 0.0
        )

        confidence = 0.65 * top_signal + source_bonus + consistency_bonus
        return min(max(confidence, 0.0), 1.0)

    def _uncertainty_interval(
        self, anomaly_score: float, confidence: float
    ) -> Tuple[float, float]:
        spread = max(0.05, 0.30 * (1.0 - confidence))
        low = max(0.0, anomaly_score - spread)
        high = min(1.0, anomaly_score + spread)
        return low, high

    def _top_features(self, fv: FeatureVector) -> List[str]:
        ranked = sorted(
            fv.features.items(),
            key=lambda item: abs(float(item[1])),
            reverse=True,
        )
        return [name for name, _ in ranked[:5]]

    def _explanation_factors(
        self,
        fv: FeatureVector,
        anomaly_score: float,
        failure_probability: float,
    ) -> List[str]:
        factors: List[str] = []

        for key, value in fv.context.items():
            if key.endswith("_above_threshold") and value is True:
                factors.append(key.replace("_above_threshold", "") + " above threshold")

        if fv.context.get("extended_duration", False):
            factors.append("extended fault duration")

        if anomaly_score >= 0.7:
            factors.append("high anomaly concentration")

        if failure_probability >= 0.6:
            factors.append("elevated failure probability")

        return factors[:6]
