from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from collections import defaultdict, deque


@dataclass
class GraphNode:
    node_id: str
    node_type: str
    machine_id: Optional[str] = None
    line_id: Optional[str] = None
    event_type: Optional[str] = None
    anomaly_score: float = 0.0
    failure_probability: float = 0.0
    priority_score: float = 0.0
    severity: str = "low"
    timestamp: Optional[datetime] = None
    properties: Dict = field(default_factory=dict)


@dataclass
class GraphEdge:
    from_node: str
    to_node: str
    edge_type: str
    weight: float
    timestamp: Optional[datetime] = None


@dataclass
class GraphInferenceResult:
    root_cause_id: Optional[str]
    cascade_path: List[str]
    affected_machines: List[str]
    affected_lines: List[str]
    graph_anomaly_score: float
    inference_confidence: float
    propagation_risk: float
    recommendations: List[str]
    reasoning_chain: List[str]
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class EventGraph:
    def __init__(self) -> None:
        self.nodes: Dict[str, GraphNode] = {}
        self.edges: List[GraphEdge] = []
        self.adjacency: Dict[str, List[Tuple[str, GraphEdge]]] = defaultdict(list)
        self.reverse_adjacency: Dict[str, List[Tuple[str, GraphEdge]]] = defaultdict(list)

    def add_node(self, node: GraphNode) -> None:
        self.nodes[node.node_id] = node

    def add_edge(self, edge: GraphEdge) -> None:
        self.edges.append(edge)
        self.adjacency[edge.from_node].append((edge.to_node, edge))
        self.reverse_adjacency[edge.to_node].append((edge.from_node, edge))

    def get_node(self, node_id: str) -> Optional[GraphNode]:
        return self.nodes.get(node_id)

    def get_neighbors(self, node_id: str) -> List[Tuple[str, GraphEdge]]:
        return self.adjacency.get(node_id, [])

    def get_predecessors(self, node_id: str) -> List[Tuple[str, GraphEdge]]:
        return self.reverse_adjacency.get(node_id, [])

    def topological_sort(self) -> List[str]:
        in_degree: Dict[str, int] = defaultdict(int)
        for node_id in self.nodes:
            in_degree[node_id] = 0
        for edge in self.edges:
            in_degree[edge.to_node] += 1

        queue = deque([n for n in self.nodes if in_degree[n] == 0])
        sorted_nodes = []

        while queue:
            node_id = queue.popleft()
            sorted_nodes.append(node_id)
            for neighbor, _ in self.adjacency[node_id]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        return sorted_nodes


