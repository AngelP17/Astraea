from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
from dataclasses import dataclass, field

from backend.shared.schemas import Event, FeatureVector, ModelAssessment, PrioritizedCase


@dataclass
class CorrelatedEvent:
    event: Event
    anomaly_score: float = 0.0
    failure_probability: float = 0.0
    priority_score: float = 0.0
    severity: str = "low"


@dataclass
class MultiEventReasoningResult:
    batch_id: str
    correlated_events: List[CorrelatedEvent]
    graph_edges: List[Tuple[str, str, float]]
    aggregate_anomaly_score: float
    aggregate_failure_probability: float
    correlation_score: float
    temporal_continuity: float
    cross_machine_correlation: float
    final_priority_score: float
    final_severity: str
    recommendation: str
    rationale: List[str]
    confidence_band: str
    requires_review: bool
    routing_bucket: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class MultiEventCorrelator:
    def __init__(self, window_seconds: int = 300) -> None:
        self.window_seconds = window_seconds
        self.event_buffer: List[Event] = []
        self.machine_events: Dict[str, List[Event]] = defaultdict(list)
        self.line_events: Dict[str, List[Event]] = defaultdict(list)

    def add_event(self, event: Event) -> None:
        self.event_buffer.append(event)
        self.machine_events[event.machine_id].append(event)
        self.line_events[event.line_id].append(event)

        cutoff = datetime.now(timezone.utc).timestamp() - self.window_seconds
        self.event_buffer = [e for e in self.event_buffer if e.timestamp.timestamp() >= cutoff]
        for machine_id in self.machine_events:
            self.machine_events[machine_id] = [
                e for e in self.machine_events[machine_id] if e.timestamp.timestamp() >= cutoff
            ]
        for line_id in self.line_events:
            self.line_events[line_id] = [
                e for e in self.line_events[line_id] if e.timestamp.timestamp() >= cutoff
            ]

    def get_pending_count(self) -> int:
        return len(self.event_buffer)

    def get_correlation_pairs(self) -> List[Tuple[Event, Event, float]]:
        pairs: List[Tuple[Event, Event, float]] = []
        if len(self.event_buffer) < 2:
            return pairs

        for i, e1 in enumerate(self.event_buffer):
            for e2 in self.event_buffer[i + 1 :]:
                if e1.line_id == e2.line_id:
                    pairs.append((e1, e2, 0.9))
                elif e1.machine_id == e2.machine_id:
                    pairs.append((e1, e2, 0.95))
                else:
                    pairs.append((e1, e2, 0.3))

        return pairs

    def compute_correlation_matrix(self) -> Dict[str, Dict[str, float]]:
        matrix: Dict[str, Dict[str, float]] = defaultdict(dict)
        pairs = self.get_correlation_pairs()

        for e1, e2, base_corr in pairs:
            time_diff = abs((e1.timestamp - e2.timestamp).total_seconds())
            time_decay = max(0.1, 1.0 - (time_diff / self.window_seconds))
            correlation = base_corr * time_decay

            matrix[e1.event_id][e2.event_id] = correlation
            matrix[e2.event_id][e1.event_id] = correlation

        return dict(matrix)

    def compute_temporal_continuity(self) -> float:
        if len(self.event_buffer) < 2:
            return 1.0

        sorted_events = sorted(self.event_buffer, key=lambda e: e.timestamp)
        total_gaps = 0.0
        for i in range(1, len(sorted_events)):
            gap = (sorted_events[i].timestamp - sorted_events[i - 1].timestamp).total_seconds()
            total_gaps += min(gap, self.window_seconds)

        avg_gap = total_gaps / (len(sorted_events) - 1)
        return max(0.0, 1.0 - (avg_gap / self.window_seconds))


