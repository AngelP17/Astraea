from __future__ import annotations

import time
from datetime import UTC, datetime
from typing import Any

from backend.core.pipeline import AstraeaPipeline
from backend.shared.schemas import Event


class ReplayEngine:
    def __init__(self, pipeline: AstraeaPipeline | None = None) -> None:
        self.pipeline_cls = type(pipeline) if pipeline is not None else AstraeaPipeline

    def verify_replay(self, original_data: dict[str, Any]) -> dict[str, Any]:
        t_start = time.perf_counter()

        event_dict = original_data.get("event", {})
        
        timestamp_val = event_dict.get("timestamp")
        if isinstance(timestamp_val, str):
            try:
                dt = datetime.fromisoformat(timestamp_val.replace("Z", "+00:00"))
            except ValueError:
                dt = datetime.now(UTC)
        else:
            dt = datetime.now(UTC)

        event = Event(
            event_id=event_dict.get("event_id", ""),
            machine_id=event_dict.get("machine_id", ""),
            line_id=event_dict.get("line_id", ""),
            event_type=event_dict.get("event_type", ""),
            timestamp=dt,
            raw_values=event_dict.get("raw_values", {}),
            source=event_dict.get("source", ""),
            metadata=event_dict.get("metadata", {}),
        )

        # Replays must not inherit temporal or prioritization state from the request path.
        replay_result = self.pipeline_cls().process(event)
        replay_data = replay_result.to_dict()
        replay_data["provenance"] = "replayed"

        orig_audit = original_data.get("audit", {})
        replay_audit = replay_data.get("audit", {})

        orig_hash = orig_audit.get("deterministic_hash", "")
        replay_hash = replay_audit.get("deterministic_hash", "")

        orig_stage_hashes = orig_audit.get("stage_hashes", {})
        replay_stage_hashes = replay_audit.get("stage_hashes", {})

        stage_diffs = []
        stages_to_compare = [
            "event",
            "features",
            "assessment",
            "prioritization",
            "decision",
            "execution",
            "consequence",
        ]
        for stage in stages_to_compare:
            orig_h = orig_stage_hashes.get(stage, "")
            rep_h = replay_stage_hashes.get(stage, "")
            if orig_h != rep_h:
                stage_diffs.append({
                    "stage": stage,
                    "original_hash": orig_h,
                    "replay_hash": rep_h,
                    "match": False
                })

        duration_ms = (time.perf_counter() - t_start) * 1000

        return {
            "case_id": original_data.get("case_id", ""),
            "original_hash": orig_hash,
            "replay_hash": replay_hash,
            "hash_match": orig_hash == replay_hash,
            "stage_diffs": stage_diffs,
            "original_result": original_data,
            "replayed_result": replay_data,
            "replay_duration_ms": round(duration_ms, 3)
        }