class GraphReasoningEngine:
    def __init__(self) -> None:
        self.graph = EventGraph()
        self.event_to_node: Dict[str, str] = {}
        self.machine_nodes: Dict[str, List[str]] = defaultdict(list)
        self.line_nodes: Dict[str, List[str]] = defaultdict(list)

    def add_event_as_node(
        self,
        event_id: str,
        machine_id: str,
        line_id: str,
        event_type: str,
        anomaly_score: float = 0.0,
        failure_probability: float = 0.0,
        timestamp: Optional[datetime] = None,
    ) -> None:
        node_id = f"event_{event_id}"
        severity = "low"
        if anomaly_score >= 0.7 or failure_probability >= 0.7:
            severity = "critical"
        elif anomaly_score >= 0.5 or failure_probability >= 0.5:
            severity = "high"
        elif anomaly_score >= 0.3 or failure_probability >= 0.3:
            severity = "medium"

        priority = (
            (anomaly_score * 0.5)
            + (failure_probability * 0.3)
            + (0.2 if severity != "low" else 0.0)
        )

        node = GraphNode(
            node_id=node_id,
            node_type="event",
            machine_id=machine_id,
            line_id=line_id,
            event_type=event_type,
            anomaly_score=anomaly_score,
            failure_probability=failure_probability,
            priority_score=priority,
            severity=severity,
            timestamp=timestamp,
        )
        self.graph.add_node(node)
        self.event_to_node[event_id] = node_id
        self.machine_nodes[machine_id].append(node_id)
        self.line_nodes[line_id].append(node_id)

    def add_machine_relation(
        self,
        from_event_id: str,
        to_event_id: str,
        weight: float = 0.95,
        timestamp: Optional[datetime] = None,
    ) -> None:
        from_node = self.event_to_node.get(from_event_id)
        to_node = self.event_to_node.get(to_event_id)
        if from_node and to_node:
            edge = GraphEdge(
                from_node=from_node,
                to_node=to_node,
                edge_type="same_machine",
                weight=weight,
                timestamp=timestamp,
            )
            self.graph.add_edge(edge)

    def add_line_relation(
        self,
        from_event_id: str,
        to_event_id: str,
        weight: float = 0.90,
        timestamp: Optional[datetime] = None,
    ) -> None:
        from_node = self.event_to_node.get(from_event_id)
        to_node = self.event_to_node.get(to_event_id)
        if from_node and to_node:
            edge = GraphEdge(
                from_node=from_node,
                to_node=to_node,
                edge_type="same_line",
                weight=weight,
                timestamp=timestamp,
            )
            self.graph.add_edge(edge)

    def add_causal_relation(
        self,
        from_event_id: str,
        to_event_id: str,
        weight: float = 0.85,
        timestamp: Optional[datetime] = None,
    ) -> None:
        from_node = self.event_to_node.get(from_event_id)
        to_node = self.event_to_node.get(to_event_id)
        if from_node and to_node:
            edge = GraphEdge(
                from_node=from_node,
                to_node=to_node,
                edge_type="causal",
                weight=weight,
                timestamp=timestamp,
            )
            self.graph.add_edge(edge)

    def infer_root_cause(self) -> Optional[str]:
        if not self.graph.nodes:
            return None

        in_degree: Dict[str, int] = defaultdict(int)
        for node_id in self.graph.nodes:
            in_degree[node_id] = 0
        for edge in self.graph.edges:
            in_degree[edge.to_node] += 1

        candidates = [n for n in self.graph.nodes if in_degree[n] == 0]
        if not candidates:
            sorted_nodes = self.graph.topological_sort()
            if sorted_nodes:
                candidates = [sorted_nodes[0]]

        if not candidates:
            return None

        root_cause = max(
            candidates,
            key=lambda n: self.graph.nodes[n].anomaly_score
            + self.graph.nodes[n].failure_probability,
        )
        return root_cause

    def find_cascade_path(self, start_event_id: Optional[str] = None) -> List[str]:
        if start_event_id:
            start_node = self.event_to_node.get(start_event_id)
        else:
            root = self.infer_root_cause()
            start_node = root

        if not start_node:
            return []

        visited: Set[str] = set()
        path = []
        queue = deque([start_node])

        while queue:
            node_id = queue.popleft()
            if node_id in visited:
                continue
            visited.add(node_id)
            path.append(node_id)
            for neighbor, edge in self.graph.get_neighbors(node_id):
                if neighbor not in visited:
                    queue.append(neighbor)

        return path

    def compute_propagation_risk(self) -> float:
        if not self.graph.nodes:
            return 0.0

        max_anomaly = max(n.anomaly_score for n in self.graph.nodes.values())
        max_failure = max(n.failure_probability for n in self.graph.nodes.values())

        critical_nodes = sum(1 for n in self.graph.nodes.values() if n.severity == "critical")

        affected_machines = len(set(n.machine_id for n in self.graph.nodes.values()))
        affected_lines = len(set(n.line_id for n in self.graph.nodes.values()))

        propagation = (
            max_anomaly * 0.30
            + max_failure * 0.25
            + (critical_nodes / max(len(self.graph.nodes), 1)) * 0.20
            + (affected_machines / max(len(self.machine_nodes), 1)) * 0.15
            + (affected_lines / max(len(self.line_nodes), 1)) * 0.10
        )

        return min(propagation, 1.0)

    def infer(self) -> GraphInferenceResult:
        root_cause = self.infer_root_cause()
        cascade_path = self.find_cascade_path()
        affected_machines = list(
            set(n.machine_id for n in self.graph.nodes.values() if n.machine_id)
        )
        affected_lines = list(set(n.line_id for n in self.graph.nodes.values() if n.line_id))

        graph_anomaly = sum(n.anomaly_score for n in self.graph.nodes.values()) / max(
            len(self.graph.nodes), 1
        )

        cascade_length = len(cascade_path)
        connectivity = len(self.graph.edges) / max(
            len(self.graph.nodes) * (len(self.graph.nodes) - 1), 1
        )
        inference_confidence = min(graph_anomaly * 0.5 + connectivity * 0.5, 1.0)

        propagation_risk = self.compute_propagation_risk()

        reasoning_chain = []
        recommendations = []

        if root_cause:
            root_node = self.graph.nodes[root_cause]
            reasoning_chain.append(
                f"Root cause identified: {root_node.event_type} on {root_node.machine_id}"
            )
            if root_node.anomaly_score > 0.7:
                recommendations.append("Immediate inspection of root cause machine required")

        if cascade_length > 3:
            reasoning_chain.append(
                f"Cascade path detected: {cascade_length} events in propagation chain"
            )
            recommendations.append("Alert maintenance team of potential cascade failure")

        if len(affected_machines) > 2:
            reasoning_chain.append(
                f"Multi-machine impact: {len(affected_machines)} machines affected"
            )
            recommendations.append("Consider line-wide inspection")

        if propagation_risk > 0.7:
            recommendations.append("HIGH PROPAGATION RISK - Escalate to operations supervisor")
        elif propagation_risk > 0.5:
            recommendations.append("Monitor for further propagation")

        if not recommendations:
            recommendations.append("Continue passive monitoring")

        return GraphInferenceResult(
            root_cause_id=root_cause,
            cascade_path=cascade_path,
            affected_machines=affected_machines,
            affected_lines=affected_lines,
            graph_anomaly_score=round(graph_anomaly, 4),
            inference_confidence=round(inference_confidence, 4),
            propagation_risk=round(propagation_risk, 4),
            recommendations=recommendations,
            reasoning_chain=reasoning_chain,
        )