class GraphReasoningEngine:
    def __init__(self) -> None:
        self.nodes: Dict[str, Dict] = {}
        self.edges: List[Dict] = []

    def add_event_node(
        self, event: Event, anomaly_score: float, failure_probability: float
    ) -> None:
        self.nodes[event.event_id] = {
            "event_id": event.event_id,
            "machine_id": event.machine_id,
            "line_id": event.line_id,
            "event_type": event.event_type,
            "anomaly_score": anomaly_score,
            "failure_probability": failure_probability,
            "timestamp": event.timestamp,
        }

    def add_edge(self, from_id: str, to_id: str, weight: float) -> None:
        self.edges.append({"from": from_id, "to": to_id, "weight": weight})

    def build_graph_from_correlations(
        self, correlation_pairs: List[Tuple[Event, Event, float]]
    ) -> None:
        for e1, e2, weight in correlation_pairs:
            if e1.event_id not in self.nodes:
                self.add_event_node(e1, 0.0, 0.0)
            if e2.event_id not in self.nodes:
                self.add_event_node(e2, 0.0, 0.0)
            self.add_edge(e1.event_id, e2.event_id, weight)

    def compute_graph_metrics(self) -> Tuple[float, float, List[str]]:
        if not self.nodes:
            return 0.0, 0.0, []

        graph_anomaly = sum(n["anomaly_score"] for n in self.nodes.values()) / len(self.nodes)

        max_failure = max(n["failure_probability"] for n in self.nodes.values())

        connected_components = self._find_connected_components()
        largest_component_size = (
            max(len(c) for c in connected_components) if connected_components else 0
        )
        connectivity_score = largest_component_size / max(len(self.nodes), 1)

        affected_machines = set(n["machine_id"] for n in self.nodes.values())
        affected_lines = set(n["line_id"] for n in self.nodes.values())

        insights = []
        if len(affected_machines) > 1:
            insights.append(f"Cross-machine pattern: {len(affected_machines)} machines affected")
        if len(affected_lines) > 1:
            insights.append(f"Multi-line propagation: {len(affected_lines)} lines involved")
        if connectivity_score > 0.5:
            insights.append(f"Strong event correlation: {connectivity_score:.2f} connectivity")

        return graph_anomaly, max_failure, insights

    def _find_connected_components(self) -> List[List[str]]:
        if not self.edges:
            return [[n] for n in self.nodes.keys()]

        adjacency: Dict[str, List[str]] = defaultdict(list)
        for edge in self.edges:
            adjacency[edge["from"]].append(edge["to"])
            adjacency[edge["to"]].append(edge["from"])

        visited = set()
        components: List[List[str]] = []

        for start in self.nodes.keys():
            if start in visited:
                continue
            component = []
            queue = [start]
            while queue:
                node = queue.pop(0)
                if node in visited:
                    continue
                visited.add(node)
                component.append(node)
                queue.extend(adjacency.get(node, []))
            components.append(component)

        return components

    def get_cascade_path(self) -> List[str]:
        if not self.edges:
            return []

        sorted_events = sorted(self.nodes.values(), key=lambda n: n["timestamp"])
        if not sorted_events:
            return []

        cascade = [sorted_events[0]["event_id"]]
        last_machine = sorted_events[0]["machine_id"]

        for event in sorted_events[1:]:
            if event["machine_id"] != last_machine:
                cascade.append(event["event_id"])
                last_machine = event["machine_id"]

        return cascade


