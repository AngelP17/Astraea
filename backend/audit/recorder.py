from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime

from backend.shared.schemas import (
    AuditRecord,
    Decision,
    Event,
    ExecutionPlan,
    FeatureVector,
    ModelAssessment,
    PrioritizedCase,
)


class AuditRecorder:
    def __init__(self) -> None:
        self.records: list[AuditRecord] = []

    def record(
        self,
        event: Event,
        features: FeatureVector,
        assessment: ModelAssessment,
        case: PrioritizedCase,
        decision: Decision,
        execution: ExecutionPlan,
        consequence: dict | None = None,
    ) -> AuditRecord:
        event_snapshot = event.to_dict()
        feature_snapshot = features.to_dict()
        model_snapshot = assessment.to_dict()
        prioritization_snapshot = case.to_dict()
        decision_snapshot = decision.to_dict()
        execution_snapshot = execution.to_dict()
        consequence_snapshot = consequence or {}

        stage_hashes = {
            "event": self._hash_single_payload(event_snapshot),
            "features": self._hash_single_payload(feature_snapshot),
            "assessment": self._hash_single_payload(model_snapshot),
            "prioritization": self._hash_single_payload(prioritization_snapshot),
            "decision": self._hash_single_payload(decision_snapshot),
            "execution": self._hash_single_payload(execution_snapshot),
            "consequence": self._hash_single_payload(consequence_snapshot),
        }

        deterministic_hash = self._hash_payload(
            event_snapshot=event_snapshot,
            feature_snapshot=feature_snapshot,
            model_snapshot=model_snapshot,
            prioritization_snapshot=prioritization_snapshot,
            decision_snapshot=decision_snapshot,
            execution_snapshot=execution_snapshot,
            consequence_snapshot=consequence_snapshot,
        )

        record = AuditRecord(
            case_id=case.case_id,
            event_snapshot=event_snapshot,
            feature_snapshot=feature_snapshot,
            model_snapshot=model_snapshot,
            prioritization_snapshot=prioritization_snapshot,
            decision_snapshot=decision_snapshot,
            execution_snapshot=execution_snapshot,
            consequence_snapshot=consequence_snapshot,
            deterministic_hash=deterministic_hash,
            timestamp=datetime.now(UTC),
            stage_hashes=stage_hashes,
        )
        self.records.append(record)
        return record

    def get_all(self) -> list[AuditRecord]:
        return self.records

    def get_by_case(self, case_id: str) -> AuditRecord | None:
        for record in self.records:
            if record.case_id == case_id:
                return record
        return None

    def _hash_single_payload(self, payload: dict) -> str:
        stable_json = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(stable_json.encode("utf-8")).hexdigest()

    def _hash_payload(self, **payload: dict) -> str:
        stable_json = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(stable_json.encode("utf-8")).hexdigest()
