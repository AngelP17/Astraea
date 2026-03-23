from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timezone
from enum import Enum

from backend.execution.sandbox import (
    Sandbox,
    SandboxMode,
    WorkflowStep,
    BoundedWorkflowEngine,
    WorkflowResult,
)


class WorkflowType(Enum):
    CRITICAL_INSPECTION = "critical_inspection"
    ROUTINE_MONITOR = "routine_monitor"
    ANOMALY_INVESTIGATION = "anomaly_investigation"
    EMERGENCY_ISOLATION = "emergency_isolation"
    MAINTENANCE_RESET = "maintenance_reset"


@dataclass
class WorkflowDefinition:
    workflow_id: WorkflowType
    name: str
    description: str
    steps: List[WorkflowStep]
    timeout_ms: int = 30000
    allow_parallel: bool = False


class IndustrialWorkflows:
    CRITICAL_INSPECTION_WORKFLOW = WorkflowDefinition(
        workflow_id=WorkflowType.CRITICAL_INSPECTION,
        name="Critical Inspection Workflow",
        description="High-priority inspection and assessment for critical anomalies",
        steps=[
            WorkflowStep(
                step_id="inspect_machine",
                action_type="inspect",
                params={"inspection_level": "detailed"},
                required=True,
            ),
            WorkflowStep(
                step_id="monitor_metrics",
                action_type="monitor",
                params={"metric": "vibration", "duration_seconds": 120},
                depends_on=["inspect_machine"],
                required=True,
            ),
            WorkflowStep(
                step_id="classify_severity",
                action_type="classify",
                params={"context": "inspection_results"},
                depends_on=["inspect_machine", "monitor_metrics"],
                required=True,
            ),
            WorkflowStep(
                step_id="log_inspection",
                action_type="log",
                params={"level": "warning", "component": "inspection"},
                depends_on=["classify_severity"],
                required=True,
            ),
            WorkflowStep(
                step_id="dispatch_alert",
                action_type="alert",
                params={"severity": "high"},
                depends_on=["log_inspection"],
                required=True,
            ),
        ],
        timeout_ms=45000,
    )

    ROUTINE_MONITOR_WORKFLOW = WorkflowDefinition(
        workflow_id=WorkflowType.ROUTINE_MONITOR,
        name="Routine Monitoring Workflow",
        description="Standard monitoring and logging workflow",
        steps=[
            WorkflowStep(
                step_id="collect_metrics",
                action_type="monitor",
                params={"metric": "all", "duration_seconds": 60},
                required=True,
            ),
            WorkflowStep(
                step_id="log_status",
                action_type="log",
                params={"level": "info", "component": "monitoring"},
                depends_on=["collect_metrics"],
                required=True,
            ),
        ],
        timeout_ms=15000,
    )

    ANOMALY_INVESTIGATION_WORKFLOW = WorkflowDefinition(
        workflow_id=WorkflowType.ANOMALY_INVESTIGATION,
        name="Anomaly Investigation Workflow",
        description="Multi-stage investigation of detected anomalies",
        steps=[
            WorkflowStep(
                step_id="inspect_target",
                action_type="inspect",
                params={"inspection_level": "comprehensive"},
                required=True,
            ),
            WorkflowStep(
                step_id="monitor_primary",
                action_type="monitor",
                params={"metric": "vibration", "duration_seconds": 180},
                depends_on=["inspect_target"],
                required=True,
            ),
            WorkflowStep(
                step_id="monitor_secondary",
                action_type="monitor",
                params={"metric": "temperature", "duration_seconds": 180},
                depends_on=["inspect_target"],
                required=False,
            ),
            WorkflowStep(
                step_id="classify_anomaly",
                action_type="classify",
                params={"context": "multi_metric"},
                depends_on=["monitor_primary", "monitor_secondary"],
                required=True,
            ),
            WorkflowStep(
                step_id="log_investigation",
                action_type="log",
                params={"level": "warning", "component": "investigation"},
                depends_on=["classify_anomaly"],
                required=True,
            ),
            WorkflowStep(
                step_id="dispatch_investigation_alert",
                action_type="alert",
                params={"severity": "medium"},
                depends_on=["log_investigation"],
                required=True,
            ),
        ],
        timeout_ms=60000,
    )

    EMERGENCY_ISOLATION_WORKFLOW = WorkflowDefinition(
        workflow_id=WorkflowType.EMERGENCY_ISOLATION,
        name="Emergency Isolation Workflow",
        description="Immediate isolation of faulty equipment",
        steps=[
            WorkflowStep(
                step_id="isolate_machine",
                action_type="isolate",
                params={"reason": "emergency"},
                required=True,
            ),
            WorkflowStep(
                step_id="log_emergency",
                action_type="log",
                params={"level": "critical", "component": "emergency"},
                depends_on=["isolate_machine"],
                required=True,
            ),
            WorkflowStep(
                step_id="dispatch_emergency_alert",
                action_type="alert",
                params={"severity": "critical"},
                depends_on=["log_emergency"],
                required=True,
            ),
        ],
        timeout_ms=5000,
    )

    MAINTENANCE_RESET_WORKFLOW = WorkflowDefinition(
        workflow_id=WorkflowType.MAINTENANCE_RESET,
        name="Maintenance Reset Workflow",
        description="Safe reset after maintenance completion",
        steps=[
            WorkflowStep(
                step_id="verify_maintenance",
                action_type="inspect",
                params={"inspection_level": "basic", "checklist": "maintenance"},
                required=True,
            ),
            WorkflowStep(
                step_id="reset_equipment",
                action_type="reset",
                params={"reset_type": "soft"},
                depends_on=["verify_maintenance"],
                required=True,
            ),
            WorkflowStep(
                step_id="log_reset",
                action_type="log",
                params={"level": "info", "component": "maintenance"},
                depends_on=["reset_equipment"],
                required=True,
            ),
            WorkflowStep(
                step_id="confirm_operational",
                action_type="monitor",
                params={"metric": "status", "duration_seconds": 30},
                depends_on=["log_reset"],
                required=True,
            ),
        ],
        timeout_ms=20000,
    )

    @classmethod
    def get_workflow(cls, workflow_type: WorkflowType) -> WorkflowDefinition:
        workflows = {
            WorkflowType.CRITICAL_INSPECTION: cls.CRITICAL_INSPECTION_WORKFLOW,
            WorkflowType.ROUTINE_MONITOR: cls.ROUTINE_MONITOR_WORKFLOW,
            WorkflowType.ANOMALY_INVESTIGATION: cls.ANOMALY_INVESTIGATION_WORKFLOW,
            WorkflowType.EMERGENCY_ISOLATION: cls.EMERGENCY_ISOLATION_WORKFLOW,
            WorkflowType.MAINTENANCE_RESET: cls.MAINTENANCE_RESET_WORKFLOW,
        }
        return workflows.get(workflow_type) or cls.CRITICAL_INSPECTION_WORKFLOW


