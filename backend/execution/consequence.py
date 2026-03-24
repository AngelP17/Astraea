from __future__ import annotations

from typing import Dict, List

from backend.shared.schemas import (
    DecisionConsequence,
    PrioritizedCase,
    Decision,
    ModelAssessment,
    Event,
)


class ConsequenceCalculator:
    SEVERITY_COSTS = {
        "critical": {"downtime_minutes": 45, "cost_usd": 15000, "mtbf_impact": 24},
        "high": {"downtime_minutes": 20, "cost_usd": 5000, "mtbf_impact": 8},
        "medium": {"downtime_minutes": 8, "cost_usd": 1500, "mtbf_impact": 2},
        "low": {"downtime_minutes": 2, "cost_usd": 200, "mtbf_impact": 0.5},
    }

    EVENT_TYPE_IMPACT = {
        "stoppage": {"safety": "HIGH", "production": "CRITICAL"},
        "vibration_spike": {"safety": "MEDIUM", "production": "HIGH"},
        "temperature_rise": {"safety": "HIGH", "production": "MEDIUM"},
        "pressure_anomaly": {"safety": "MEDIUM", "production": "MEDIUM"},
        "current_surge": {"safety": "LOW", "production": "HIGH"},
    }

    def calculate(
        self,
        case: PrioritizedCase,
        decision: Decision,
        assessment: ModelAssessment,
        event: Event,
    ) -> DecisionConsequence:
        severity = case.severity
        costs = self.SEVERITY_COSTS.get(severity, self.SEVERITY_COSTS["low"])

        downtime_avoided = self._calculate_downtime_avoided(severity, assessment, event)

        risk_level = self._calculate_risk_level(severity, assessment, event)

        escalation_required = self._calculate_escalation(severity, case, assessment)

        safety_impact, production_impact = self._get_impacts(event.event_type)

        cost_estimate = self._estimate_cost(severity, event, case, assessment)

        mtbf_impact = self._calculate_mtbf_impact(severity, event, case)

        reasoning = self._build_reasoning(
            severity,
            downtime_avoided,
            risk_level,
            escalation_required,
            safety_impact,
            production_impact,
        )

        return DecisionConsequence(
            case_id=case.case_id,
            downtime_avoided_minutes=round(downtime_avoided, 1),
            risk_level=risk_level,
            escalation_required=escalation_required,
            safety_impact=safety_impact,
            production_impact=production_impact,
            cost_estimate_usd=round(cost_estimate, 0),
            mtbf_impact_hours=round(mtbf_impact, 1),
            reasoning=reasoning,
        )

    def _calculate_downtime_avoided(
        self,
        severity: str,
        assessment: ModelAssessment,
        event: Event,
    ) -> float:
        base = self.SEVERITY_COSTS.get(severity, {}).get("downtime_minutes", 2)

        if assessment.anomaly_score > 0.7:
            base *= 1.3

        if event.event_type == "stoppage":
            base *= 1.5

        if "duration_seconds" in event.metadata:
            duration = float(event.metadata["duration_seconds"])
            if duration > 300:
                base *= 1.2

        return min(base * 0.9, base)

    def _calculate_risk_level(
        self,
        severity: str,
        assessment: ModelAssessment,
        event: Event,
    ) -> str:
        if severity == "critical" or assessment.anomaly_score > 0.85:
            return "CRITICAL"
        if severity == "high" or assessment.anomaly_score > 0.6:
            return "HIGH"
        if severity == "medium" or assessment.anomaly_score > 0.4:
            return "MODERATE"
        return "LOW"

    def _calculate_escalation(
        self,
        severity: str,
        case: PrioritizedCase,
        assessment: ModelAssessment,
    ) -> bool:
        if severity == "critical":
            return True
        if severity == "high" and case.review_required:
            return True
        if assessment.uncertainty_high - assessment.uncertainty_low > 0.3:
            return True
        if case.routing_bucket == "human_review":
            return True
        return False

    def _get_impacts(self, event_type: str) -> tuple:
        impacts = self.EVENT_TYPE_IMPACT.get(event_type, {"safety": "LOW", "production": "LOW"})
        return impacts["safety"], impacts["production"]

    def _estimate_cost(
        self,
        severity: str,
        event: Event,
        case: PrioritizedCase,
        assessment: ModelAssessment,
    ) -> float:
        base = self.SEVERITY_COSTS.get(severity, {}).get("cost_usd", 200)

        if event.event_type == "stoppage":
            base *= 2.0
        elif event.event_type == "vibration_spike":
            base *= 1.3

        if "repeat_count" in event.metadata:
            base *= 1 + 0.2 * int(event.metadata.get("repeat_count", 0))

        return base

    def _calculate_mtbf_impact(
        self,
        severity: str,
        event: Event,
        case: PrioritizedCase,
    ) -> float:
        base = self.SEVERITY_COSTS.get(severity, {}).get("mtbf_impact", 0.5)

        if case.routing_bucket in {"incident_now", "maintenance_priority"}:
            base *= 1.5

        return base

    def _build_reasoning(
        self,
        severity: str,
        downtime: float,
        risk: str,
        escalation: bool,
        safety: str,
        production: str,
    ) -> List[str]:
        reasons = []

        reasons.append(f"Based on {severity} severity classification")

        if downtime > 30:
            reasons.append(f"Potential downtime avoided: {downtime:.0f} minutes")
        elif downtime > 10:
            reasons.append(f"Estimated downtime avoided: {downtime:.0f} minutes")

        if risk == "CRITICAL":
            reasons.append("Critical risk level requires immediate attention")
        elif risk == "HIGH":
            reasons.append("Elevated risk warrants proactive inspection")

        if escalation:
            reasons.append("Escalation triggered per safety protocol")

        if safety == "HIGH":
            reasons.append("Safety impact: HIGH - personnel risk present")

        if production == "CRITICAL":
            reasons.append("Production impact: CRITICAL - line stoppage imminent")

        return reasons