class HybridGraphReasoningEngine:
    def __init__(self) -> None:
        self.graph_engine = GraphReasoningEngine()
        self.multi_event_results: List[Dict] = []

    def build_graph_from_events(
        self,
        events: List[Dict],
        assessments: Dict[str, Dict],
    ) -> None:
        event_list = sorted(events, key=lambda e: e.get("timestamp", ""))
        machine_events: Dict[str, List] = defaultdict(list)
        line_events: Dict[str, List] = defaultdict(list)

        for e in event_list:
            machine_events[e["machine_id"]].append(e)
            line_events[e["line_id"]].append(e)

        for e in event_list:
            assessment = assessments.get(e["event_id"], {})
            self.graph_engine.add_event_as_node(
                event_id=e["event_id"],
                machine_id=e["machine_id"],
                line_id=e["line_id"],
                event_type=e["event_type"],
                anomaly_score=assessment.get("anomaly_score", 0.0),
                failure_probability=assessment.get("failure_probability", 0.0),
            )

        for machine_id, machine_evts in machine_events.items():
            sorted_machine = sorted(machine_evts, key=lambda e: e.get("timestamp", ""))
            for i in range(len(sorted_machine) - 1):
                self.graph_engine.add_machine_relation(
                    sorted_machine[i]["event_id"],
                    sorted_machine[i + 1]["event_id"],
                    weight=0.95,
                )

        for line_id, line_evts in line_events.items():
            sorted_line = sorted(line_evts, key=lambda e: e.get("timestamp", ""))
            for i in range(len(sorted_line) - 1):
                if sorted_line[i]["machine_id"] != sorted_line[i + 1]["machine_id"]:
                    self.graph_engine.add_line_relation(
                        sorted_line[i]["event_id"],
                        sorted_line[i + 1]["event_id"],
                        weight=0.85,
                    )

        for i in range(len(event_list) - 1):
            curr = event_list[i]
            next_evt = event_list[i + 1]
            if curr.get("line_id") == next_evt.get("line_id"):
                self.graph_engine.add_causal_relation(
                    curr["event_id"],
                    next_evt["event_id"],
                    weight=0.80,
                )

    def infer(self) -> GraphInferenceResult:
        return self.graph_engine.infer()
