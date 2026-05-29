import time

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
        t_start = time.perf_counter()

        t0 = time.perf_counter()
        features = self.feature_engine.extract(event)
        t_feat = (time.perf_counter() - t0) * 1000

        t0 = time.perf_counter()
        assessment = self.anomaly_detector.assess(features)
        t_assess = (time.perf_counter() - t0) * 1000

        t0 = time.perf_counter()
        # Case replay must be a pure function of the stored event snapshot.
        # Multi-event reasoning is handled by session/batch graph paths, not hidden process memory.
        case = DecisionPrioritizationEngine().prioritize(event, assessment)
        t_prior = (time.perf_counter() - t0) * 1000

        t0 = time.perf_counter()
        decision = self.decision_engine.resolve(case)
        t_dec = (time.perf_counter() - t0) * 1000

        t0 = time.perf_counter()
        execution = self.dispatcher.dispatch(case, decision)
        t_exec = (time.perf_counter() - t0) * 1000

        t0 = time.perf_counter()
        consequence = self.consequence_calculator.calculate(case, decision, assessment, event)
        t_cons = (time.perf_counter() - t0) * 1000

        t0 = time.perf_counter()
        audit = self.audit_recorder.record(
            event=event,
            features=features,
            assessment=assessment,
            case=case,
            decision=decision,
            execution=execution,
            consequence=consequence.to_dict(),
        )
        t_audit = (time.perf_counter() - t0) * 1000

        t_total = (time.perf_counter() - t_start) * 1000

        timings = {
            "event_capture": 0.01,  # simulated low capture delay
            "normalization": 0.02,  # simulated low normalisation delay
            "feature_extraction": round(t_feat, 4),
            "anomaly_scoring": round(t_assess, 4),
            "prioritization": round(t_prior, 4),
            "decision_dispatch": round(t_dec + t_exec, 4),
            "audit_proof": round(t_audit + t_cons, 4),
            "total": round(t_total + 0.03, 4),
        }

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
            provenance="real",
            stage_timings=timings,
        )
