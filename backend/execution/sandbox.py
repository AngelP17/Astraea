import asyncio
import hashlib
import re
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any


class SandboxMode(Enum):
    SAFE = "safe"
    STRICT = "strict"
    PERMISSIVE = "permissive"


class ExecutionResult(Enum):
    SUCCESS = "success"
    REJECTED = "rejected"
    TIMEOUT = "timeout"
    ERROR = "error"


@dataclass
class SandboxAction:
    action_type: str
    params: dict[str, Any]
    result: Any | None = None
    execution_time_ms: float = 0.0
    result_type: ExecutionResult = ExecutionResult.SUCCESS
    error_message: str | None = None


@dataclass
class SandboxTrace:
    trace_id: str
    actions: list[SandboxAction] = field(default_factory=list)
    start_time: datetime = field(default_factory=lambda: datetime.now(UTC))
    end_time: datetime | None = None
    total_time_ms: float = 0.0

    def add_action(self, action: SandboxAction):
        self.actions.append(action)

    def finalize(self):
        self.end_time = datetime.now(UTC)
        self.total_time_ms = sum(a.execution_time_ms for a in self.actions)


class Sandbox:
    ALLOWED_ACTION_TYPES = {
        "inspect",
        "monitor",
        "log",
        "alert",
        "isolate",
        "reset",
        "scale",
        "configure",
        "validate",
        "classify",
    }

    DENIED_PATTERNS = [
        r"__import__",
        r"exec\(",
        r"eval\(",
        r"open\(",
        r"subprocess",
        r"os\.system",
        r"rm\s+-rf",
        r"drop\s+table",
        r"delete\s+from",
        r"truncate",
        r"shutdown",
        r"reboot",
    ]

    def __init__(self, mode: SandboxMode = SandboxMode.SAFE, timeout_ms: int = 5000):
        self.mode = mode
        self.timeout_ms = timeout_ms
        self._traces: dict[str, SandboxTrace] = {}

    def _validate_action(
        self, action_type: str, params: dict[str, Any]
    ) -> tuple[bool, str | None]:
        if action_type not in self.ALLOWED_ACTION_TYPES:
            return (
                False,
                f"Action type '{action_type}' not allowed. Allowed: {self.ALLOWED_ACTION_TYPES}",
            )

        for pattern in self.DENIED_PATTERNS:
            param_str = str(params)
            if re.search(pattern, param_str, re.IGNORECASE):
                return False, f"Action contains forbidden pattern: {pattern}"

        return True, None

    def _execute_action_internal(
        self, action_type: str, params: dict[str, Any], handler: Callable
    ) -> SandboxAction:
        start = time.perf_counter()
        action = SandboxAction(action_type=action_type, params=params)

        valid, error = self._validate_action(action_type, params)
        if not valid:
            action.result_type = ExecutionResult.REJECTED
            action.error_message = error
            action.execution_time_ms = (time.perf_counter() - start) * 1000
            return action

        try:
            result = handler(params)
            action.result = result
            action.result_type = ExecutionResult.SUCCESS
        except Exception as e:
            action.result_type = ExecutionResult.ERROR
            action.error_message = str(e)

        action.execution_time_ms = (time.perf_counter() - start) * 1000
        return action

    async def execute_action(
        self, trace_id: str, action_type: str, params: dict[str, Any], handler: Callable
    ) -> SandboxAction:
        if trace_id not in self._traces:
            self._traces[trace_id] = SandboxTrace(trace_id=trace_id)

        async def async_handler(p):
            if asyncio.iscoroutinefunction(handler):
                return await handler(p)
            return handler(p)

        action = await asyncio.wait_for(
            asyncio.to_thread(
                self._execute_action_internal, action_type, params, async_handler
            ),
            timeout=self.timeout_ms / 1000.0,
        )

        self._traces[trace_id].add_action(action)
        return action

    def get_trace(self, trace_id: str) -> SandboxTrace | None:
        trace = self._traces.get(trace_id)
        if trace:
            trace.finalize()
        return trace

    def get_all_traces(self) -> list[SandboxTrace]:
        for trace in self._traces.values():
            trace.finalize()
        return list(self._traces.values())

    def clear_traces(self):
        self._traces.clear()


