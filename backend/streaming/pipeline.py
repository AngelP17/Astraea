from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import AsyncGenerator, Callable, Dict, List, Optional, Any
from dataclasses import dataclass, field
from collections import deque

from backend.shared.schemas import Event, PipelineResult


@dataclass
class StreamEvent:
    event: Event
    received_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    processed: bool = False
    result: Optional[PipelineResult] = None
    latency_ms: float = 0.0


@dataclass
class StreamMetrics:
    total_received: int = 0
    total_processed: int = 0
    total_dropped: int = 0
    avg_latency_ms: float = 0.0
    events_per_second: float = 0.0
    queue_depth: int = 0


class EventStreamBuffer:
    def __init__(self, max_size: int = 1000) -> None:
        self.buffer: deque[StreamEvent] = deque(maxlen=max_size)
        self.lock = asyncio.Lock()

    async def add(self, stream_event: StreamEvent) -> bool:
        async with self.lock:
            max_size = self.buffer.maxlen or 1000
            if len(self.buffer) >= max_size:
                return False
            self.buffer.append(stream_event)
            return True

    async def get_batch(self, count: int) -> List[StreamEvent]:
        async with self.lock:
            batch = []
            for _ in range(min(count, len(self.buffer))):
                if self.buffer:
                    batch.append(self.buffer.popleft())
            return batch

    async def size(self) -> int:
        async with self.lock:
            return len(self.buffer)

    async def clear(self) -> None:
        async with self.lock:
            self.buffer.clear()


class StreamProcessor:
    def __init__(
        self,
        pipeline_func: Callable[[Event], PipelineResult],
        batch_size: int = 5,
        flush_interval_seconds: float = 1.0,
    ) -> None:
        self.pipeline_func = pipeline_func
        self.batch_size = batch_size
        self.flush_interval = flush_interval_seconds
        self.buffer = EventStreamBuffer()
        self.metrics = StreamMetrics()
        self._running = False
        self._process_task: Optional[asyncio.Task] = None

    async def submit(self, event: Event) -> bool:
        start_time = datetime.now(timezone.utc)
        stream_event = StreamEvent(event=event)

        success = await self.buffer.add(stream_event)
        self.metrics.total_received += 1
        self.metrics.queue_depth = await self.buffer.size()

        if success:
            stream_event.received_at = datetime.now(timezone.utc)

        return success

    async def _process_loop(self) -> None:
        while self._running:
            try:
                await asyncio.sleep(self.flush_interval)

                batch = await self.buffer.get_batch(self.batch_size)
                if not batch:
                    continue

                for stream_event in batch:
                    start = datetime.now(timezone.utc)
                    try:
                        result = self.pipeline_func(stream_event.event)
                        stream_event.result = result
                        stream_event.processed = True
                        processing_time = (
                            datetime.now(timezone.utc) - start
                        ).total_seconds() * 1000
                        stream_event.latency_ms = processing_time
                        self.metrics.total_processed += 1
                    except Exception:
                        stream_event.processed = False
                        self.metrics.total_dropped += 1

                if batch:
                    total_latency = sum(e.latency_ms for e in batch if e.processed)
                    count = sum(1 for e in batch if e.processed)
                    if count > 0:
                        self.metrics.avg_latency_ms = total_latency / count

            except asyncio.CancelledError:
                break
            except Exception:
                pass

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._process_task = asyncio.create_task(self._process_loop())

    async def stop(self) -> None:
        self._running = False
        if self._process_task:
            self._process_task.cancel()
            try:
                await self._process_task
            except asyncio.CancelledError:
                pass

    def get_metrics(self) -> StreamMetrics:
        return self.metrics


class StreamingDecisionEngine:
    def __init__(
        self,
        batch_size: int = 5,
        flush_interval: float = 1.0,
    ) -> None:
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.processors: Dict[str, StreamProcessor] = {}
        self._running = False
        self._stream_task: Optional[asyncio.Task] = None

    def create_line_processor(
        self,
        line_id: str,
        pipeline_func: Callable[[Event], PipelineResult],
    ) -> StreamProcessor:
        processor = StreamProcessor(
            pipeline_func=pipeline_func,
            batch_size=self.batch_size,
            flush_interval_seconds=self.flush_interval,
        )
        self.processors[line_id] = processor
        return processor

    async def submit_event(self, event: Event) -> bool:
        line_id = event.line_id
        if line_id not in self.processors:
            return False
        return await self.processors[line_id].submit(event)

    async def submit_event_any_line(self, event: Event) -> bool:
        if not self.processors:
            return False
        processor = next(iter(self.processors.values()))
        return await processor.submit(event)

    async def start_all(self) -> None:
        self._running = True
        for processor in self.processors.values():
            await processor.start()

    async def stop_all(self) -> None:
        self._running = False
        for processor in self.processors.values():
            await processor.stop()

    def get_all_metrics(self) -> Dict[str, StreamMetrics]:
        return {line_id: p.get_metrics() for line_id, p in self.processors.items()}


class EventStreamSimulator:
    def __init__(
        self,
        events: List[Event],
        interval_ms: int = 500,
    ) -> None:
        self.events = events
        self.interval_ms = interval_ms
        self.index = 0

    async def stream(self) -> AsyncGenerator[Event, None]:
        while self.index < len(self.events):
            yield self.events[self.index]
            self.index += 1
            await asyncio.sleep(self.interval_ms / 1000.0)

    def reset(self) -> None:
        self.index = 0


async def run_streaming_demo(
    events: List[Event],
    pipeline_func: Callable[[Event], PipelineResult],
    batch_size: int = 5,
) -> List[StreamEvent]:
    results: List[StreamEvent] = []
    engine = StreamingDecisionEngine(batch_size=batch_size)

    line_ids = set(e.line_id for e in events)
    for line_id in line_ids:
        engine.create_line_processor(line_id, pipeline_func)

    await engine.start_all()

    simulator = EventStreamSimulator(events, interval_ms=200)

    async for event in simulator.stream():
        success = await engine.submit_event(event)
        if success:
            await asyncio.sleep(0.05)

    await asyncio.sleep(1.0)
    await engine.stop_all()

    for processor in engine.processors.values():
        results.extend(processor.buffer.buffer)

    return results
