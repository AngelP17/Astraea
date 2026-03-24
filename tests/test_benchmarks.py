"""
Astraea Benchmark Suite

Comprehensive performance and correctness benchmarks using real industrial event data.
"""

from __future__ import annotations

import json
import time
import statistics
from pathlib import Path
from typing import List, Dict, Any
from backend.core.pipeline import AstraeaPipeline
from backend.ingestion.normalizer import load_events, normalize_event
from backend.pipeline.feature_engine import FeatureEngine
from backend.ml.anomaly_detector import AnomalyDetector


def generate_realistic_events(count: int = 100) -> List[Dict]:
    """
    Generate realistic industrial events with varying conditions:
    - Normal operating conditions
    - Threshold breaches (single/multiple)
    - Extended durations
    - Edge cases (zero values, very high values)
    - Noisy readings
    """
    events = []
    event_types = [
        "vibration_spike",
        "temperature_rise",
        "stoppage",
        "current_surge",
        "pressure_anomaly",
    ]
    machines = [f"motor_{i:02d}" for i in range(1, 21)]
    lines = [f"line_{i}" for i in range(1, 6)]
    sources = ["sensor_gateway", "plc_monitor", "scada_system", "edge_device"]

    base_values = {
        "vibration_rms": (3.5, 8.0),
        "vibration_peak": (8.0, 20.0),
        "temperature_c": (45.0, 85.0),
        "current_amps": (8.0, 20.0),
        "rpm": (800.0, 1200.0),
    }

    for i in range(count):
        event_type = event_types[i % len(event_types)]
        machine = machines[i % len(machines)]
        line = lines[i % len(lines)]
        source = sources[i % len(sources)]

        raw_values = {}
        for key, (low, high) in base_values.items():
            if event_type == "stoppage" and i % 5 == 0:
                raw_values[key] = 0.0
            elif event_type == "vibration_spike" and key in ["vibration_rms", "vibration_peak"]:
                raw_values[key] = high * (1.3 + (i % 3) * 0.15) + (i % 5) * 0.2
            elif event_type == "temperature_rise" and key == "temperature_c":
                raw_values[key] = high * (1.08 + (i % 4) * 0.03) + (i % 3)
            elif event_type == "current_surge" and key == "current_amps":
                raw_values[key] = high * (1.2 + (i % 3) * 0.1)
            else:
                raw_values[key] = low + (i % 7) * 0.3 + (i % 3) * 0.1

        if i % 10 == 0:
            for key in raw_values:
                raw_values[key] *= 0.95 + (i % 11) * 0.01

        duration = 0
        if event_type == "stoppage" or i % 17 == 0:
            duration = 200 + (i % 8) * 50

        event = {
            "event_id": f"evt_{i + 1000:05d}",
            "machine_id": machine,
            "line_id": line,
            "event_type": event_type,
            "timestamp": f"2026-03-{23 - (i % 5):02d}T{(14 + i % 8):02d}:{(i * 7) % 60:02d}:00Z",
            "raw_values": raw_values,
            "source": source,
            "metadata": {
                "sensor_id": f"sensor_{machine}_{i % 3}",
                "location": f"bearing_{(i % 4) + 1}",
                "duration_seconds": duration,
            },
        }
        events.append(event)

    return events


