#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import statistics
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List


class ThresholdOnlyBaseline:
    VIBRATION_THRESHOLD = 8.0
    TEMPERATURE_THRESHOLD = 85.0
    CURRENT_THRESHOLD = 20.0

    def evaluate(self, event: Dict[str, Any]) -> Dict[str, Any]:
        raw = event.get("raw_values", {})
        reasons: List[str] = []
        severity = "low"
        recommendation = "Monitor only"
        requires_action = False

        if raw.get("vibration_rms", 0.0) > self.VIBRATION_THRESHOLD:
            reasons.append("vibration_rms above threshold")
            severity = "high"
            recommendation = "Inspect machine"
            requires_action = True

        if raw.get("temperature_c", 0.0) > self.TEMPERATURE_THRESHOLD:
            reasons.append("temperature_c above threshold")
            severity = "high" if severity != "high" else severity
            recommendation = "Inspect cooling path"
            requires_action = True

        if raw.get("current_amps", 0.0) > self.CURRENT_THRESHOLD:
            reasons.append("current_amps above threshold")
            severity = "medium" if severity == "low" else severity
            recommendation = "Review electrical load"
            requires_action = True

        if event.get("event_type") == "stoppage":
            reasons.append("stoppage event")
            severity = "critical"
            recommendation = "Immediate operator response"
            requires_action = True

        return {
            "case_id": f"threshold_{event['event_id']}",
            "severity": severity,
            "recommendation": recommendation,
            "requires_action": requires_action,
            "rationale_count": len(reasons),
            "reasons": reasons,
            "priority_score": 1.0 if severity == "critical" else 0.7 if severity == "high" else 0.5 if severity == "medium" else 0.2,
            "has_audit": False,
            "has_replay": False,
            "deterministic": True,
        }


class ModelOnlyBaseline:
    def _anomaly_score(self, event: Dict[str, Any]) -> float:
        raw = event.get("raw_values", {})
        score = 0.0
        score += min(raw.get("vibration_rms", 0.0) / 15.0, 1.0) * 0.35
        score += min(raw.get("temperature_c", 0.0) / 100.0, 1.0) * 0.30
        score += min(raw.get("current_amps", 0.0) / 25.0, 1.0) * 0.20
        if event.get("event_type") == "stoppage":
            score += 0.25
        return min(score, 1.0)

    def evaluate(self, event: Dict[str, Any]) -> Dict[str, Any]:
        score = self._anomaly_score(event)
        if score >= 0.80:
            severity = "critical"
            recommendation = "Immediate inspection required"
            requires_action = True
        elif score >= 0.60:
            severity = "high"
            recommendation = "Inspect soon"
            requires_action = True
        elif score >= 0.40:
            severity = "medium"
            recommendation = "Review signal"
            requires_action = True
        else:
            severity = "low"
            recommendation = "Monitor only"
            requires_action = False

        reasons = [f"anomaly_score={score:.4f}"]
        return {
            "case_id": f"model_{event['event_id']}",
            "severity": severity,
            "recommendation": recommendation,
            "requires_action": requires_action,
            "rationale_count": len(reasons),
            "reasons": reasons,
            "priority_score": round(score, 4),
            "has_audit": False,
            "has_replay": False,
            "deterministic": True,
        }


def load_astraea_results(results_dir: Path) -> List[Dict[str, Any]]:
    files = sorted(results_dir.glob("case_*.json"))
    if not files:
        raise FileNotFoundError(f"No Astraea case files found in {results_dir}")
    return [json.loads(path.read_text()) for path in files]


def extract_events(astraea_cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [case["event"] for case in astraea_cases]


def summarize_outputs(name: str, outputs: List[Dict[str, Any]]) -> Dict[str, Any]:
    num = len(outputs)
    return {
        "system": name,
        "num_cases": num,
        "severity_distribution": dict(Counter(o["severity"] for o in outputs)),
        "action_rate": sum(1 for o in outputs if o["requires_action"]) / num,
        "mean_priority_score": statistics.mean(float(o["priority_score"]) for o in outputs),
        "mean_rationale_count": statistics.mean(int(o["rationale_count"]) for o in outputs),
        "complete_audit_rate": sum(1 for o in outputs if o["has_audit"]) / num,
        "replayable_rate": sum(1 for o in outputs if o["has_replay"]) / num,
        "deterministic_rate": sum(1 for o in outputs if o["deterministic"]) / num,
    }


def astraea_projection(astraea_cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    projected: List[Dict[str, Any]] = []
    for case in astraea_cases:
        projected.append(
            {
                "case_id": case["case_id"],
                "severity": case["prioritized_case"]["severity"],
                "recommendation": case["decision"]["recommendation"],
                "requires_action": case["prioritized_case"]["requires_action"],
                "rationale_count": len(case["prioritized_case"].get("rationale", [])),
                "reasons": case["prioritized_case"].get("rationale", []),
                "priority_score": float(case["prioritized_case"]["priority_score"]),
                "has_audit": True,
                "has_replay": True,
                "deterministic": True,
            }
        )
    return projected


def main() -> None:
    parser = argparse.ArgumentParser(description="Compare Astraea against threshold-only and model-only baselines")
    parser.add_argument(
        "--results-dir",
        default="artifacts/results",
        help="Directory containing Astraea case JSON files",
    )
    parser.add_argument(
        "--output",
        default="artifacts/evaluation/baseline_comparison_report.json",
        help="Path to write comparison report",
    )
    args = parser.parse_args()

    astraea_cases = load_astraea_results(Path(args.results_dir))
    events = extract_events(astraea_cases)

    threshold_system = ThresholdOnlyBaseline()
    model_system = ModelOnlyBaseline()

    threshold_outputs = [threshold_system.evaluate(event) for event in events]
    model_outputs = [model_system.evaluate(event) for event in events]
    astraea_outputs = astraea_projection(astraea_cases)

    report = {
        "summary": {
            "threshold_only": summarize_outputs("threshold_only", threshold_outputs),
            "model_only": summarize_outputs("model_only", model_outputs),
            "astraea": summarize_outputs("astraea", astraea_outputs),
        },
        "cases": {
            "threshold_only": threshold_outputs,
            "model_only": model_outputs,
            "astraea": astraea_outputs,
        },
        "interpretation_template": {
            "expected_strengths": {
                "threshold_only": ["simple", "deterministic", "easy to explain"],
                "model_only": ["flexible scoring", "compact logic"],
                "astraea": ["deterministic", "auditable", "replayable", "higher actionability"],
            },
            "expected_weaknesses": {
                "threshold_only": ["brittle", "limited context", "no audit bundle"],
                "model_only": ["thin explanations", "no replay", "score-only behavior"],
                "astraea": ["more complex implementation", "requires structured pipeline maintenance"],
            },
        },
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2))

    print(json.dumps(report, indent=2))
    print(f"\nSaved comparison report to {output_path}")


if __name__ == "__main__":
    main()
