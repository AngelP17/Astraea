from __future__ import annotations

from backend.shared.schemas import Decision, ExecutionPlan, PrioritizedCase


class ExecutionDispatcher:
    def dispatch(self, case: PrioritizedCase, decision: Decision) -> ExecutionPlan:
        if case.routing_bucket == "incident_now":
            return ExecutionPlan(
                case_id=case.case_id,
                dispatch_status="prepared",
                assigned_team="operations_response",
                commands=[
                    "page_operations_supervisor",
                    "notify_maintenance_on_call",
                    "create_incident_ticket",
                ],
                notifications=[
                    f"Critical case {case.case_id} requires immediate inspection",
                ],
            )

        if case.routing_bucket == "human_review":
            return ExecutionPlan(
                case_id=case.case_id,
                dispatch_status="queued_for_review",
                assigned_team="reliability_engineering",
                commands=[
                    "create_review_ticket",
                    "attach_audit_bundle",
                ],
                notifications=[
                    f"Case {case.case_id} queued for human review",
                ],
            )

        if case.routing_bucket == "maintenance_priority":
            return ExecutionPlan(
                case_id=case.case_id,
                dispatch_status="scheduled",
                assigned_team="maintenance",
                commands=[
                    "open_work_order",
                    "watch_machine_telemetry",
                ],
                notifications=[
                    f"High-priority maintenance case {case.case_id} created",
                ],
            )

        if case.routing_bucket == "scheduled_followup":
            return ExecutionPlan(
                case_id=case.case_id,
                dispatch_status="backlog",
                assigned_team="maintenance_planning",
                commands=[
                    "add_to_backlog",
                ],
                notifications=[
                    f"Medium-priority follow-up case {case.case_id} added to backlog",
                ],
            )

        return ExecutionPlan(
            case_id=case.case_id,
            dispatch_status="monitoring_only",
            assigned_team=None,
            commands=["keep_monitoring"],
            notifications=[f"Case {case.case_id} retained for observation"],
        )
