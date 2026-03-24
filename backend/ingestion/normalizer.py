from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Iterable, List

from backend.shared.schemas import Event


def _parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def normalize_event(raw: dict) -> Event:
    required = [
        "event_id",
        "machine_id",
        "line_id",
        "event_type",
        "timestamp",
        "raw_values",
        "source",
    ]
    missing = [k for k in required if k not in raw]
    if missing:
        raise ValueError(f"Missing required event fields: {missing}")

    raw_values = raw["raw_values"]
    if not isinstance(raw_values, dict):
        raise TypeError("raw_values must be a dictionary")

    cast_values = {}
    for key, value in raw_values.items():
        try:
            cast_values[key] = float(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"raw_values[{key}] must be numeric") from exc

    return Event(
        event_id=str(raw["event_id"]),
        machine_id=str(raw["machine_id"]),
        line_id=str(raw["line_id"]),
        event_type=str(raw["event_type"]),
        timestamp=_parse_timestamp(str(raw["timestamp"])),
        raw_values=cast_values,
        source=str(raw["source"]),
        metadata=raw.get("metadata", {}),
    )


def load_events(path: str = "data/sample_events.json") -> List[Event]:
    payload = json.loads(Path(path).read_text())
    if not isinstance(payload, list):
        raise ValueError("Input file must contain a list of events")
    return [normalize_event(row) for row in payload]


def load_events_from_rows(rows: Iterable[dict]) -> List[Event]:
    return [normalize_event(row) for row in rows]
