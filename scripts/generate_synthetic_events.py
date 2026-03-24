from __future__ import annotations

import json
import random
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any


MACHINES = [
    ("feeder_motor_A3", "line_7"),
    ("conveyor_drive_B1", "line_7"),
    ("press_unit_C2", "line_3"),
    ("hydraulic_pump_D4", "line_3"),
    ("cooling_fan_E5", "line_5"),
    ("packaging_robot_F6", "line_1"),
    ("welding_arm_G7", "line_9"),
    ("paint_sprayer_H8", "line_4"),
    ("conveyor_belt_I9", "line_2"),
    ("stamping_press_J1", "line_6"),
]

EVENT_TYPES = [
    "vibration_spike",
    "vibration_amplification",
    "temperature_rise",
    "temperature_critical",
    "pressure_drop",
    "pressure_critical",
    "rpm_deviation",
    "current_surge",
    "overcurrent_event",
    "stoppage",
    "stoppage_extended",
    "bearing_wear_detected",
    "imminent_failure",
    "cooling_reduced",
]

SOURCES = [
    "sensor_gateway",
    "plc_monitor",
    "safety_system",
    "maintenance_terminal",
]


def generate_raw_values(event_type: str, severity: float) -> Dict[str, float]:
    base = {
        "vibration_rms": 2.5,
        "vibration_peak": 5.2,
        "temperature_c": 55.0,
        "current_amps": 12.0,
        "rpm": 1000,
    }

    if "vibration" in event_type:
        multiplier = 1 + (severity * 3)
        base["vibration_rms"] = round(base["vibration_rms"] * multiplier, 1)
        base["vibration_peak"] = round(base["vibration_peak"] * multiplier, 1)

    if "temperature" in event_type:
        base["temperature_c"] = round(55 + (severity * 60), 1)
        base["current_amps"] = round(base["current_amps"] * (1 + severity * 0.5), 1)

    if "pressure" in event_type:
        base["vibration_rms"] = round(base["vibration_rms"] * (1 + severity), 1)

    if "rpm" in event_type:
        base["rpm"] = int(base["rpm"] * (1 - severity * 0.4))

    if "current" in event_type:
        base["current_amps"] = round(base["current_amps"] * (1 + severity * 2), 1)

    if "stoppage" in event_type or "failure" in event_type:
        base["vibration_rms"] = 0.1
        base["vibration_peak"] = 0.3
        base["current_amps"] = 0.0
        base["rpm"] = 0

    return base


def generate_metadata(event_type: str, machine_id: str) -> Dict[str, Any]:
    meta: Dict[str, Any] = {}

    if "accel" in machine_id or "vibration" in event_type:
        meta["sensor_id"] = f"accel_{machine_id.split('_')[1]}_{random.randint(1, 3):02d}"
        meta["location"] = random.choice(["bearing_housing", "drive_shaft", "motor_frame"])

    if "temp" in machine_id or "temperature" in event_type:
        meta["sensor_id"] = f"temp_{machine_id.split('_')[1]}_{random.randint(1, 3):02d}"
        meta["location"] = "motor_winding"

    if "pressure" in event_type:
        meta["sensor_id"] = f"pressure_{machine_id.split('_')[1]}_{random.randint(1, 3):02d}"
        meta["location"] = "hydraulic_manifold"
        meta["pressure_psi"] = random.randint(1500, 2500) - random.randint(0, 500)

    if "stoppage" in event_type:
        meta["stoppage_reason"] = random.choice(
            [
                "hydraulic_pressure_loss",
                "emergency_stop",
                "sensor_malfunction",
                "power_surge",
            ]
        )
        meta["duration_seconds"] = random.randint(60, 3600)

    if "rpm" in event_type:
        meta["expected_rpm"] = 900
        meta["actual_rpm"] = int(meta["expected_rpm"] * random.uniform(0.5, 0.85))

    return meta


def generate_synthetic_events(
    count: int = 100, start_time: datetime = None
) -> List[Dict[str, Any]]:
    if start_time is None:
        start_time = datetime(2026, 3, 24, 8, 0, 0, tzinfo=timezone.utc)

    events = []
    event_counter = 1

    machine_states: Dict[str, float] = {machine[0]: 0.1 for machine in MACHINES}

    for i in range(count):
        machine_id, line_id = random.choice(MACHINES)

        current_severity = machine_states[machine_id]

        if random.random() < 0.7:
            event_type = random.choice(EVENT_TYPES)
        else:
            event_type = EVENT_TYPES[i % len(EVENT_TYPES)]

        if random.random() < 0.15:
            current_severity = min(1.0, current_severity + random.uniform(0.1, 0.3))
        elif random.random() < 0.2:
            current_severity = max(0.1, current_severity - random.uniform(0.05, 0.15))

        machine_states[machine_id] = current_severity

        time_offset = timedelta(seconds=i * random.randint(8, 45))
        timestamp = start_time + time_offset

        raw_values = generate_raw_values(event_type, current_severity)

        event = {
            "event_id": f"demo_{event_counter:04d}",
            "machine_id": machine_id,
            "line_id": line_id,
            "event_type": event_type,
            "timestamp": timestamp.isoformat(),
            "raw_values": raw_values,
            "source": random.choice(SOURCES),
            "metadata": generate_metadata(event_type, machine_id),
        }

        events.append(event)
        event_counter += 1

    return events


def save_synthetic_events(
    count: int = 100, filepath: str = "data/synthetic_events_100.json"
) -> None:
    events = generate_synthetic_events(count)
    with open(filepath, "w") as f:
        json.dump(events, f, indent=2)
    print(f"Generated {count} synthetic events -> {filepath}")


if __name__ == "__main__":
    save_synthetic_events(100)