class MultiEventReasoningEngine:
    def __init__(self, window_seconds: int = 300) -> None:
        self.correlator = MultiEventCorrelator(window_seconds)
        self.graph_engine = GraphReasoningEngine()

    def process_events(
        self,
        events: List[Event],
        assessments: Dict[str, ModelAssessment],
    ) -> MultiEventReasoningResult:
        for event in events:
            self.correlator.add_event(event)

        correlation_pairs = self.correlator.get_correlation_pairs()

        correlated_events = []
        for event in events:
            assessment = assessments.get(event.event_id)
            anomaly = assessment.anomaly_score if assessment else 0.0
            failure = assessment.failure_probability if assessment else 0.0

            severity = "low"
            if anomaly >= 0.8 or failure >= 0.8:
                severity = "critical"
            elif anomaly >= 0.6 or failure >= 0.6:
                severity = "high"
            elif anomaly >= 0.4 or failure >= 0.4:
                severity = "medium"

            priority = (anomaly * 0.5) + (failure * 0.3) + (0.2 if severity != "low" else 0.0)
            priority = min(max(priority, 0.0), 1.0)

            correlated_events.append(
                CorrelatedEvent(
                    event=event,
                    anomaly_score=anomaly,
                    failure_probability=failure,
                    priority_score=priority,
                    severity=severity,
                )
            )

        correlation_matrix = self.correlator.compute_correlation_matrix()
        temporal_continuity = self.correlator.compute_temporal_continuity()

        self.graph_engine.build_graph_from_correlations(correlation_pairs)
        graph_anomaly, graph_failure, graph_insights = self.graph_engine.compute_graph_metrics()

        aggregate_anomaly = sum(e.anomaly_score for e in correlated_events) / len(correlated_events)
        aggregate_failure = sum(e.failure_probability for e in correlated_events) / len(
            correlated_events
        )

        avg_correlation = 0.0
        if correlation_matrix:
            all_corrs = [c for corr_row in correlation_matrix.values() for c in corr_row.values()]
            avg_correlation = sum(all_corrs) / len(all_corrs) if all_corrs else 0.0

        cross_machine_ids = set(e.event.machine_id for e in correlated_events)
        cross_machine_score = 1.0 - (1.0 / len(cross_machine_ids)) if cross_machine_ids else 0.0

        final_priority = (
            aggregate_anomaly * 0.35
            + aggregate_failure * 0.25
            + avg_correlation * 0.15
            + temporal_continuity * 0.10
            + graph_anomaly * 0.10
            + cross_machine_score * 0.05
        )
        final_priority = min(max(final_priority, 0.0), 1.0)

        final_severity = "low"
        if final_priority >= 0.75:
            final_severity = "critical"
        elif final_priority >= 0.55:
            final_severity = "high"
        elif final_priority >= 0.35:
            final_severity = "medium"

        rationale = []
        if len(correlated_events) >= 3:
            rationale.append(f"Multi-event correlation: {len(correlated_events)} events analyzed")
        if avg_correlation > 0.5:
            rationale.append(f"Strong event correlation: {avg_correlation:.2f}")
        if cross_machine_score > 0.5:
            rationale.append(f"Cross-machine pattern: {len(cross_machine_ids)} machines")
        if temporal_continuity > 0.7:
            rationale.append(f"Temporal continuity: {temporal_continuity:.2f}")
        rationale.extend(graph_insights)

        cascade_path = self.graph_engine.get_cascade_path()
        if len(cascade_path) >= 3:
            rationale.append(f"Cascade path identified: {' → '.join(cascade_path[:5])}")

        requires_review = (
            final_severity in {"critical", "high"}
            or avg_correlation < 0.3
            or temporal_continuity < 0.5
        )

        routing_bucket = "monitor_only"
        if final_severity == "critical":
            routing_bucket = "incident_now"
        elif requires_review:
            routing_bucket = "human_review"
        elif final_severity == "high":
            routing_bucket = "maintenance_priority"
        elif final_severity == "medium":
            routing_bucket = "scheduled_followup"

        recommendation = "Monitor only"
        if final_severity == "critical":
            recommendation = "Immediate multi-machine inspection required"
        elif final_severity == "high":
            recommendation = "Inspect correlated machines within 1 hour"
        elif final_severity == "medium":
            recommendation = "Schedule maintenance review"

        confidence_band = "low"
        if len(correlated_events) >= 5 and avg_correlation > 0.5:
            confidence_band = "high"
        elif len(correlated_events) >= 3 or avg_correlation > 0.3:
            confidence_band = "medium"

        graph_edges = [(e["from"], e["to"], e["weight"]) for e in self.graph_engine.edges]

        return MultiEventReasoningResult(
            batch_id=f"batch_{events[0].event_id if events else 'empty'}",
            correlated_events=correlated_events,
            graph_edges=graph_edges,
            aggregate_anomaly_score=round(aggregate_anomaly, 4),
            aggregate_failure_probability=round(aggregate_failure, 4),
            correlation_score=round(avg_correlation, 4),
            temporal_continuity=round(temporal_continuity, 4),
            cross_machine_correlation=round(cross_machine_score, 4),
            final_priority_score=round(final_priority, 4),
            final_severity=final_severity,
            recommendation=recommendation,
            rationale=rationale,
            confidence_band=confidence_band,
            requires_review=requires_review,
            routing_bucket=routing_bucket,
        )

    def get_pending_count(self) -> int:
        return self.correlator.get_pending_count()