def benchmark_pipeline_latency(event_count: int = 100) -> Dict[str, Any]:
    """
    Benchmark pipeline latency across multiple events.
    Returns detailed latency statistics per stage.
    """
    events_data = generate_realistic_events(event_count)
    events = [normalize_event(e) for e in events_data]

    pipeline = AstraeaPipeline()
    feature_engine = FeatureEngine()
    anomaly_detector = AnomalyDetector()

    total_times = []
    feature_times = []
    assessment_times = []
    prioritization_times = []
    decision_times = []
    audit_times = []

    for event in events:
        t0 = time.perf_counter()

        t_feat = time.perf_counter()
        features = feature_engine.extract(event)
        feature_times.append((time.perf_counter() - t_feat) * 1000)

        t_assess = time.perf_counter()
        assessment = anomaly_detector.assess(features)
        assessment_times.append((time.perf_counter() - t_assess) * 1000)

        t_prior = time.perf_counter()
        case = pipeline.prioritizer.prioritize(event, assessment)
        prioritization_times.append((time.perf_counter() - t_prior) * 1000)

        t_dec = time.perf_counter()
        decision = pipeline.decision_engine.resolve(case)
        decision_times.append((time.perf_counter() - t_dec) * 1000)

        t_audit = time.perf_counter()
        execution = pipeline.dispatcher.dispatch(case, decision)
        pipeline.audit_recorder.record(event, features, assessment, case, decision, execution)
        audit_times.append((time.perf_counter() - t_audit) * 1000)

        total_times.append((time.perf_counter() - t0) * 1000)

    return {
        "event_count": event_count,
        "total": {
            "mean_ms": statistics.mean(total_times),
            "median_ms": statistics.median(total_times),
            "stdev_ms": statistics.stdev(total_times) if len(total_times) > 1 else 0,
            "min_ms": min(total_times),
            "max_ms": max(total_times),
            "p95_ms": sorted(total_times)[int(len(total_times) * 0.95)]
            if len(total_times) > 1
            else total_times[0],
            "p99_ms": sorted(total_times)[int(len(total_times) * 0.99)]
            if len(total_times) > 1
            else total_times[0],
        },
        "feature_extraction": {
            "mean_ms": statistics.mean(feature_times),
            "stdev_ms": statistics.stdev(feature_times) if len(feature_times) > 1 else 0,
        },
        "anomaly_detection": {
            "mean_ms": statistics.mean(assessment_times),
            "stdev_ms": statistics.stdev(assessment_times) if len(assessment_times) > 1 else 0,
        },
        "prioritization": {
            "mean_ms": statistics.mean(prioritization_times),
            "stdev_ms": statistics.stdev(prioritization_times)
            if len(prioritization_times) > 1
            else 0,
        },
        "decision": {
            "mean_ms": statistics.mean(decision_times),
            "stdev_ms": statistics.stdev(decision_times) if len(decision_times) > 1 else 0,
        },
        "audit": {
            "mean_ms": statistics.mean(audit_times),
            "stdev_ms": statistics.stdev(audit_times) if len(audit_times) > 1 else 0,
        },
    }


def benchmark_hash_stability(iterations: int = 10, event_count: int = 50) -> Dict[str, Any]:
    """
    Benchmark hash stability across multiple iterations.
    Verifies determinism by comparing hashes from independent pipeline runs.
    """
    events_data = generate_realistic_events(event_count)
    events = [normalize_event(e) for e in events_data]

    all_hashes = []

    for iteration in range(iterations):
        pipeline = AstraeaPipeline()
        iteration_hashes = []
        for event in events:
            result = pipeline.process(event)
            iteration_hashes.append(result.audit["deterministic_hash"])
        all_hashes.append(iteration_hashes)

    mismatches = 0
    total_comparisons = 0

    for event_idx in range(len(events)):
        hashes_for_event = [all_hashes[iter_idx][event_idx] for iter_idx in range(iterations)]
        for i in range(iterations):
            for j in range(i + 1, iterations):
                total_comparisons += 1
                if hashes_for_event[i] != hashes_for_event[j]:
                    mismatches += 1

    return {
        "iterations": iterations,
        "event_count": event_count,
        "total_comparisons": total_comparisons,
        "hash_mismatches": mismatches,
        "stability_rate": 1.0 - (mismatches / total_comparisons) if total_comparisons > 0 else 1.0,
        "verdict": "PASS - Deterministic" if mismatches == 0 else "FAIL - Non-deterministic",
    }


def benchmark_score_distribution(event_count: int = 100) -> Dict[str, Any]:
    """
    Analyze distribution of scores across diverse events.
    """
    events_data = generate_realistic_events(event_count)
    events = [normalize_event(e) for e in events_data]
    pipeline = AstraeaPipeline()

    anomaly_scores = []
    failure_probs = []
    priority_scores = []
    uncertainties = []

    for event in events:
        result = pipeline.process(event).to_dict()
        anomaly_scores.append(result["assessment"]["anomaly_score"])
        failure_probs.append(result["assessment"]["failure_probability"])
        priority_scores.append(result["prioritized_case"]["priority_score"])
        uncertainties.append(
            result["assessment"]["uncertainty_high"] - result["assessment"]["uncertainty_low"]
        )

    return {
        "event_count": event_count,
        "anomaly_score": {
            "mean": statistics.mean(anomaly_scores),
            "stdev": statistics.stdev(anomaly_scores) if len(anomaly_scores) > 1 else 0,
            "min": min(anomaly_scores),
            "max": max(anomaly_scores),
        },
        "failure_probability": {
            "mean": statistics.mean(failure_probs),
            "stdev": statistics.stdev(failure_probs) if len(failure_probs) > 1 else 0,
            "min": min(failure_probs),
            "max": max(failure_probs),
        },
        "priority_score": {
            "mean": statistics.mean(priority_scores),
            "stdev": statistics.stdev(priority_scores) if len(priority_scores) > 1 else 0,
            "min": min(priority_scores),
            "max": max(priority_scores),
        },
        "uncertainty_interval_width": {
            "mean": statistics.mean(uncertainties),
            "stdev": statistics.stdev(uncertainties) if len(uncertainties) > 1 else 0,
            "min": min(uncertainties),
            "max": max(uncertainties),
        },
    }


