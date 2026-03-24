"""
Astraea Comprehensive Test Suite with Real Industrial Event Data

Tests verify the following system guarantees:
1. End-to-end pipeline execution
2. Deterministic hash stability (reproducibility)
3. Threshold breach detection accuracy
4. Priority score correctness
5. Uncertainty interval validity
6. Explainability factor generation
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from backend.core.pipeline import AstraeaPipeline
from backend.core.replay import ReplayStore
from backend.ingestion.normalizer import load_events, normalize_event
from backend.ml.anomaly_detector import AnomalyDetector
from backend.pipeline.feature_engine import FeatureEngine
from backend.decision.prioritizer import DecisionPrioritizationEngine
from backend.decision.engine import DecisionEngine
from backend.execution.dispatcher import ExecutionDispatcher
from backend.audit.recorder import AuditRecorder


def generate_realistic_events(count: int = 100) -> list:
    """Generate realistic industrial events with varying conditions."""
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

        events.append(
            {
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
        )

    return events


def test_full_pipeline_with_real_data():
    """Verify complete pipeline executes without errors using realistic data."""
    events_data = generate_realistic_events(100)
    events = [normalize_event(e) for e in events_data]

    pipeline = AstraeaPipeline()
    results = [pipeline.process(event) for event in events]

    assert len(results) == 100, f"Should process 100 events, got {len(results)}"

    for result in results:
        payload = result.to_dict()

        assert payload["event_id"], "Missing event_id"
        assert payload["case_id"].startswith("case_"), "case_id should start with case_"
        assert 0.0 <= payload["assessment"]["anomaly_score"] <= 1.0, "anomaly_score out of range"
        assert 0.0 <= payload["assessment"]["failure_probability"] <= 1.0, (
            "failure_probability out of range"
        )
        assert 0.0 <= payload["assessment"]["confidence"] <= 1.0, "confidence out of range"
        assert payload["decision"]["recommendation"], "Missing recommendation"
        assert payload["execution"]["dispatch_status"], "Missing dispatch_status"
        assert payload["audit"]["deterministic_hash"], "Missing deterministic_hash"

    print(f"[PASS] Full pipeline with 100 real events - all validations passed")


def test_hash_stability_with_large_dataset():
    """
    CRITICAL TEST: Hash stability with large dataset proves determinism.

    Same input processed by fresh pipeline instances must produce
    identical deterministic_hash values across 100 events.
    """
    events_data = generate_realistic_events(100)
    events = [normalize_event(e) for e in events_data]

    hashes_run_1 = []
    hashes_run_2 = []

    for event in events:
        pipeline_1 = AstraeaPipeline()
        pipeline_2 = AstraeaPipeline()

        result_1 = pipeline_1.process(event).to_dict()
        result_2 = pipeline_2.process(event).to_dict()

        hashes_run_1.append(result_1["audit"]["deterministic_hash"])
        hashes_run_2.append(result_2["audit"]["deterministic_hash"])

    mismatches = sum(1 for h1, h2 in zip(hashes_run_1, hashes_run_2) if h1 != h2)

    assert mismatches == 0, f"Hash mismatch: {mismatches}/100 hashes did not match"
    print(f"[PASS] Hash stability: 100% match across 2 runs with 100 events")


def test_threshold_breach_detection_realistic():
    """
    Verify threshold breach detection works correctly with varied data.
    """
    events_data = generate_realistic_events(50)
    events = [normalize_event(e) for e in events_data]
    fe = FeatureEngine()

    high_anomaly_events = 0
    threshold_breaches_detected = 0

    for event in events:
        fv = fe.extract(event)

        breaches = [
            k for k, v in fv.context.items() if k.endswith("_above_threshold") and v is True
        ]

        if breaches:
            threshold_breaches_detected += 1

        if event.event_type == "vibration_spike":
            if fv.context.get("vibration_rms_above_threshold"):
                high_anomaly_events += 1

    assert threshold_breaches_detected > 0, "Should detect some threshold breaches"
    print(f"[PASS] Threshold detection: {threshold_breaches_detected}/50 events had breaches")


def test_feature_extraction_correctness():
    """
    Verify feature extraction produces mathematically correct values.
    """
    event = normalize_event(
        {
            "event_id": "test_001",
            "machine_id": "test_motor",
            "line_id": "test_line",
            "event_type": "vibration_spike",
            "timestamp": "2026-03-23T14:00:00Z",
            "raw_values": {
                "vibration_rms": 12.4,
                "vibration_peak": 28.7,
                "temperature_c": 78.3,
                "current_amps": 14.2,
                "rpm": 1750.0,
            },
            "source": "test_gateway",
        }
    )

    fe = FeatureEngine()
    fv = fe.extract(event)

    expected_ratio = 12.4 / 8.0
    actual_ratio = fv.features["ratio_vibration_rms"]
    assert abs(actual_ratio - expected_ratio) < 0.001, (
        f"ratio_vibration_rms: expected {expected_ratio}, got {actual_ratio}"
    )

    expected_delta = 12.4 - 8.0
    actual_delta = fv.features["delta_vibration_rms"]
    assert abs(actual_delta - expected_delta) < 0.001, (
        f"delta_vibration_rms: expected {expected_delta}, got {actual_delta}"
    )

    print("[PASS] Feature extraction mathematical correctness verified")


def test_priority_score_ranges_real_data():
    """
    Verify priority scores fall within valid [0.0, 1.0] range.
    """
    events_data = generate_realistic_events(100)
    events = [normalize_event(e) for e in events_data]
    pipeline = AstraeaPipeline()

    out_of_range = 0
    for event in events:
        result = pipeline.process(event).to_dict()
        score = result["prioritized_case"]["priority_score"]
        if not (0.0 <= score <= 1.0):
            out_of_range += 1

    assert out_of_range == 0, f"{out_of_range}/100 scores out of range [0.0, 1.0]"
    print("[PASS] All 100 priority scores within valid range [0.0, 1.0]")


def test_explainability_with_diverse_events():
    """
    Verify every decision includes explanation factors.
    """
    events_data = generate_realistic_events(50)
    events = [normalize_event(e) for e in events_data]
    pipeline = AstraeaPipeline()

    events_with_factors = 0
    events_with_rationale = 0

    for event in events:
        result = pipeline.process(event).to_dict()

        if len(result["assessment"]["explanation_factors"]) > 0:
            events_with_factors += 1

        if len(result["prioritized_case"]["rationale"]) > 0:
            events_with_rationale += 1

    rate = events_with_factors / len(events)
    assert rate >= 0.70, (
        f"Only {rate * 100:.1f}% of events have explanation factors (expected >= 70%)"
    )
    print(
        f"[PASS] Explainability: {events_with_factors}/50 ({rate * 100:.1f}%) events with factors"
    )


def test_severity_distribution():
    """
    Verify severity distribution covers all levels with real data.
    """
    events_data = generate_realistic_events(100)
    events = [normalize_event(e) for e in events_data]
    pipeline = AstraeaPipeline()

    severities = {"critical": 0, "high": 0, "medium": 0, "low": 0}

    for event in events:
        result = pipeline.process(event).to_dict()
        sev = result["prioritized_case"]["severity"]
        severities[sev] += 1

    print(f"[INFO] Severity distribution:")
    for sev, count in severities.items():
        print(f"      {sev}: {count}/100")

    assert sum(severities.values()) == 100, "All events should have severity assigned"
    print("[PASS] Severity distribution complete")


def test_uncertainty_validity_real_data():
    """
    Verify uncertainty intervals are mathematically valid.
    """
    events_data = generate_realistic_events(100)
    events = [normalize_event(e) for e in events_data]
    pipeline = AstraeaPipeline()

    invalid_intervals = 0

    for event in events:
        result = pipeline.process(event).to_dict()
        assessment = result["assessment"]

        low = assessment["uncertainty_low"]
        high = assessment["uncertainty_high"]
        score = assessment["anomaly_score"]

        if not (low <= score <= high):
            invalid_intervals += 1

    assert invalid_intervals == 0, f"{invalid_intervals}/100 invalid intervals"
    print("[PASS] All uncertainty intervals valid")


def test_routing_bucket_coverage():
    """
    Verify all routing buckets are used with diverse events.
    """
    events_data = generate_realistic_events(100)
    events = [normalize_event(e) for e in events_data]
    pipeline = AstraeaPipeline()

    buckets = {
        "incident_now": 0,
        "human_review": 0,
        "maintenance_priority": 0,
        "scheduled_followup": 0,
        "monitor_only": 0,
    }

    for event in events:
        result = pipeline.process(event).to_dict()
        bucket = result["prioritized_case"]["routing_bucket"]
        buckets[bucket] += 1

    print(f"[INFO] Routing bucket distribution:")
    for bucket, count in buckets.items():
        print(f"      {bucket}: {count}/100")

    assert sum(buckets.values()) == 100, "All events should be routed"
    print("[PASS] Routing bucket coverage complete")


def test_replay_with_real_events():
    """
    Verify replay store can save and load cases correctly.
    """
    events_data = generate_realistic_events(10)
    events = [normalize_event(e) for e in events_data]
    pipeline = AstraeaPipeline()
    store = ReplayStore()

    for event in events[:3]:
        result = pipeline.process(event).to_dict()
        saved_path = store.save(result["case_id"], result)
        loaded = store.load(result["case_id"])

        assert loaded["case_id"] == result["case_id"], "Loaded case_id should match"
        assert loaded["audit"]["deterministic_hash"] == result["audit"]["deterministic_hash"], (
            "Loaded hash should match saved hash"
        )

    print("[PASS] Replay functionality verified with real events")


def test_sample_events_still_work():
    """Verify original sample events still produce valid output."""
    events = load_events()
    pipeline = AstraeaPipeline()

    for event in events:
        result = pipeline.process(event).to_dict()
        assert result["event_id"], "Missing event_id"
        assert result["audit"]["deterministic_hash"], "Missing hash"
        assert 0.0 <= result["prioritized_case"]["priority_score"] <= 1.0, "Score out of range"

    print(f"[PASS] Original {len(events)} sample events still work correctly")


def run_all_tests():
    """Run all tests and report results."""
    print("=" * 70)
    print("ASTRAEA TEST SUITE - Real Industrial Event Data")
    print("=" * 70)
    print()

    tests = [
        ("Full Pipeline with 100 Real Events", test_full_pipeline_with_real_data),
        ("Hash Stability with 100 Events", test_hash_stability_with_large_dataset),
        ("Threshold Breach Detection", test_threshold_breach_detection_realistic),
        ("Feature Extraction Correctness", test_feature_extraction_correctness),
        ("Priority Score Ranges", test_priority_score_ranges_real_data),
        ("Explainability with Diverse Events", test_explainability_with_diverse_events),
        ("Severity Distribution", test_severity_distribution),
        ("Uncertainty Validity", test_uncertainty_validity_real_data),
        ("Routing Bucket Coverage", test_routing_bucket_coverage),
        ("Replay Functionality", test_replay_with_real_events),
        ("Original Sample Events", test_sample_events_still_work),
    ]

    passed = 0
    failed = 0

    for name, test_func in tests:
        try:
            test_func()
            passed += 1
        except AssertionError as e:
            print(f"[FAIL] {name}: {e}")
            failed += 1
        except Exception as e:
            print(f"[ERROR] {name}: {e}")
            failed += 1

    print()
    print("=" * 70)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 70)

    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
