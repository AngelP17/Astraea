from __future__ import annotations

from typing import Any, Dict

from backend.shared.schemas import Event, FeatureVector


class FeatureEngine:
    THRESHOLDS = {
        "vibration_rms": 8.0,
        "vibration_peak": 20.0,
        "temperature_c": 85.0,
        "current_amps": 20.0,
        "rpm": 1200.0,
    }

    EVENT_BASELINES = {
        "vibration_spike": 0.90,
        "temperature_rise": 0.75,
        "stoppage": 0.95,
        "current_surge": 0.70,
        "pressure_anomaly": 0.80,
    }

    def extract(self, event: Event) -> FeatureVector:
        features: Dict[str, float] = {}
        context: Dict[str, Any] = {}

        for key, value in event.raw_values.items():
            features[f"raw_{key}"] = value
            threshold = self.THRESHOLDS.get(key)
            if threshold is not None:
                delta = value - threshold
                ratio = value / threshold if threshold else 0.0
                features[f"delta_{key}"] = round(delta, 6)
                features[f"ratio_{key}"] = round(ratio, 6)
                context[f"{key}_above_threshold"] = value > threshold

        ratio_keys = [k for k in features if k.startswith("ratio_")]
        delta_keys = [k for k in features if k.startswith("delta_")]

        if ratio_keys:
            ratio_values = [features[k] for k in ratio_keys]
            features["ratio_max"] = max(ratio_values)
            features["ratio_mean"] = sum(ratio_values) / len(ratio_values)
        else:
            features["ratio_max"] = 0.0
            features["ratio_mean"] = 0.0

        if delta_keys:
            delta_values = [features[k] for k in delta_keys]
            features["delta_max"] = max(delta_values)
            features["delta_mean"] = sum(delta_values) / len(delta_values)
        else:
            features["delta_max"] = 0.0
            features["delta_mean"] = 0.0

        duration_seconds = float(event.metadata.get("duration_seconds", 0.0))
        features["duration_seconds"] = duration_seconds

        context["event_type"] = event.event_type
        context["machine_id"] = event.machine_id
        context["line_id"] = event.line_id
        context["source"] = event.source
        context["baseline_severity"] = self.EVENT_BASELINES.get(event.event_type, 0.4)

        if duration_seconds > 0:
            context["extended_duration"] = duration_seconds > 300
        else:
            context["extended_duration"] = False

        return FeatureVector(
            event_id=event.event_id,
            machine_id=event.machine_id,
            timestamp=event.timestamp,
            features=features,
            context=context,
        )