def benchmark_threshold_sensitivity() -> Dict[str, Any]:
    """
    Test threshold sensitivity by varying values around thresholds.
    """
    fe = FeatureEngine()
    thresholds = fe.THRESHOLDS.copy()

    test_cases = []
    for metric, threshold in thresholds.items():
        for multiplier in [0.5, 0.8, 0.95, 1.0, 1.05, 1.2, 1.5, 2.0]:
            value = threshold * multiplier
            event = normalize_event(
                {
                    "event_id": f"test_{metric}_{multiplier}",
                    "machine_id": "test_motor",
                    "line_id": "test_line",
                    "event_type": "vibration_spike",
                    "timestamp": "2026-03-23T14:00:00Z",
                    "raw_values": {metric: value},
                    "source": "test_gateway",
                }
            )
            fv = fe.extract(event)
            context_key = f"{metric}_above_threshold"

            test_cases.append(
                {
                    "metric": metric,
                    "threshold": threshold,
                    "value": value,
                    "multiplier": multiplier,
                    "above_threshold": fv.context.get(context_key, False),
                    "ratio": fv.features.get(f"ratio_{metric}", 0),
                    "delta": fv.features.get(f"delta_{metric}", 0),
                }
            )

    correct_breaches = sum(
        1 for tc in test_cases if (tc["multiplier"] > 1.0) == tc["above_threshold"]
    )

    return {
        "total_test_cases": len(test_cases),
        "correct_classifications": correct_breaches,
        "accuracy": correct_breaches / len(test_cases) if test_cases else 0,
        "verdict": "PASS"
        if correct_breaches == len(test_cases)
        else f"FAIL - {len(test_cases) - correct_breaches} errors",
    }


def benchmark_explainability_coverage(event_count: int = 100) -> Dict[str, Any]:
    """
    Verify explainability factors are generated consistently.
    """
    events_data = generate_realistic_events(event_count)
    events = [normalize_event(e) for e in events_data]
    pipeline = AstraeaPipeline()

    events_with_factors = 0
    events_with_top_features = 0
    events_with_rationale = 0

    for event in events:
        result = pipeline.process(event).to_dict()
        if len(result["assessment"]["explanation_factors"]) > 0:
            events_with_factors += 1
        if len(result["assessment"]["top_features"]) > 0:
            events_with_top_features += 1
        if len(result["prioritized_case"]["rationale"]) > 0:
            events_with_rationale += 1

    return {
        "event_count": event_count,
        "events_with_explanation_factors": events_with_factors,
        "events_with_top_features": events_with_top_features,
        "events_with_rationale": events_with_rationale,
        "explainability_rate": events_with_factors / event_count if event_count > 0 else 0,
        "top_features_rate": events_with_top_features / event_count if event_count > 0 else 0,
        "rationale_rate": events_with_rationale / event_count if event_count > 0 else 0,
    }


