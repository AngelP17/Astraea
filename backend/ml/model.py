from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from backend.pipeline.feature_engine import FeatureEngine
from backend.shared.schemas import Event, FeatureVector

MODEL_VERSION = "astraea_logreg_v1"
MODEL_PATH = Path("artifacts/model/astraea_logreg_v1.json")

FEATURE_NAMES = [
    "bias",
    "ratio_max",
    "ratio_mean",
    "delta_max_scaled",
    "duration_scaled",
    "vibration_ratio",
    "temperature_ratio",
    "current_ratio",
    "rpm_low",
    "baseline_severity",
    "event_stoppage",
    "event_vibration_spike",
    "event_temperature_rise",
    "event_current_surge",
    "event_pressure_anomaly",
]


@dataclass(frozen=True)
class FrozenLogisticModel:
    version: str
    feature_names: list[str]
    weights: list[float]
    threshold: float
    training: dict[str, Any]

    def predict_proba(self, fv: FeatureVector) -> float:
        vector = vectorize_features(fv)
        z = sum(
            weight * vector[name]
            for name, weight in zip(self.feature_names, self.weights, strict=True)
        )
        return 1.0 / (1.0 + math.exp(-max(min(z, 35.0), -35.0)))

    def top_contributors(self, fv: FeatureVector, limit: int = 5) -> list[str]:
        vector = vectorize_features(fv)
        contributions = [
            (name, abs(weight * vector[name]))
            for name, weight in zip(self.feature_names, self.weights, strict=True)
            if name != "bias"
        ]
        contributions.sort(key=lambda item: item[1], reverse=True)
        return [name for name, _ in contributions[:limit]]

    def to_dict(self) -> dict[str, Any]:
        return {
            "version": self.version,
            "feature_names": self.feature_names,
            "weights": self.weights,
            "threshold": self.threshold,
            "training": self.training,
        }


def vectorize_features(fv: FeatureVector) -> dict[str, float]:
    features = fv.features
    context = fv.context
    event_type = str(context.get("event_type", ""))
    rpm_ratio = float(features.get("ratio_rpm", 1.0))

    return {
        "bias": 1.0,
        "ratio_max": min(float(features.get("ratio_max", 0.0)) / 2.0, 2.0),
        "ratio_mean": min(float(features.get("ratio_mean", 0.0)) / 2.0, 2.0),
        "delta_max_scaled": max(min(float(features.get("delta_max", 0.0)) / 50.0, 2.0), -2.0),
        "duration_scaled": min(float(features.get("duration_seconds", 0.0)) / 720.0, 2.0),
        "vibration_ratio": min(float(features.get("ratio_vibration_rms", 0.0)) / 2.0, 2.0),
        "temperature_ratio": min(float(features.get("ratio_temperature_c", 0.0)) / 2.0, 2.0),
        "current_ratio": min(float(features.get("ratio_current_amps", 0.0)) / 2.0, 2.0),
        "rpm_low": max(0.0, 1.0 - min(rpm_ratio, 1.0)),
        "baseline_severity": float(context.get("baseline_severity", 0.4)),
        "event_stoppage": 1.0 if event_type == "stoppage" else 0.0,
        "event_vibration_spike": 1.0 if event_type == "vibration_spike" else 0.0,
        "event_temperature_rise": 1.0 if event_type == "temperature_rise" else 0.0,
        "event_current_surge": 1.0 if event_type == "current_surge" else 0.0,
        "event_pressure_anomaly": 1.0 if event_type == "pressure_anomaly" else 0.0,
    }


def load_model(path: Path = MODEL_PATH) -> FrozenLogisticModel | None:
    if not path.exists():
        return None

    payload = json.loads(path.read_text())
    return FrozenLogisticModel(
        version=str(payload["version"]),
        feature_names=list(payload["feature_names"]),
        weights=[float(weight) for weight in payload["weights"]],
        threshold=float(payload["threshold"]),
        training=dict(payload.get("training", {})),
    )


def save_model(model: FrozenLogisticModel, path: Path = MODEL_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(model.to_dict(), indent=2, sort_keys=True))


