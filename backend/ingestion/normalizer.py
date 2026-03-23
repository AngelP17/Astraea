import json
from datetime import datetime
from pathlib import Path
from typing import List

from backend.shared.schemas import Event


def load_events(path: str = "data/sample_events.json") -> List[Event]:
    raw = json.loads(Path(path).read_text())
    events = []
    for r in raw:
        events.append(
            Event(
                event_id=r["event_id"],
                machine_id=r["machine_id"],
                line_id=r["line_id"],
                event_type=r["event_type"],
                timestamp=datetime.fromisoformat(r["timestamp"].replace("Z", "+00:00")),
                raw_values=r["raw_values"],
                source=r["source"],
                metadata=r.get("metadata", {}),
            )
        )
    return events


def normalize_event(raw: dict) -> Event:
    return Event(
        event_id=raw["event_id"],
        machine_id=raw["machine_id"],
        line_id=raw["line_id"],
        event_type=raw["event_type"],
        timestamp=datetime.fromisoformat(raw["timestamp"].replace("Z", "+00:00")),
        raw_values=raw["raw_values"],
        source=raw["source"],
        metadata=raw.get("metadata", {}),
    )
