from datetime import datetime
from typing import Dict, Any

from backend.shared.schemas import Event, FeatureVector


class FeatureEngine:
    THRESHOLDS = {
        "vibration_rms": 8.0,
        "temperature_c": 85.0,
        "current_amps": 20.0,
    }

    def extract(self, event: Event) -> FeatureVector:
        features: Dict[str, float] = {}
        context: Dict[str, Any] = {}

        for key, value in event.raw_values.items():
            features[f"raw_{key}"] = value

            if key in self.THRESHOLDS:
                threshold = self.THRESHOLDS[key]
                features[f"delta_{key}"] = value - threshold
                features[f"ratio_{key}"] = value / threshold if threshold else 0.0
                context[f"{key}_above_threshold"] = value > threshold

        context["event_type"] = event.event_type
        context["machine_id"] = event.machine_id
        context["line_id"] = event.line_id

        return FeatureVector(
            event_id=event.event_id,
            machine_id=event.machine_id,
            timestamp=event.timestamp,
            features=features,
            context=context,
        )