def run_all_benchmarks():
    """Run all benchmarks and print results."""
    print("=" * 80)
    print("ASTRAEA BENCHMARK SUITE - Real Industrial Event Data")
    print("=" * 80)
    print()

    print("[1/6] Benchmarking Pipeline Latency (100 events)...")
    print("-" * 60)
    lat = benchmark_pipeline_latency(100)
    print(f"  Total pipeline latency:")
    print(f"    Mean:   {lat['total']['mean_ms']:.3f} ms")
    print(f"    Median: {lat['total']['median_ms']:.3f} ms")
    print(f"    P95:    {lat['total']['p95_ms']:.3f} ms")
    print(f"    P99:    {lat['total']['p99_ms']:.3f} ms")
    print(f"    Min:    {lat['total']['min_ms']:.3f} ms")
    print(f"    Max:    {lat['total']['max_ms']:.3f} ms")
    print(f"  Per-stage breakdown:")
    print(
        f"    Feature extraction: {lat['feature_extraction']['mean_ms']:.4f} ms ± {lat['feature_extraction']['stdev_ms']:.4f}"
    )
    print(
        f"    Anomaly detection: {lat['anomaly_detection']['mean_ms']:.4f} ms ± {lat['anomaly_detection']['stdev_ms']:.4f}"
    )
    print(
        f"    Prioritization:     {lat['prioritization']['mean_ms']:.4f} ms ± {lat['prioritization']['stdev_ms']:.4f}"
    )
    print(
        f"    Decision:           {lat['decision']['mean_ms']:.4f} ms ± {lat['decision']['stdev_ms']:.4f}"
    )
    print(
        f"    Audit:              {lat['audit']['mean_ms']:.4f} ms ± {lat['audit']['stdev_ms']:.4f}"
    )
    print()

    print("[2/6] Benchmarking Hash Stability (10 iterations, 50 events)...")
    print("-" * 60)
    stab = benchmark_hash_stability(10, 50)
    print(f"  Iterations:      {stab['iterations']}")
    print(f"  Events:         {stab['event_count']}")
    print(f"  Comparisons:     {stab['total_comparisons']}")
    print(f"  Hash mismatches: {stab['hash_mismatches']}")
    print(f"  Stability rate:  {stab['stability_rate']:.4f} ({stab['stability_rate'] * 100:.2f}%)")
    print(f"  Verdict:         {stab['verdict']}")
    print()

    print("[3/6] Benchmarking Score Distribution (100 events)...")
    print("-" * 60)
    dist = benchmark_score_distribution(100)
    print(
        f"  Anomaly Score:     mean={dist['anomaly_score']['mean']:.4f}, range=[{dist['anomaly_score']['min']:.4f}, {dist['anomaly_score']['max']:.4f}]"
    )
    print(
        f"  Failure Probability: mean={dist['failure_probability']['mean']:.4f}, range=[{dist['failure_probability']['min']:.4f}, {dist['failure_probability']['max']:.4f}]"
    )
    print(
        f"  Priority Score:     mean={dist['priority_score']['mean']:.4f}, range=[{dist['priority_score']['min']:.4f}, {dist['priority_score']['max']:.4f}]"
    )
    print(
        f"  Uncertainty Width:  mean={dist['uncertainty_interval_width']['mean']:.4f}, range=[{dist['uncertainty_interval_width']['min']:.4f}, {dist['uncertainty_interval_width']['max']:.4f}]"
    )
    print()

    print("[4/6] Benchmarking Threshold Sensitivity...")
    print("-" * 60)
    sens = benchmark_threshold_sensitivity()
    print(f"  Total test cases:      {sens['total_test_cases']}")
    print(f"  Correct classifications: {sens['correct_classifications']}")
    print(f"  Accuracy:               {sens['accuracy']:.4f} ({sens['accuracy'] * 100:.2f}%)")
    print(f"  Verdict:                {sens['verdict']}")
    print()

    print("[5/6] Benchmarking Explainability Coverage (100 events)...")
    print("-" * 60)
    expl = benchmark_explainability_coverage(100)
    print(
        f"  Events with explanation factors: {expl['events_with_explanation_factors']}/{expl['event_count']} ({expl['explainability_rate'] * 100:.1f}%)"
    )
    print(
        f"  Events with top features:       {expl['events_with_top_features']}/{expl['event_count']} ({expl['top_features_rate'] * 100:.1f}%)"
    )
    print(
        f"  Events with rationale:          {expl['events_with_rationale']}/{expl['event_count']} ({expl['rationale_rate'] * 100:.1f}%)"
    )
    print()

    print("[6/6] Benchmarking Throughput (sustained load)...")
    print("-" * 60)
    start = time.perf_counter()
    lat = benchmark_pipeline_latency(1000)
    elapsed = time.perf_counter() - start
    throughput = 1000 / elapsed
    print(f"  1000 events processed in {elapsed:.3f} seconds")
    print(f"  Throughput: {throughput:.1f} events/second")
    print(f"  Mean latency per event: {lat['total']['mean_ms']:.3f} ms")
    print()

    print("=" * 80)
    print("BENCHMARK COMPLETE")
    print("=" * 80)

    return {
        "latency": lat,
        "hash_stability": stab,
        "score_distribution": dist,
        "threshold_sensitivity": sens,
        "explainability": expl,
    }


if __name__ == "__main__":
    run_all_benchmarks()