class ActionHandlers:
    @staticmethod
    def handle_inspect(params: dict[str, Any]) -> dict[str, Any]:
        machine_id = params.get("machine_id")
        return {
            "machine_id": machine_id,
            "status": "operational",
            "last_inspection": datetime.now(UTC).isoformat(),
        }

    @staticmethod
    def handle_monitor(params: dict[str, Any]) -> dict[str, Any]:
        metric = params.get("metric")
        duration = params.get("duration_seconds", 60)
        return {
            "metric": metric,
            "samples": int(duration / 5),
            "avg_value": 0.0,
            "max_value": 0.0,
            "min_value": 0.0,
        }

    @staticmethod
    def handle_log(params: dict[str, Any]) -> dict[str, Any]:
        message = params.get("message", "")
        level = params.get("level", "info")
        return {
            "logged": True,
            "message_id": hashlib.sha256(message.encode()).hexdigest()[:8],
            "level": level,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    @staticmethod
    def handle_alert(params: dict[str, Any]) -> dict[str, Any]:
        severity = params.get("severity", "medium")
        target = params.get("target")
        return {
            "alert_id": hashlib.sha256(f"{target}{severity}".encode()).hexdigest()[:8],
            "dispatched": True,
            "severity": severity,
        }

    @staticmethod
    def handle_isolate(params: dict[str, Any]) -> dict[str, Any]:
        machine_id = params.get("machine_id")
        return {
            "machine_id": machine_id,
            "isolated": True,
            "isolation_reason": params.get("reason", "maintenance"),
        }

    @staticmethod
    def handle_reset(params: dict[str, Any]) -> dict[str, Any]:
        machine_id = params.get("machine_id")
        return {
            "machine_id": machine_id,
            "reset": True,
            "reset_type": params.get("reset_type", "soft"),
        }

    @staticmethod
    def handle_classify(params: dict[str, Any]) -> dict[str, Any]:
        severity = params.get("severity", "low")
        confidence = params.get("confidence", 0.5)
        return {
            "classification": severity,
            "confidence": confidence,
            "label": f"{severity}_{int(confidence * 100)}",
        }

    @staticmethod
    def handle_unknown_action(action_type: str) -> Callable[[dict[str, Any]], dict[str, Any]]:
        def _handler(_: dict[str, Any]) -> dict[str, Any]:
            return {"error": f"Unknown action: {action_type}"}

        return _handler


@dataclass
class WorkflowStep:
    step_id: str
    action_type: str
    params: dict[str, Any]
    depends_on: list[str] = field(default_factory=list)
    required: bool = True
    retry_count: int = 0
    max_retries: int = 3


@dataclass
class WorkflowResult:
    workflow_id: str
    success: bool
    steps_completed: int
    steps_failed: int
    results: dict[str, Any]
    trace: SandboxTrace


class BoundedWorkflowEngine:
    def __init__(self, sandbox: Sandbox | None = None):
        self.sandbox = sandbox or Sandbox()
        self.handlers = ActionHandlers()
        self._workflow_registry: dict[str, list[WorkflowStep]] = {}

    def register_workflow(self, workflow_id: str, steps: list[WorkflowStep]):
        self._workflow_registry[workflow_id] = steps

    async def execute_workflow(
        self,
        workflow_id: str,
        context: dict[str, Any],
        trace_id: str | None = None,
    ) -> WorkflowResult:
        if workflow_id not in self._workflow_registry:
            return WorkflowResult(
                workflow_id=workflow_id,
                success=False,
                steps_completed=0,
                steps_failed=0,
                results={},
                trace=SandboxTrace(trace_id=trace_id or "unknown"),
            )

        trace_id = trace_id or f"wf_{workflow_id}_{int(time.time() * 1000)}"
        steps = self._workflow_registry[workflow_id]
        results: dict[str, Any] = {}
        steps_completed = 0
        steps_failed = 0

        completed_ids: set = set()

        for step in steps:
            if step.depends_on and not all(
                dep in completed_ids for dep in step.depends_on
            ):
                continue

            handler = getattr(self.handlers, f"handle_{step.action_type}", None)
            if not handler:
                action_type = step.action_type

                def handler(
                    _: dict[str, Any],
                    action_type: str = action_type,
                ) -> dict[str, Any]:
                    return {"error": f"Unknown action: {action_type}"}

            action = await self.sandbox.execute_action(
                trace_id, step.action_type, {**step.params, **context}, handler
            )

            if action.result_type == ExecutionResult.SUCCESS:
                results[step.step_id] = action.result
                completed_ids.add(step.step_id)
                steps_completed += 1
            else:
                steps_failed += 1
                if step.required:
                    results[step.step_id] = {"error": action.error_message}

        trace = self.sandbox.get_trace(trace_id)
        return WorkflowResult(
            workflow_id=workflow_id,
            success=steps_failed == 0,
            steps_completed=steps_completed,
            steps_failed=steps_failed,
            results=results,
            trace=trace or SandboxTrace(trace_id=trace_id),
        )

    def get_registered_workflows(self) -> list[str]:
        return list(self._workflow_registry.keys())
