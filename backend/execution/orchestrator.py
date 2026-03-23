import asyncio
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

from backend.shared.schemas import (
    Event,
    FeatureVector,
    ModelAssessment,
    PrioritizedCase,
    Decision,
)


class ExecutionMode(Enum):
    SPEED = "speed"
    BALANCED = "balanced"
    QUALITY = "quality"


class ExecutionStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"


@dataclass
class ExecutionStep:
    step_id: str
    step_type: str
    description: str
    status: ExecutionStatus
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@dataclass
class SubAgentOutcome:
    role: str
    completed: bool
    iteration_limit_reached: bool
    had_tool_errors: bool
    created_paths: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    successful_tools: List[str] = field(default_factory=list)


@dataclass
class ExecutionOutcome:
    success: bool
    had_warnings: bool
    created_artifacts: List[str]
    summary: str
    error_message: Optional[str] = None
    agent_outcomes: List[SubAgentOutcome] = field(default_factory=list)


class ExecutionEngine:
    ITERATION_LIMITS = {
        ExecutionMode.SPEED: 3,
        ExecutionMode.BALANCED: 5,
        ExecutionMode.QUALITY: 7,
    }

    def __init__(self, mode: ExecutionMode = ExecutionMode.BALANCED):
        self.mode = mode
        self.execution_history: List[ExecutionStep] = []

    def _get_iteration_limit(self) -> int:
        return self.ITERATION_LIMITS.get(self.mode, 5)

    async def execute_pipeline(
        self,
        event: Event,
        feature_vector: FeatureVector,
        assessment: ModelAssessment,
        case: PrioritizedCase,
        decision: Decision,
    ) -> ExecutionOutcome:
        steps = []
        artifacts = []

        step = ExecutionStep(
            step_id=str(uuid.uuid4()),
            step_type="pipeline_init",
            description=f"Initiating execution pipeline for case {case.case_id}",
            status=ExecutionStatus.RUNNING,
        )
        steps.append(step)

        try:
            ingestion_step = await self._execute_ingestion(event)
            steps.append(ingestion_step)
            if ingestion_step.error and ingestion_step.result:
                artifacts.extend(ingestion_step.result.get("artifacts", []))

            feature_step = await self._execute_feature_pipeline(feature_vector)
            steps.append(feature_step)
            if feature_step.result:
                artifacts.extend(feature_step.result.get("artifacts", []))

            ml_step = await self._execute_ml_assessment(assessment)
            steps.append(ml_step)

            decision_step = await self._execute_decision_resolution(decision)
            steps.append(decision_step)

            audit_step = await self._execute_audit_record(case, decision)
            steps.append(audit_step)

            all_completed = all(s.status == ExecutionStatus.COMPLETED for s in steps)
            any_had_errors = any(s.error for s in steps)

            return ExecutionOutcome(
                success=all_completed,
                had_warnings=any_had_errors,
                created_artifacts=artifacts,
                summary=self._build_summary(steps, case),
                agent_outcomes=[],
            )

        except Exception as e:
            return ExecutionOutcome(
                success=False,
                had_warnings=True,
                created_artifacts=artifacts,
                summary=f"Execution pipeline failed: {str(e)}",
                error_message=str(e),
            )

    async def _execute_ingestion(self, event: Event) -> ExecutionStep:
        step = ExecutionStep(
            step_id=str(uuid.uuid4()),
            step_type="ingestion",
            description=f"Ingesting event {event.event_id}",
            status=ExecutionStatus.RUNNING,
        )

        try:
            await asyncio.sleep(0.01)

            result = {
                "event_id": event.event_id,
                "machine_id": event.machine_id,
                "raw_values_count": len(event.raw_values),
                "artifacts": [],
            }

            step.status = ExecutionStatus.COMPLETED
            step.result = result

        except Exception as e:
            step.status = ExecutionStatus.FAILED
            step.error = str(e)

        return step

    async def _execute_feature_pipeline(self, fv: FeatureVector) -> ExecutionStep:
        step = ExecutionStep(
            step_id=str(uuid.uuid4()),
            step_type="feature_engineering",
            description=f"Extracting features for event {fv.event_id}",
            status=ExecutionStatus.RUNNING,
        )

        try:
            await asyncio.sleep(0.01)

            result = {
                "event_id": fv.event_id,
                "feature_count": len(fv.features),
                "context_keys": list(fv.context.keys()),
                "artifacts": [],
            }

            step.status = ExecutionStatus.COMPLETED
            step.result = result

        except Exception as e:
            step.status = ExecutionStatus.FAILED
            step.error = str(e)

        return step

    async def _execute_ml_assessment(
        self, assessment: ModelAssessment
    ) -> ExecutionStep:
        step = ExecutionStep(
            step_id=str(uuid.uuid4()),
            step_type="ml_assessment",
            description=f"Running ML assessment for event {assessment.event_id}",
            status=ExecutionStatus.RUNNING,
        )

        try:
            await asyncio.sleep(0.01)

            result = {
                "event_id": assessment.event_id,
                "anomaly_score": assessment.anomaly_score,
                "failure_probability": assessment.failure_probability,
                "confidence": assessment.confidence,
                "model_version": assessment.model_version,
            }

            step.status = ExecutionStatus.COMPLETED
            step.result = result

        except Exception as e:
            step.status = ExecutionStatus.FAILED
            step.error = str(e)

        return step

    async def _execute_decision_resolution(self, decision: Decision) -> ExecutionStep:
        step = ExecutionStep(
            step_id=str(uuid.uuid4()),
            step_type="decision_resolution",
            description=f"Resolving decision for case {decision.case_id}",
            status=ExecutionStatus.RUNNING,
        )

        try:
            await asyncio.sleep(0.01)

            result = {
                "case_id": decision.case_id,
                "recommendation": decision.recommendation,
                "urgency": decision.urgency,
                "next_steps": decision.next_steps,
            }

            step.status = ExecutionStatus.COMPLETED
            step.result = result

        except Exception as e:
            step.status = ExecutionStatus.FAILED
            step.error = str(e)

        return step

    async def _execute_audit_record(
        self, case: PrioritizedCase, decision: Decision
    ) -> ExecutionStep:
        step = ExecutionStep(
            step_id=str(uuid.uuid4()),
            step_type="audit_record",
            description=f"Recording audit trail for case {case.case_id}",
            status=ExecutionStatus.RUNNING,
        )

        try:
            await asyncio.sleep(0.01)

            result = {
                "case_id": case.case_id,
                "priority_score": case.priority_score,
                "recommendation": decision.recommendation,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            step.status = ExecutionStatus.COMPLETED
            step.result = result

        except Exception as e:
            step.status = ExecutionStatus.FAILED
            step.error = str(e)

        return step

    def _build_summary(self, steps: List[ExecutionStep], case: PrioritizedCase) -> str:
        completed = sum(1 for s in steps if s.status == ExecutionStatus.COMPLETED)
        failed = sum(1 for s in steps if s.status == ExecutionStatus.FAILED)
        total = len(steps)

        if failed == 0:
            return f"Execution completed successfully. {completed}/{total} steps completed for case {case.case_id}."

        return f"Execution completed with {failed} failure(s). {completed}/{total} steps completed for case {case.case_id}."


class MultiAgentOrchestrator:
    def __init__(self):
        self.engines: Dict[str, ExecutionEngine] = {
            "primary": ExecutionEngine(ExecutionMode.BALANCED),
            "fast": ExecutionEngine(ExecutionMode.SPEED),
            "thorough": ExecutionEngine(ExecutionMode.QUALITY),
        }
        self.execution_log: List[Dict[str, Any]] = []

    async def orchestrate(
        self,
        events: List[Event],
        pipeline_fn: Callable,
    ) -> List[ExecutionOutcome]:
        outcomes = []

        for event in events:
            outcome = await self._orchestrate_single(event, pipeline_fn)
            outcomes.append(outcome)
            self.execution_log.append(
                {
                    "event_id": event.event_id,
                    "outcome": outcome,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            )

        return outcomes

    async def _orchestrate_single(
        self,
        event: Event,
        pipeline_fn: Callable,
    ) -> ExecutionOutcome:
        engine = self.engines["primary"]

        try:
            result = await pipeline_fn(event)
            return result
        except Exception as e:
            return ExecutionOutcome(
                success=False,
                had_warnings=True,
                created_artifacts=[],
                summary=f"Orchestration failed: {str(e)}",
                error_message=str(e),
            )

    def get_execution_trace(self) -> List[Dict[str, Any]]:
        return self.execution_log
