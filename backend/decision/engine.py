from __future__ import annotations

from typing import Dict, List, Tuple

from backend.shared.schemas import Decision, PrioritizedCase


class DecisionEngine:
    def resolve(self, case: PrioritizedCase) -> Decision:
        recommendation, urgency, next_steps, action_plan = self._map_action(case)

        return Decision(
            case_id=case.case_id,
            recommendation=recommendation,
            urgency=urgency,
            owner=self._assign_owner(case),
            justification=case.rationale,
            next_steps=next_steps,
            action_plan=action_plan,
        )

    def _assign_owner(self, case: PrioritizedCase) -> str | None:
        if case.routing_bucket == "incident_now":
            return "operations_supervisor"
        if case.routing_bucket == "maintenance_priority":
            return "maintenance_lead"
        if case.routing_bucket == "human_review":
            return "reliability_engineer"
        if case.routing_bucket == "scheduled_followup":
            return "planner"
        return None

    def _map_action(
        self, case: PrioritizedCase
    ) -> Tuple[str, str, List[str], List[Dict[str, str]]]:
        if case.severity == "critical":
            return (
                "Immediate inspection required",
                "critical",
                [
                    "Dispatch maintenance immediately",
                    "Verify machine safety state",
                    "Open incident record",
                ],
                [
                    {"step": "dispatch_team", "status": "pending"},
                    {"step": "inspect_machine", "status": "pending"},
                    {"step": "record_incident", "status": "pending"},
                ],
            )

        if case.severity == "high":
            return (
                "Inspect within 1 hour",
                "high",
                [
                    "Schedule technician visit",
                    "Increase telemetry watch",
                    "Stage spare parts if applicable",
                ],
                [
                    {"step": "schedule_visit", "status": "pending"},
                    {"step": "monitor_feed", "status": "pending"},
                ],
            )

        if case.severity == "medium":
            return (
                "Plan intervention during next maintenance window",
                "medium",
                [
                    "Add to maintenance queue",
                    "Review trend progression",
                ],
                [
                    {"step": "queue_maintenance", "status": "pending"},
                    {"step": "review_trend", "status": "pending"},
                ],
            )

        return (
            "Monitor only",
            "low",
            [
                "Continue passive monitoring",
                "Re-evaluate if signal worsens",
            ],
            [
                {"step": "monitor_only", "status": "passive"},
            ],
        )
