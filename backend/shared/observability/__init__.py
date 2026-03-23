from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Callable
from enum import Enum
import time
import uuid


class SpanStatus(Enum):
    OK = "ok"
    ERROR = "error"
    WARNING = "warning"


@dataclass
class Span:
    span_id: str
    operation_name: str
    start_time: float
    end_time: Optional[float] = None
    duration_ms: Optional[float] = None
    status: SpanStatus = SpanStatus.OK
    attributes: Dict[str, Any] = field(default_factory=dict)
    events: List[Dict[str, Any]] = field(default_factory=list)
    error_message: Optional[str] = None

    def finish(self, status: SpanStatus = SpanStatus.OK, error: Optional[str] = None):
        self.end_time = time.perf_counter()
        self.duration_ms = (self.end_time - self.start_time) * 1000
        self.status = status
        self.error_message = error

    def add_event(self, name: str, attributes: Optional[Dict[str, Any]] = None):
        self.events.append(
            {
                "name": name,
                "timestamp": time.perf_counter(),
                "attributes": attributes or {},
            }
        )

    def set_attribute(self, key: str, value: Any):
        self.attributes[key] = value


@dataclass
class Trace:
    trace_id: str
    spans: List[Span] = field(default_factory=list)
    start_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    total_duration_ms: Optional[float] = None

    def finish(self):
        self.end_time = datetime.now(timezone.utc)
        if self.spans:
            self.total_duration_ms = sum(s.duration_ms or 0 for s in self.spans)


class Observability:
    def __init__(self, service_name: str = "astraea"):
        self.service_name = service_name
        self._traces: Dict[str, Trace] = {}
        self._active_spans: Dict[str, Span] = {}
        self._metrics: Dict[str, List[float]] = {}

    def start_trace(self, trace_id: Optional[str] = None) -> str:
        trace_id = trace_id or str(uuid.uuid4())
        trace = Trace(trace_id=trace_id)
        self._traces[trace_id] = trace
        return trace_id

    def start_span(
        self,
        trace_id: str,
        operation_name: str,
        attributes: Optional[Dict[str, Any]] = None,
    ) -> Span:
        span_id = f"{trace_id}:{operation_name}:{len(self._traces.get(trace_id, Trace(trace_id=trace_id)).spans)}"
        span = Span(
            span_id=span_id,
            operation_name=operation_name,
            start_time=time.perf_counter(),
            attributes=attributes or {},
        )
        self._active_spans[span_id] = span
        if trace_id in self._traces:
            self._traces[trace_id].spans.append(span)
        return span

    def end_span(
        self,
        span: Span,
        status: SpanStatus = SpanStatus.OK,
        error: Optional[str] = None,
    ):
        span.finish(status, error)
        if span.span_id in self._active_spans:
            del self._active_spans[span.span_id]

    def finish_trace(self, trace_id: str) -> Optional[Trace]:
        if trace_id in self._traces:
            self._traces[trace_id].finish()
            return self._traces[trace_id]
        return None

    def get_trace(self, trace_id: str) -> Optional[Trace]:
        return self._traces.get(trace_id)

    def get_all_traces(self) -> List[Trace]:
        return list(self._traces.values())

    def record_metric(self, metric_name: str, value: float):
        if metric_name not in self._metrics:
            self._metrics[metric_name] = []
        self._metrics[metric_name].append(value)
        if len(self._metrics[metric_name]) > 10000:
            self._metrics[metric_name] = self._metrics[metric_name][-10000:]

    def get_metric_stats(self, metric_name: str) -> Dict[str, Any]:
        if metric_name not in self._metrics:
            return {"count": 0, "avg": None, "min": None, "max": None}
        values = self._metrics[metric_name]
        return {
            "count": len(values),
            "avg": sum(values) / len(values) if values else None,
            "min": min(values) if values else None,
            "max": max(values) if values else None,
        }

    def clear(self):
        self._traces.clear()
        self._active_spans.clear()


class PipelineObserver:
    def __init__(self, observability: Optional[Observability] = None):
        self.observability = observability or Observability()

    def trace_pipeline(
        self,
        pipeline_name: str,
        inputs: Dict[str, Any],
    ) -> tuple[str, Callable]:
        trace_id = self.observability.start_trace()
        span = self.observability.start_span(
            trace_id, f"pipeline.{pipeline_name}", {"inputs": str(inputs)[:200]}
        )
        return trace_id, lambda status=SpanStatus.OK, error=None: (
            self.observability.end_span(span, status, error),
            self.observability.finish_trace(trace_id),
        )

    def trace_stage(
        self, trace_id: str, stage_name: str, stage_inputs: Dict[str, Any]
    ) -> Callable:
        span = self.observability.start_span(
            trace_id, f"stage.{stage_name}", {"inputs": str(stage_inputs)[:200]}
        )
        start = time.perf_counter()

        def finish_stage(
            outputs: Any = None,
            status: SpanStatus = SpanStatus.OK,
            error: Optional[str] = None,
        ):
            duration_ms = (time.perf_counter() - start) * 1000
            span.set_attribute("duration_ms", duration_ms)
            span.set_attribute("outputs", str(outputs)[:200] if outputs else None)
            self.observability.record_metric(
                f"stage.{stage_name}.duration_ms", duration_ms
            )
            self.observability.end_span(span, status, error)
            return outputs

        return finish_stage


@dataclass
class DecisionTrace:
    case_id: str
    event_id: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    pipeline_trace: List[Dict[str, Any]] = field(default_factory=list)
    score_breakdown: Dict[str, float] = field(default_factory=dict)
    model_calls: List[Dict[str, Any]] = field(default_factory=list)
    total_duration_ms: float = 0.0

    def add_stage_trace(
        self, stage_name: str, duration_ms: float, details: Dict[str, Any]
    ):
        self.pipeline_trace.append(
            {
                "stage": stage_name,
                "duration_ms": duration_ms,
                "details": details,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )

    def add_model_call(self, model_name: str, latency_ms: float, success: bool):
        self.model_calls.append(
            {
                "model": model_name,
                "latency_ms": latency_ms,
                "success": success,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )

    def add_score_component(self, component: str, value: float):
        self.score_breakdown[component] = value


class DecisionTracer:
    def __init__(self, observability: Optional[Observability] = None):
        self.observability = observability or Observability()
        self._decision_traces: Dict[str, DecisionTrace] = {}

    def start_decision_trace(self, case_id: str, event_id: str) -> DecisionTrace:
        trace = DecisionTrace(case_id=case_id, event_id=event_id)
        self._decision_traces[case_id] = trace
        return trace

    def get_trace(self, case_id: str) -> Optional[DecisionTrace]:
        return self._decision_traces.get(case_id)

    def get_all_traces(self) -> List[DecisionTrace]:
        return list(self._decision_traces.values())

    def finalize_trace(self, case_id: str, total_duration_ms: float):
        if case_id in self._decision_traces:
            self._decision_traces[case_id].total_duration_ms = total_duration_ms

    def get_score_summary(self) -> Dict[str, Any]:
        traces_with_scores = [
            t for t in self._decision_traces.values() if t.score_breakdown
        ]
        if not traces_with_scores:
            return {"count": 0}

        all_components = {}
        for trace in traces_with_scores:
            for component, value in trace.score_breakdown.items():
                if component not in all_components:
                    all_components[component] = []
                all_components[component].append(value)

        return {
            "count": len(traces_with_scores),
            "components": {
                comp: {
                    "avg": sum(vals) / len(vals),
                    "min": min(vals),
                    "max": max(vals),
                }
                for comp, vals in all_components.items()
            },
        }
