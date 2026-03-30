from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from backend.core.pipeline import AstraeaPipeline
from backend.ingestion.normalizer import load_events
from backend.shared.schemas import Event


@dataclass
class StageEvent:
    stage: int
    stage_name: str
    stage_label: str
    event_id: str
    case_id: str
    partial_result: dict[str, Any]
    completed: bool
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())


STAGE_DEFINITIONS = [
    {"name": "capture", "label": "EVENT_CAPTURE", "accent": "primary"},
    {"name": "normalize", "label": "CONTRACT_LOCK", "accent": "secondary"},
    {"name": "feature", "label": "STATE_EXTRACTION", "accent": "secondary"},
    {"name": "score", "label": "RISK_MODEL", "accent": "danger"},
    {"name": "prioritize", "label": "OPERATING_STANCE", "accent": "tertiary"},
    {"name": "dispatch", "label": "ACTION_BUNDLE", "accent": "primary"},
    {"name": "audit", "label": "REPLAY_GUARANTEE", "accent": "primary"},
]


class StreamingPipeline:
    def __init__(self) -> None:
        self.pipeline = AstraeaPipeline()
        self.events: list[Event] = []
        self._loaded = False

    def load_events(self, path: str) -> None:
        self.events = load_events(path)
        self._loaded = True

    async def stream_with_stages(
        self,
        event: Event,
        stage_interval_ms: int = 400,
    ) -> AsyncGenerator[StageEvent, None]:
        if not self._loaded:
            raise RuntimeError("Events not loaded. Call load_events() first.")

        pipeline = AstraeaPipeline()

        event_dict = event.to_dict()
        case_id = f"case_{event.event_id}"

        partial: dict[str, Any] = {
            "event_id": event.event_id,
            "case_id": case_id,
            "event": event_dict,
        }

        yield StageEvent(
            stage=1,
            stage_name="capture",
            stage_label="EVENT_CAPTURE",
            event_id=event.event_id,
            case_id=case_id,
            partial_result=partial.copy(),
            completed=False,
        )
        await asyncio.sleep(stage_interval_ms / 1000.0)

        features = pipeline.feature_engine.extract(event)
        partial["features"] = features.to_dict()

        yield StageEvent(
            stage=2,
            stage_name="normalize",
            stage_label="CONTRACT_LOCK",
            event_id=event.event_id,
            case_id=case_id,
            partial_result=partial.copy(),
            completed=False,
        )
        await asyncio.sleep(stage_interval_ms / 1000.0)

        partial["features"] = features.to_dict()

        yield StageEvent(
            stage=3,
            stage_name="feature",
            stage_label="STATE_EXTRACTION",
            event_id=event.event_id,
            case_id=case_id,
            partial_result=partial.copy(),
            completed=False,
        )
        await asyncio.sleep(stage_interval_ms / 1000.0)

        assessment = pipeline.anomaly_detector.assess(features)
        partial["assessment"] = assessment.to_dict()

        yield StageEvent(
            stage=4,
            stage_name="score",
            stage_label="RISK_MODEL",
            event_id=event.event_id,
            case_id=case_id,
            partial_result=partial.copy(),
            completed=False,
        )
        await asyncio.sleep(stage_interval_ms / 1000.0)

        case = pipeline.prioritizer.prioritize(event, assessment)
        partial["prioritized_case"] = case.to_dict()

        yield StageEvent(
            stage=5,
            stage_name="prioritize",
            stage_label="OPERATING_STANCE",
            event_id=event.event_id,
            case_id=case_id,
            partial_result=partial.copy(),
            completed=False,
        )
        await asyncio.sleep(stage_interval_ms / 1000.0)

        decision = pipeline.decision_engine.resolve(case)
        partial["decision"] = decision.to_dict()

        yield StageEvent(
            stage=6,
            stage_name="dispatch",
            stage_label="ACTION_BUNDLE",
            event_id=event.event_id,
            case_id=case_id,
            partial_result=partial.copy(),
            completed=False,
        )
        await asyncio.sleep(stage_interval_ms / 1000.0)

        execution = pipeline.dispatcher.dispatch(case, decision)
        partial["execution"] = execution.to_dict()

        consequence = pipeline.consequence_calculator.calculate(case, decision, assessment, event)
        partial["consequence"] = consequence.to_dict()

        yield StageEvent(
            stage=7,
            stage_name="audit",
            stage_label="REPLAY_GUARANTEE",
            event_id=event.event_id,
            case_id=case_id,
            partial_result=partial.copy(),
            completed=False,
        )
        await asyncio.sleep(stage_interval_ms / 1000.0)

        audit = pipeline.audit_recorder.record(
            event=event,
            features=features,
            assessment=assessment,
            case=case,
            decision=decision,
            execution=execution,
        )
        partial["audit"] = audit.to_dict()

        yield StageEvent(
            stage=7,
            stage_name="audit",
            stage_label="REPLAY_GUARANTEE",
            event_id=event.event_id,
            case_id=case_id,
            partial_result=partial.copy(),
            completed=True,
        )

    async def stream_demo(
        self,
        event_path: str = "data/synthetic_events_100.json",
        event_count: int = 5,
        stage_interval_ms: int = 400,
        event_interval_ms: int = 800,
    ) -> AsyncGenerator[StageEvent, None]:
        self.load_events(event_path)

        for i, event in enumerate(self.events[:event_count]):
            async for stage_event in self.stream_with_stages(event, stage_interval_ms):
                yield stage_event

            if i < event_count - 1:
                await asyncio.sleep(event_interval_ms / 1000.0)


async def run_streaming_demo(
    event_path: str = "data/synthetic_events_100.json",
    event_count: int = 5,
    stage_interval_ms: int = 400,
    event_interval_ms: int = 800,
) -> AsyncGenerator[StageEvent, None]:
    streaming_pipeline = StreamingPipeline()
    async for event in streaming_pipeline.stream_demo(
        event_path=event_path,
        event_count=event_count,
        stage_interval_ms=stage_interval_ms,
        event_interval_ms=event_interval_ms,
    ):
        yield event