class WorkflowExecutor:
    def __init__(self, sandbox: Optional[Sandbox] = None):
        self.sandbox = sandbox or Sandbox(mode=SandboxMode.SAFE, timeout_ms=30000)
        self.engine = BoundedWorkflowEngine(self.sandbox)
        self._register_all_workflows()

    def _register_all_workflows(self):
        for workflow_type in WorkflowType:
            definition = IndustrialWorkflows.get_workflow(workflow_type)
            if definition:
                self.engine.register_workflow(
                    definition.workflow_id.value, definition.steps
                )

    async def execute(
        self,
        workflow_type: WorkflowType,
        context: Dict[str, Any],
        trace_id: Optional[str] = None,
    ) -> WorkflowResult:
        return await self.engine.execute_workflow(
            workflow_type.value, context, trace_id
        )

    def get_available_workflows(self) -> List[Dict[str, str]]:
        return [{"id": wt.value, "name": wt.name} for wt in WorkflowType]

    def get_trace(self, trace_id: str):
        return self.sandbox.get_trace(trace_id)

    def get_all_traces(self):
        return self.sandbox.get_all_traces()


def select_workflow(priority_score: float, severity: str, urgency: str) -> WorkflowType:
    if urgency == "critical" or priority_score > 0.85:
        return WorkflowType.EMERGENCY_ISOLATION
    if priority_score > 0.7 or severity == "high":
        return WorkflowType.CRITICAL_INSPECTION
    if severity in ("medium", "low") and urgency != "high":
        return WorkflowType.ANOMALY_INVESTIGATION
    return WorkflowType.ROUTINE_MONITOR
