from __future__ import annotations

from backend.audit.recorder import AuditRecorder
from backend.decision.engine import DecisionEngine
from backend.decision.prioritizer import DecisionPrioritizationEngine
from backend.execution.consequence import ConsequenceCalculator
from backend.execution.dispatcher import ExecutionDispatcher
from backend.ml.anomaly_detector import AnomalyDetector
from backend.pipeline.feature_engine import FeatureEngine
from backend.shared.schemas import Event, PipelineResult


class AstraeaPipeline:
    def __init__(self) -> None:
        self.feature_engine = FeatureEngine()
        self.anomaly_detector = AnomalyDetector()
        self.prioritizer = DecisionPrioritizationEngine()
        self.decision_engine = DecisionEngine()
        self.dispatcher = ExecutionDispatcher()
        self.audit_recorder = AuditRecorder()
        self.consequence_calculator = ConsequenceCalculator()

    def process(self, event: Event) -> PipelineResult:
        features = self.feature_engine.extract(event)
        assessment = self.anomaly_detector.assess(features)
        case = self.prioritizer.prioritize(event, assessment)
        decision = self.decision_engine.resolve(case)
        execution = self.dispatcher.dispatch(case, decision)
        consequence = self.consequence_calculator.calculate(case, decision, assessment, event)
        audit = self.audit_recorder.record(
            event=event,
            features=features,
            assessment=assessment,
            case=case,
            decision=decision,
            execution=execution,
        )

        return PipelineResult(
            event_id=event.event_id,
            case_id=case.case_id,
            event=event.to_dict(),
            features=features.to_dict(),
            assessment=assessment.to_dict(),
            prioritized_case=case.to_dict(),
            decision=decision.to_dict(),
            execution=execution.to_dict(),
            consequence=consequence.to_dict(),
            audit=audit.to_dict(),
        )
