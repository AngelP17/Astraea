from __future__ import annotations

import json
from pathlib import Path

from backend.core.pipeline import AstraeaPipeline
from backend.core.replay import ReplayStore
from backend.ingestion.normalizer import load_events


def main() -> None:
    events = load_events("data/synthetic_events_100.json")
    pipeline = AstraeaPipeline()
    replay_store = ReplayStore()

    output_dir = Path("artifacts/demo_results")
    output_dir.mkdir(parents=True, exist_ok=True)

    for event in events:
        result = pipeline.process(event)
        payload = result.to_dict()

        case_id = payload["case_id"]
        replay_store.save(case_id, payload)
        (output_dir / f"{case_id}.json").write_text(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