def train_logistic_model(
    rows: list[dict[str, Any]],
    *,
    learning_rate: float = 0.42,
    epochs: int = 2400,
    l2: float = 0.002,
) -> FrozenLogisticModel:
    feature_engine = FeatureEngine()
    examples: list[tuple[dict[str, float], float]] = []

    from backend.ingestion.normalizer import normalize_event

    for row in rows:
        event: Event = normalize_event(row)
        fv = feature_engine.extract(event)
        label = 1.0 if row["metadata"].get("ground_truth_failure", False) else 0.0
        examples.append((vectorize_features(fv), label))

    weights = [0.0 for _ in FEATURE_NAMES]

    for _ in range(epochs):
        gradients = [0.0 for _ in FEATURE_NAMES]
        for vector, label in examples:
            z = sum(
                weight * vector[name]
                for name, weight in zip(FEATURE_NAMES, weights, strict=True)
            )
            prediction = 1.0 / (1.0 + math.exp(-max(min(z, 35.0), -35.0)))
            error = prediction - label
            for index, name in enumerate(FEATURE_NAMES):
                gradients[index] += error * vector[name]

        scale = 1.0 / len(examples)
        for index, gradient in enumerate(gradients):
            regularization = 0.0 if FEATURE_NAMES[index] == "bias" else l2 * weights[index]
            weights[index] -= learning_rate * ((gradient * scale) + regularization)

    threshold = select_threshold(weights, examples)
    metrics = evaluate_weights(weights, threshold, examples)

    return FrozenLogisticModel(
        version=MODEL_VERSION,
        feature_names=FEATURE_NAMES,
        weights=[round(weight, 10) for weight in weights],
        threshold=round(threshold, 4),
        training={
            "algorithm": "logistic_regression_gradient_descent",
            "dataset": "generated_labeled_synthetic_v1",
            "examples": len(examples),
            "epochs": epochs,
            "learning_rate": learning_rate,
            "l2": l2,
            **metrics,
        },
    )


def select_threshold(
    weights: list[float],
    examples: list[tuple[dict[str, float], float]],
) -> float:
    scored = [
        (
            1.0
            / (
                1.0
                + math.exp(
                    -sum(
                        weight * vector[name]
                        for name, weight in zip(FEATURE_NAMES, weights, strict=True)
                    )
                )
            ),
            label,
        )
        for vector, label in examples
    ]
    best_threshold = 0.5
    best_f1 = -1.0
    for step in range(20, 81):
        threshold = step / 100
        predictions = [score >= threshold for score, _ in scored]
        labels = [bool(label) for _, label in scored]
        tp = sum(1 for pred, label in zip(predictions, labels, strict=True) if pred and label)
        fp = sum(1 for pred, label in zip(predictions, labels, strict=True) if pred and not label)
        fn = sum(1 for pred, label in zip(predictions, labels, strict=True) if not pred and label)
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = (2 * precision * recall / (precision + recall)) if precision + recall else 0.0
        if f1 > best_f1:
            best_f1 = f1
            best_threshold = threshold
    return best_threshold


def evaluate_weights(
    weights: list[float],
    threshold: float,
    examples: list[tuple[dict[str, float], float]],
) -> dict[str, float]:
    predictions = []
    labels = []
    for vector, label_float in examples:
        probability = 1.0 / (
            1.0
            + math.exp(
                -sum(
                    weight * vector[name]
                    for name, weight in zip(FEATURE_NAMES, weights, strict=True)
                )
            )
        )
        predictions.append(probability >= threshold)
        labels.append(bool(label_float))

    tp = sum(1 for pred, label in zip(predictions, labels, strict=True) if pred and label)
    fp = sum(1 for pred, label in zip(predictions, labels, strict=True) if pred and not label)
    tn = sum(1 for pred, label in zip(predictions, labels, strict=True) if not pred and not label)
    fn = sum(1 for pred, label in zip(predictions, labels, strict=True) if not pred and label)
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    accuracy = (tp + tn) / len(labels) if labels else 0.0
    false_escalation = fp / (fp + tn) if fp + tn else 0.0
    return {
        "training_precision": round(precision, 4),
        "training_recall": round(recall, 4),
        "training_accuracy": round(accuracy, 4),
        "training_false_escalation_rate": round(false_escalation, 4),
    }
