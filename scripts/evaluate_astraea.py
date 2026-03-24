#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import statistics
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List


def load_case_files(results_dir: Path) -> List[Dict[str, Any]]:
    files = sorted(results_dir.glob("case_*.json"))
    if not files:
        raise FileNotFoundError(f"No case_*.json files found in {results_dir}")
    return [json.loads(path.read_text()) for path in files]


def summarize_cases(cases: List[Dict[str, Any]]) -> Dict[str, Any]:
    hashes = [case["audit"]["deterministic_hash"] for case in cases]
    decisions = [case["decision"]["recommendation"] for case in cases]
    severities = [case["prioritized_case"]["severity"] for case in cases]
    routing_buckets = [case["prioritized_case"]["routing_bucket"] for case in cases]
    priority_scores = [float(case["prioritized_case"]["priority_score"]) for case in cases]
    rationale_counts = [len(case["prioritized_case"].get("rationale", [])) for case in cases]
    explanation_factor_counts = [len(case["assessment"].get("explanation_factors", [])) for case in cases]

    complete_audit_count = 0
    for case in cases:
        audit = case.get("audit", {})
        needed = {
            "event_snapshot",
            "feature_snapshot",
            "model_snapshot",
            "prioritization_snapshot",
            "decision_snapshot",
            "execution_snapshot",
            "deterministic_hash",
        }
        if needed.issubset(audit.keys()):
            complete_audit_count += 1

    return {
        "num_cases": len(cases),
        "hashes": hashes,
        "decision_distribution": dict(Counter(decisions)),
        "severity_distribution": dict(Counter(severities)),
        "routing_distribution": dict(Counter(routing_buckets)),
        "priority_scores": priority_scores,
        "rationale_counts": rationale_counts,
        "explanation_factor_counts": explanation_factor_counts,
        "complete_audit_count": complete_audit_count,
    }


def compare_runs(run_dirs: List[Path]) -> Dict[str, Any]:
    run_payloads: List[Dict[str, Dict[str, Any]]] = []
    for run_dir in run_dirs:
        cases = load_case_files(run_dir)
        run_payloads.append({case["case_id"]: case for case in cases})

    common_case_ids = set.intersection(*(set(payload.keys()) for payload in run_payloads))
    if not common_case_ids:
        raise ValueError("No overlapping case IDs across runs")

    total_hash_checks = 0
    matching_hash_checks = 0
    total_decision_checks = 0
    matching_decision_checks = 0
    per_case_priority_variance: Dict[str, float] = {}

    for case_id in sorted(common_case_ids):
        hashes = []
        decisions = []
        priorities = []
        for payload in run_payloads:
            case = payload[case_id]
            hashes.append(case["audit"]["deterministic_hash"])
            decisions.append(case["decision"]["recommendation"])
            priorities.append(float(case["prioritized_case"]["priority_score"]))

        total_hash_checks += len(hashes) - 1
        matching_hash_checks += sum(1 for h in hashes[1:] if h == hashes[0])

        total_decision_checks += len(decisions) - 1
        matching_decision_checks += sum(1 for d in decisions[1:] if d == decisions[0])

        per_case_priority_variance[case_id] = statistics.pvariance(priorities) if len(priorities) > 1 else 0.0

    hash_consistency_rate = matching_hash_checks / total_hash_checks if total_hash_checks else 1.0
    decision_consistency_rate = matching_decision_checks / total_decision_checks if total_decision_checks else 1.0

    return {
        "num_runs": len(run_dirs),
        "common_case_count": len(common_case_ids),
        "hash_consistency_rate": hash_consistency_rate,
        "decision_consistency_rate": decision_consistency_rate,
        "mean_priority_variance": statistics.mean(per_case_priority_variance.values()),
        "max_priority_variance": max(per_case_priority_variance.values()),
        "per_case_priority_variance": per_case_priority_variance,
    }


def build_report(single_run_summary: Dict[str, Any], cross_run_summary: Dict[str, Any] | None) -> Dict[str, Any]:
    rationale_counts = single_run_summary["rationale_counts"]
    explanation_factor_counts = single_run_summary["explanation_factor_counts"]
    num_cases = single_run_summary["num_cases"]

    report = {
        "single_run": {
            "num_cases": num_cases,
            "decision_distribution": single_run_summary["decision_distribution"],
            "severity_distribution": single_run_summary["severity_distribution"],
            "routing_distribution": single_run_summary["routing_distribution"],
            "mean_priority_score": statistics.mean(single_run_summary["priority_scores"]),
            "mean_rationale_count": statistics.mean(rationale_counts),
            "mean_explanation_factor_count": statistics.mean(explanation_factor_counts),
            "cases_with_at_least_2_reasons_rate": sum(1 for x in rationale_counts if x >= 2) / num_cases,
            "cases_with_at_least_2_explanation_factors_rate": sum(1 for x in explanation_factor_counts if x >= 2) / num_cases,
            "complete_audit_rate": single_run_summary["complete_audit_count"] / num_cases,
        }
    }
    if cross_run_summary is not None:
        report["cross_run"] = cross_run_summary
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate Astraea result bundles")
    parser.add_argument(
        "--results-dir",
        default="artifacts/results",
        help="Directory containing the primary run case JSON files",
    )
    parser.add_argument(
        "--compare-dirs",
        nargs="*",
        default=[],
        help="Optional additional results directories from repeated runs for determinism comparison",
    )
    parser.add_argument(
        "--output",
        default="artifacts/evaluation/astraea_evaluation_report.json",
        help="Path to write JSON report",
    )
    args = parser.parse_args()

    results_dir = Path(args.results_dir)
    primary_cases = load_case_files(results_dir)
    single_run_summary = summarize_cases(primary_cases)

    cross_run_summary = None
    if args.compare_dirs:
        all_dirs = [results_dir] + [Path(p) for p in args.compare_dirs]
        cross_run_summary = compare_runs(all_dirs)

    report = build_report(single_run_summary, cross_run_summary)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2))

    print(json.dumps(report, indent=2))
    print(f"\nSaved report to {output_path}")


if __name__ == "__main__":
    main()
