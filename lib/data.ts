export interface PipelineResult {
  event_id: string;
  case_id: string;
  event: {
    event_id: string;
    machine_id: string;
    line_id: string;
    event_type: string;
    timestamp: string;
    raw_values: Record<string, number>;
    source: string;
    metadata: Record<string, unknown>;
  };
  features: {
    event_id: string;
    machine_id: string;
    timestamp: string;
    features: Record<string, number>;
    context: Record<string, unknown>;
  };
  assessment: {
    event_id: string;
    anomaly_score: number;
    failure_probability: number;
    confidence: number;
    uncertainty_low: number;
    uncertainty_high: number;
    model_version: string;
    top_features: string[];
    explanation_factors: string[];
  };
  prioritized_case: {
    case_id: string;
    event_id: string;
    priority_score: number;
    confidence_band: string;
    severity: string;
    rationale: string[];
    requires_action: boolean;
    review_required: boolean;
    routing_bucket: string;
  };
  decision: {
    case_id: string;
    recommendation: string;
    urgency: string;
    owner: string | null;
    justification: string[];
    next_steps: string[];
    action_plan: Array<{ step: string; status: string }>;
  };
  execution: {
    case_id: string;
    dispatch_status: string;
    assigned_team: string | null;
    commands: string[];
    notifications: string[];
  };
  audit: {
    case_id: string;
    event_snapshot: Record<string, unknown>;
    feature_snapshot: Record<string, unknown>;
    model_snapshot: Record<string, unknown>;
    prioritization_snapshot: Record<string, unknown>;
    decision_snapshot: Record<string, unknown>;
    execution_snapshot: Record<string, unknown>;
    deterministic_hash: string;
    timestamp: string;
  };
}

export const narrativeSteps = [
  {
    step: "01",
    title: "Ingestion",
    eyebrow: "EVENT_CAPTURE",
    description:
      "Raw telemetry enters a normalized contract. Source, machine, timestamp, and raw sensor values are converted into a stable event shape.",
    accent: "primary",
    metrics: ["SCHEMA_LOCKED", "SOURCE_VERIFIED", "TIMESTAMP_NORMALIZED"],
  },
  {
    step: "02",
    title: "Feature Engine",
    eyebrow: "STATE_EXTRACTION",
    description:
      "Threshold deltas, ratios, and contextual markers convert raw machine behavior into interpretable, bounded features.",
    accent: "secondary",
    metrics: ["THRESHOLD_DELTAS", "RATIO_SIGNALS", "MACHINE_CONTEXT"],
  },
  {
    step: "03",
    title: "Anomaly + Uncertainty",
    eyebrow: "MODEL_ASSESSMENT",
    description:
      "The scoring layer produces anomaly probability, failure likelihood, confidence, and uncertainty interval in a deterministic pass.",
    accent: "danger",
    metrics: ["ANOMALY_SCORE", "FAILURE_PROBABILITY", "UNCERTAINTY_INTERVAL"],
  },
  {
    step: "04",
    title: "Decision + Audit",
    eyebrow: "EXECUTION_RESOLUTION",
    description:
      "Operational priority, recommendation, execution plan, and audit hash are generated as one replayable decision bundle.",
    accent: "tertiary",
    metrics: ["ROUTING_BUCKET", "ACTION_PLAN", "DETERMINISTIC_HASH"],
  },
];

export const metrics = [
  {
    label: "Replay fidelity",
    value: "100%",
    hint: "same input, same outcome",
  },
  {
    label: "Core loop",
    value: "7",
    hint: "ingest → feature → score → decide",
  },
  {
    label: "Audit mode",
    value: "ON",
    hint: "hash-bound pipeline records",
  },
  {
    label: "Operating stance",
    value: "ZERO TRUST",
    hint: "human review under uncertainty",
  },
];

export const modules = [
  {
    name: "ASTRAEA",
    status: "FLAGSHIP_SYSTEM",
    description:
      "Deterministic explainable decision infrastructure for event-driven environments. Built for traceability, replay, and operational execution.",
    tags: ["Python", "TypeScript", "Tailwind", "Deterministic XAI"],
  },
  {
    name: "Audit Layer",
    status: "REPLAY_READY",
    description:
      "Decision bundles are stored as stable payloads with hash-verifiable snapshots across features, model output, prioritization, and execution.",
    tags: ["Hashing", "Replay", "Audit Trail"],
  },
  {
    name: "Decision Engine",
    status: "ACTIONABLE",
    description:
      "Outputs are not just scores. They become recommendations, urgency bands, routing buckets, and execution plans.",
    tags: ["Operational Priority", "Execution Planning", "Human Review"],
  },
];

export async function fetchCases(): Promise<PipelineResult[]> {
  try {
    const res = await fetch("/api/cases", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function runLivePipeline(): Promise<PipelineResult | null> {
  try {
    const res = await fetch("/api/run", {
      method: "POST",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function replayCase(caseId: string): Promise<PipelineResult | null> {
  try {
    const res = await fetch("/api/replay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}