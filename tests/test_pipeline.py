from backend.ingestion.normalizer import load_events
from backend.pipeline.feature_engine import FeatureEngine
from backend.ml.anomaly_detector import AnomalyDetector
from backend.decision.prioritizer import DecisionPrioritizationEngine
from backend.decision.engine import DecisionEngine
from backend.audit.recorder import AuditRecorder


def test_full_pipeline():
    events = load_events()
    assert len(events) == 3

    fe = FeatureEngine()
    ad = AnomalyDetector()
    dpe = DecisionPrioritizationEngine()
    de = DecisionEngine()
    rec = AuditRecorder()

    for event in events:
        fv = fe.extract(event)
        assert fv.event_id == event.event_id
        assert len(fv.features) > 0

        assessment = ad.assess(fv)
        assert 0.0 <= assessment.anomaly_score <= 1.0
        assert 0.0 <= assessment.failure_probability <= 1.0

        case = dpe.prioritize(event, assessment)
        assert case.priority_score >= 0.0
        assert isinstance(case.requires_action, bool)
        assert case.confidence_band in ("high", "medium", "low")
        assert case.severity in ("critical", "high", "medium", "low")

        decision = de.resolve(case)
        assert decision.case_id == case.case_id
        assert decision.recommendation
        assert decision.urgency in ("critical", "high", "low")

        audit = rec.record(event, fv, assessment, case, decision)
        assert audit.case_id == case.case_id

    assert len(rec.get_all()) == 3


def test_vibration_spike_has_high_severity():
    events = load_events()
    fe = FeatureEngine()
    ad = AnomalyDetector()
    dpe = DecisionPrioritizationEngine()

    vib_event = [e for e in events if e.event_type == "vibration_spike"][0]
    fv = fe.extract(vib_event)
    assessment = ad.assess(fv)
    case = dpe.prioritize(vib_event, assessment)

    assert case.priority_score > 0.5


def test_audit_recorder_get_by_case():
    events = load_events()
    fe = FeatureEngine()
    ad = AnomalyDetector()
    dpe = DecisionPrioritizationEngine()
    de = DecisionEngine()
    rec = AuditRecorder()

    event = events[0]
    fv = fe.extract(event)
    assessment = ad.assess(fv)
    case = dpe.prioritize(event, assessment)
    decision = de.resolve(case)
    rec.record(event, fv, assessment, case, decision)

    found = rec.get_by_case(case.case_id)
    assert found is not None
    assert found.case_id == case.case_id

    assert rec.get_by_case("nonexistent") is None
