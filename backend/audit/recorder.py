import json
from datetime import datetime, timezone
from dataclasses import asdict
from typing import List

from backend.shared.schemas import (
    Event,
    FeatureVector,
    ModelAssessment,
    PrioritizedCase,
    Decision,
    AuditRecord,
)


class AuditRecorder:
    def __init__(self):
        self.records: List[AuditRecord] = []

    def record(
        self,
        event: Event,
        features: FeatureVector,
        assessment: ModelAssessment,
        case: PrioritizedCase,
        decision: Decision,
    ) -> AuditRecord:
        rec = AuditRecord(
            case_id=case.case_id,
            event_snapshot=asdict(event),
            feature_snapshot=asdict(features),
            model_snapshot=asdict(assessment),
            prioritization_snapshot=asdict(case),
            decision_snapshot=asdict(decision),
            timestamp=datetime.now(timezone.utc),
        )
        self.records.append(rec)
        return rec

    def get_all(self) -> List[AuditRecord]:
        return self.records

    def get_by_case(self, case_id: str) -> AuditRecord | None:
        for r in self.records:
            if r.case_id == case_id:
                return r
        return None
