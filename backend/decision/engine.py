from backend.shared.schemas import PrioritizedCase, Decision


class DecisionEngine:
    def resolve(self, case: PrioritizedCase) -> Decision:
        recommendation, urgency, next_steps = self._map_action(case)

        return Decision(
            case_id=case.case_id,
            recommendation=recommendation,
            urgency=urgency,
            owner=None,
            justification=case.rationale,
            next_steps=next_steps,
        )

    def _map_action(self, case: PrioritizedCase):
        if case.priority_score > 0.8:
            return (
                "Immediate inspection required",
                "critical",
                [
                    "Dispatch maintenance team now",
                    "Isolate machine if safety threshold breached",
                    "Log incident in CMMS",
                ],
            )
        if case.priority_score > 0.6:
            return (
                "Inspect within 1 hour",
                "high",
                [
                    "Schedule technician visit",
                    "Monitor sensor feed for escalation",
                    "Prepare replacement parts",
                ],
            )
        return (
            "Monitor — no immediate action",
            "low",
            [
                "Continue passive monitoring",
                "Review in next scheduled maintenance window",
            ],
        )
