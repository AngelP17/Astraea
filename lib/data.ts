import { requestJson } from './api';

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
  consequence: {
    case_id: string;
    downtime_avoided_minutes: number;
    risk_level: string;
    escalation_required: boolean;
    safety_impact: string;
    production_impact: string;
    cost_estimate_usd: number;
    mtbf_impact_hours: number;
    reasoning: string[];
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
    return await requestJson<PipelineResult[]>('/api/cases', {
      cache: 'no-store',
    });
  } catch {
    return [];
  }
}

export async function runLivePipeline(): Promise<PipelineResult | null> {
  try {
    return await requestJson<PipelineResult>('/api/run', {
      method: "POST",
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

export async function replayCase(caseId: string): Promise<PipelineResult | null> {
  try {
    return await requestJson<PipelineResult>('/api/replay', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId }),
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

export interface DemoResult {
  count: number;
  results: PipelineResult[];
}

export type WalkthroughAccent = 'primary' | 'secondary' | 'danger' | 'tertiary';

export interface PipelineWalkthroughStep {
  id: string;
  step: string;
  title: string;
  eyebrow: string;
  accent: WalkthroughAccent;
  summary: string;
  metricLabel: string;
  metricValue: string;
  supportLabel: string;
  supportValue: string;
  bullets: string[];
  evidence: Array<{ label: string; value: string }>;
}

function toTitleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDecimal(value: number | undefined, digits = 3) {
  return typeof value === 'number' ? value.toFixed(digits) : 'n/a';
}

function formatPercent(value: number | undefined) {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : 'n/a';
}

function formatCurrency(value: number | undefined) {
  if (typeof value !== 'number') return 'n/a';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTimestamp(timestamp: string | undefined) {
  if (!timestamp) return 'waiting for timestamp';

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return timestamp;

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function placeholderSteps(): PipelineWalkthroughStep[] {
  return [
    {
      id: 'capture',
      step: '01',
      title: 'Event Capture',
      eyebrow: 'SIGNAL_ENTRY',
      accent: 'primary',
      summary: 'Sensor telemetry enters Astraea through a stable event contract before any downstream logic runs.',
      metricLabel: 'source',
      metricValue: 'awaiting live data',
      supportLabel: 'payload',
      supportValue: 'sensor readings pending',
      bullets: [
        'A machine event arrives with source, line, timestamp, and raw telemetry values.',
        'The event is locked to a deterministic schema before scoring begins.',
        'Every downstream decision inherits this exact input snapshot.',
      ],
      evidence: [
        { label: 'Machine', value: 'pending' },
        { label: 'Event Type', value: 'pending' },
        { label: 'Timestamp', value: 'pending' },
      ],
    },
    {
      id: 'normalize',
      step: '02',
      title: 'Normalization',
      eyebrow: 'CONTRACT_LOCK',
      accent: 'secondary',
      summary: 'Raw telemetry is converted into a canonical event shape so the same input always produces the same evaluation path.',
      metricLabel: 'contract',
      metricValue: 'schema locked',
      supportLabel: 'state',
      supportValue: 'context pending',
      bullets: [
        'Machine, line, source, and metadata fields are standardized.',
        'Time and source context are preserved for replay and traceability.',
        'The decision engine now has a clean, bounded input frame.',
      ],
      evidence: [
        { label: 'Line', value: 'pending' },
        { label: 'Sensor', value: 'pending' },
        { label: 'Location', value: 'pending' },
      ],
    },
    {
      id: 'feature',
      step: '03',
      title: 'Feature Extraction',
      eyebrow: 'STATE_EXTRACTION',
      accent: 'secondary',
      summary: 'Threshold deltas, ratios, and contextual markers are derived from the raw event so operators can inspect what drove the score.',
      metricLabel: 'features',
      metricValue: 'waiting',
      supportLabel: 'breaches',
      supportValue: 'pending',
      bullets: [
        'Signals are translated into interpretable deltas and ratios.',
        'Threshold breaches are marked explicitly instead of being hidden in a model.',
        'Context fields become explainable evidence for later stages.',
      ],
      evidence: [
        { label: 'Ratio Max', value: 'pending' },
        { label: 'Delta Max', value: 'pending' },
        { label: 'Duration', value: 'pending' },
      ],
    },
    {
      id: 'score',
      step: '04',
      title: 'Anomaly Scoring',
      eyebrow: 'RISK_MODEL',
      accent: 'danger',
      summary: 'Astraea scores anomaly, failure probability, confidence, and uncertainty so the recommendation is measurable rather than opaque.',
      metricLabel: 'anomaly',
      metricValue: 'waiting',
      supportLabel: 'confidence',
      supportValue: 'pending',
      bullets: [
        'The scoring layer emits anomaly intensity and failure likelihood.',
        'Confidence and uncertainty are exposed as first-class outputs.',
        'Top features and explanation factors remain attached to the case.',
      ],
      evidence: [
        { label: 'Failure Probability', value: 'pending' },
        { label: 'Uncertainty', value: 'pending' },
        { label: 'Model', value: 'pending' },
      ],
    },
    {
      id: 'prioritize',
      step: '05',
      title: 'Prioritization',
      eyebrow: 'OPERATING_STANCE',
      accent: 'tertiary',
      summary: 'The case is ranked into a routing bucket with explicit rationale so teams know whether to intervene now, queue work, or review.',
      metricLabel: 'priority',
      metricValue: 'waiting',
      supportLabel: 'route',
      supportValue: 'pending',
      bullets: [
        'Severity and priority score convert model outputs into operational urgency.',
        'Routing makes the next owner visible immediately.',
        'Review requirements stay visible when uncertainty is high.',
      ],
      evidence: [
        { label: 'Severity', value: 'pending' },
        { label: 'Review Required', value: 'pending' },
        { label: 'Action Required', value: 'pending' },
      ],
    },
    {
      id: 'dispatch',
      step: '06',
      title: 'Decision Dispatch',
      eyebrow: 'ACTION_BUNDLE',
      accent: 'primary',
      summary: 'Recommendations turn into a concrete action bundle with owner, urgency, next steps, and expected business impact.',
      metricLabel: 'owner',
      metricValue: 'waiting',
      supportLabel: 'impact',
      supportValue: 'pending',
      bullets: [
        'The output is an action, not just a score.',
        'Execution commands and notifications are attached to the decision.',
        'Impact framing makes the result legible to operators and buyers.',
      ],
      evidence: [
        { label: 'Recommendation', value: 'pending' },
        { label: 'Urgency', value: 'pending' },
        { label: 'Cost Exposure', value: 'pending' },
      ],
    },
    {
      id: 'audit',
      step: '07',
      title: 'Audit Proof',
      eyebrow: 'REPLAY_GUARANTEE',
      accent: 'primary',
      summary: 'A deterministic hash binds event, features, model output, prioritization, and execution into a replayable proof bundle.',
      metricLabel: 'hash',
      metricValue: 'waiting',
      supportLabel: 'replay',
      supportValue: 'ready when executed',
      bullets: [
        'Every stage snapshot is captured for replay.',
        'Hash verification proves the same input produces the same output.',
        'This is the trust layer that makes Astraea defensible in production.',
      ],
      evidence: [
        { label: 'Snapshots', value: 'event, feature, model' },
        { label: 'Decision State', value: 'pending' },
        { label: 'Verification', value: 'pending' },
      ],
    },
  ];
}

export function buildWalkthroughSteps(result: PipelineResult | null): PipelineWalkthroughStep[] {
  if (!result) {
    return placeholderSteps();
  }

  return buildStepsFromPartial(result as unknown as PartialResult);
}

type PartialResult = Partial<PipelineResult>;

export function buildStepsFromPartial(partial: PartialResult): PipelineWalkthroughStep[] {
  const hasEvent = !!partial.event;
  const hasFeatures = !!partial.features;
  const hasAssessment = !!partial.assessment;
  const hasPrioritizedCase = !!partial.prioritized_case;
  const hasDecision = !!partial.decision;
  const hasExecution = !!partial.execution;
  const hasAudit = !!partial.audit;

  const event = partial.event;
  const features = partial.features;
  const assessment = partial.assessment;
  const prioritizedCase = partial.prioritized_case;
  const decision = partial.decision;
  const execution = partial.execution;
  const consequence = partial.consequence;
  const audit = partial.audit;

  const thresholdBreaches = features?.context
    ? Object.entries(features.context as Record<string, unknown>).filter(
        ([key, value]) => key.endsWith('_above_threshold') && value === true,
      ).length
    : 0;
  const sensorId = event?.metadata?.sensor_id ? String(event.metadata.sensor_id) : 'unknown';
  const location = event?.metadata?.location ? String(event.metadata.location) : 'unassigned';
  const topFeatureLabel = assessment?.top_features?.[0]
    ? toTitleCase(assessment.top_features[0])
    : 'Awaiting ranking';
  const uncertainty = assessment
    ? `${formatDecimal(assessment.uncertainty_low)} - ${formatDecimal(assessment.uncertainty_high)}`
    : 'n/a - n/a';

  const featuresData = features?.features as Record<string, number> | undefined;

  return [
    {
      id: 'capture',
      step: '01',
      title: 'Event Capture',
      eyebrow: 'SIGNAL_ENTRY',
      accent: 'primary',
      summary: event ? `${toTitleCase(event.event_type)} is received from ${event.source} and pinned to ${event.machine_id} before any interpretation begins.` : 'Waiting for event capture...',
      metricLabel: 'source',
      metricValue: event ? toTitleCase(event.source) : 'pending',
      supportLabel: 'payload',
      supportValue: event?.raw_values ? `${Object.keys(event.raw_values).length} sensor values` : 'waiting',
      bullets: event ? [
        `${toTitleCase(event.event_type)} detected on ${event.machine_id}.`,
        `The event is tied to ${event.line_id} at ${formatTimestamp(event.timestamp)}.`,
        'This raw snapshot becomes the immutable input for replay.',
      ] : [
        'A machine event arrives with source, line, timestamp, and raw telemetry values.',
        'The event is locked to a deterministic schema before scoring begins.',
        'Every downstream decision inherits this exact input snapshot.',
      ],
      evidence: [
        { label: 'Machine', value: event?.machine_id ?? 'pending' },
        { label: 'Event Type', value: event ? toTitleCase(event.event_type) : 'pending' },
        { label: 'Timestamp', value: event ? formatTimestamp(event.timestamp) : 'pending' },
      ],
    },
    {
      id: 'normalize',
      step: '02',
      title: 'Normalization',
      eyebrow: 'CONTRACT_LOCK',
      accent: 'secondary',
      summary: 'Astraea standardizes the event into a deterministic contract so timestamps, source context, and asset metadata can be trusted downstream.',
      metricLabel: 'contract',
      metricValue: 'schema locked',
      supportLabel: 'baseline',
      supportValue: `${thresholdBreaches} threshold flags`,
      bullets: event ? [
        `Source is normalized as ${toTitleCase(event.source)} for downstream processing.`,
        `Sensor ${sensorId} is mapped to ${location}.`,
        'Context markers are attached before scoring and routing begin.',
      ] : [
        'Machine, line, source, and metadata fields are standardized.',
        'Time and source context are preserved for replay and traceability.',
        'The decision engine now has a clean, bounded input frame.',
      ],
      evidence: [
        { label: 'Line', value: event?.line_id ?? 'pending' },
        { label: 'Sensor', value: sensorId },
        { label: 'Location', value: toTitleCase(location) },
      ],
    },
    {
      id: 'feature',
      step: '03',
      title: 'Feature Extraction',
      eyebrow: 'STATE_EXTRACTION',
      accent: 'secondary',
      summary: 'Raw telemetry is translated into ratios, deltas, and threshold markers that make the machine state legible to operators.',
      metricLabel: 'features',
      metricValue: featuresData ? String(Object.keys(featuresData).length) : 'waiting',
      supportLabel: 'breaches',
      supportValue: `${thresholdBreaches} active`,
      bullets: [
        `${thresholdBreaches} threshold breaches were surfaced explicitly in context.`,
        featuresData?.ratio_max !== undefined ? `The strongest aggregate ratio is ${formatDecimal(featuresData.ratio_max)}.` : 'Ratio calculation pending...',
        featuresData?.delta_max !== undefined ? `Feature deltas peak at ${formatDecimal(featuresData.delta_max, 1)} for this event.` : 'Delta calculation pending...',
      ],
      evidence: [
        { label: 'Ratio Max', value: featuresData?.ratio_max !== undefined ? formatDecimal(featuresData.ratio_max) : 'pending' },
        { label: 'Delta Max', value: featuresData?.delta_max !== undefined ? formatDecimal(featuresData.delta_max, 1) : 'pending' },
        { label: 'Duration', value: featuresData?.duration_seconds !== undefined ? `${formatDecimal(featuresData.duration_seconds, 0)}s` : 'pending' },
      ],
    },
    {
      id: 'score',
      step: '04',
      title: 'Anomaly Scoring',
      eyebrow: 'RISK_MODEL',
      accent: 'danger',
      summary: 'The scoring layer quantifies anomaly intensity, failure likelihood, confidence, and uncertainty so every recommendation has a visible confidence envelope.',
      metricLabel: 'anomaly',
      metricValue: assessment?.anomaly_score !== undefined ? formatDecimal(assessment.anomaly_score) : 'waiting',
      supportLabel: 'confidence',
      supportValue: assessment?.confidence !== undefined ? formatPercent(assessment.confidence) : 'pending',
      bullets: [
        assessment?.failure_probability !== undefined ? `Failure probability is ${formatDecimal(assessment.failure_probability)} for this case.` : 'Failure probability calculation pending...',
        `Uncertainty stays bounded at ${uncertainty}.`,
        `${topFeatureLabel} is currently the strongest driver in the model output.`,
      ],
      evidence: [
        { label: 'Failure Probability', value: assessment?.failure_probability !== undefined ? formatDecimal(assessment.failure_probability) : 'pending' },
        { label: 'Uncertainty', value: uncertainty },
        { label: 'Model', value: assessment?.model_version ?? 'pending' },
      ],
    },
    {
      id: 'prioritize',
      step: '05',
      title: 'Prioritization',
      eyebrow: 'OPERATING_STANCE',
      accent: 'tertiary',
      summary: 'Model output is translated into a ranked operating decision with severity, routing, and review requirements attached.',
      metricLabel: 'priority',
      metricValue: prioritizedCase?.priority_score !== undefined ? formatDecimal(prioritizedCase.priority_score) : 'waiting',
      supportLabel: 'route',
      supportValue: prioritizedCase?.routing_bucket ? toTitleCase(prioritizedCase.routing_bucket) : 'pending',
      bullets: prioritizedCase ? [
        `Severity is ${prioritizedCase.severity.toUpperCase()} with ${prioritizedCase.confidence_band.toUpperCase()} confidence.`,
        prioritizedCase.review_required
          ? 'Human review remains required because uncertainty is material.'
          : 'The confidence band is high enough for direct operating flow.',
        prioritizedCase.rationale?.[0] ?? 'Astraea provides a visible rationale for the route.',
      ] : [
        'Severity and priority score convert model outputs into operational urgency.',
        'Routing makes the next owner visible immediately.',
        'Review requirements stay visible when uncertainty is high.',
      ],
      evidence: [
        { label: 'Severity', value: prioritizedCase?.severity?.toUpperCase() ?? 'pending' },
        { label: 'Review Required', value: prioritizedCase?.review_required !== undefined ? (prioritizedCase.review_required ? 'YES' : 'NO') : 'pending' },
        { label: 'Action Required', value: prioritizedCase?.requires_action !== undefined ? (prioritizedCase.requires_action ? 'YES' : 'NO') : 'pending' },
      ],
    },
    {
      id: 'dispatch',
      step: '06',
      title: 'Decision Dispatch',
      eyebrow: 'ACTION_BUNDLE',
      accent: 'primary',
      summary: 'Astraea outputs an operational recommendation with owner, urgency, commands, and business consequences instead of a passive risk score.',
      metricLabel: 'owner',
      metricValue: decision?.owner ? toTitleCase(decision.owner) : 'Unassigned',
      supportLabel: 'impact',
      supportValue: consequence?.downtime_avoided_minutes !== undefined ? `${consequence.downtime_avoided_minutes} min avoided` : 'pending',
      bullets: decision ? [
        decision.recommendation,
        decision.next_steps?.[0] ?? 'Next steps are included in the action plan.',
        consequence?.cost_estimate_usd !== undefined ? `Estimated exposure is ${formatCurrency(consequence.cost_estimate_usd)} if the case is ignored.` : 'Cost estimation pending...',
      ] : [
        'The output is an action, not just a score.',
        'Execution commands and notifications are attached to the decision.',
        'Impact framing makes the result legible to operators and buyers.',
      ],
      evidence: [
        { label: 'Recommendation', value: decision?.recommendation ?? 'pending' },
        { label: 'Urgency', value: decision?.urgency?.toUpperCase() ?? 'pending' },
        { label: 'Cost Exposure', value: consequence?.cost_estimate_usd !== undefined ? formatCurrency(consequence.cost_estimate_usd) : 'pending' },
      ],
    },
    {
      id: 'audit',
      step: '07',
      title: 'Audit Proof',
      eyebrow: 'REPLAY_GUARANTEE',
      accent: 'primary',
      summary: 'The final bundle is hashed and replayable, giving operators a deterministic proof of what Astraea saw, reasoned about, and recommended.',
      metricLabel: 'hash',
      metricValue: audit?.deterministic_hash ? `${audit.deterministic_hash.slice(0, 12)}...` : 'waiting',
      supportLabel: 'replay',
      supportValue: audit ? 'ready' : 'pending',
      bullets: audit ? [
        'Event, feature, model, prioritization, and execution snapshots are preserved.',
        `${execution?.notifications?.[0] ?? 'A notification is attached to the dispatch bundle.'}`,
        `Assigned team: ${toTitleCase(execution?.assigned_team ?? 'unassigned')}.`,
      ] : [
        'Every stage snapshot is captured for replay.',
        'Hash verification proves the same input produces the same output.',
        'This is the trust layer that makes Astraea defensible in production.',
      ],
      evidence: [
        { label: 'Snapshots', value: 'event, feature, model' },
        { label: 'Decision State', value: execution?.dispatch_status ?? 'pending' },
        { label: 'Verification', value: audit?.deterministic_hash?.slice(0, 18) ?? 'pending' },
      ],
    },
  ];
}

export async function runDemoMode(): Promise<DemoResult | null> {
  try {
    return await requestJson<DemoResult>('/api/demo', {
      method: "POST",
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

export interface StageProgressEvent {
  stage: number;
  stage_name: string;
  stage_label: string;
  event_id: string;
  case_id: string;
  partial_result: Partial<PipelineResult>;
  completed: boolean;
  timestamp: string;
}

export type StageEventCallback = (event: StageProgressEvent) => void;
export type StreamErrorCallback = (error: Error) => void;
export type StreamDoneCallback = () => void;

export function streamDemoStages(
  onStage: StageEventCallback,
  onError?: StreamErrorCallback,
  onDone?: StreamDoneCallback
): () => void {
  let aborted = false;
  
  const eventSource = new EventSource("/api/demo");
  
  eventSource.addEventListener("stage", (e) => {
    if (aborted) return;
    try {
      const data = JSON.parse(e.data);
      onStage(data as StageProgressEvent);
    } catch (err) {
      onError?.(err as Error);
    }
  });
  
  eventSource.addEventListener("error", (e) => {
    if (aborted) return;
    const error = new Error("Stream connection failed");
    onError?.(error);
    eventSource.close();
  });
  
  eventSource.onerror = () => {
    if (aborted) return;
    eventSource.close();
    onDone?.();
  };
  
  eventSource.onopen = () => {
    // connection established
  };
  
  return () => {
    aborted = true;
    eventSource.close();
    onDone?.();
  };
}
