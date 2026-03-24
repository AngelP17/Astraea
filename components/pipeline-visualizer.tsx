'use client';

import { motion } from 'framer-motion';
import { PipelineResult } from '@/lib/data';
import { ArrowRight, CheckCircle2, Circle, AlertTriangle, Zap, Activity, Shield, FileText, Hash } from 'lucide-react';

interface PipelineVisualizerProps {
  result: PipelineResult;
}

const stages = [
  {
    id: 'ingestion',
    label: 'Ingestion',
    icon: Activity,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
  },
  {
    id: 'feature',
    label: 'Feature Engine',
    icon: Zap,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    borderColor: 'border-secondary/30',
  },
  {
    id: 'model',
    label: 'Anomaly Detection',
    icon: Shield,
    color: 'text-danger',
    bgColor: 'bg-danger/10',
    borderColor: 'border-danger/30',
  },
  {
    id: 'decision',
    label: 'Decision + Audit',
    icon: FileText,
    color: 'text-tertiary',
    bgColor: 'bg-tertiary/10',
    borderColor: 'border-tertiary/30',
  },
];

export function PipelineVisualizer({ result }: PipelineVisualizerProps) {
  return (
    <div className="space-y-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500">
        Pipeline Stage Trace
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-secondary/50 to-tertiary/50" />

        <div className="space-y-4">
          {stages.map((stage, index) => (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              className="relative flex items-start gap-4"
            >
              <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full ${stage.bgColor} border ${stage.borderColor}`}>
                <stage.icon className={`h-5 w-5 ${stage.color}`} />
              </div>

              <div className="flex-1 border border-white/5 bg-surface-low p-4">
                <div className="flex items-center justify-between">
                  <div className="font-headline text-sm font-bold uppercase tracking-tight">{stage.label}</div>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <StageDetails stageId={stage.id} result={result} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StageDetails({ stageId, result }: { stageId: string; result: PipelineResult }) {
  switch (stageId) {
    case 'ingestion':
      return (
        <div className="mt-2 space-y-1 font-mono text-[10px] text-neutral-400">
          <div>source: <span className="text-primary">{result.event.source}</span></div>
          <div>machine: <span className="text-white">{result.event.machine_id}</span></div>
          <div>event_type: <span className="text-secondary">{result.event.event_type}</span></div>
        </div>
      );

    case 'feature':
      const featureCount = Object.keys(result.features.features).length;
      const thresholdBreaches = Object.entries(result.features.context)
        .filter(([k, v]) => k.endsWith('_above_threshold') && v === true)
        .length;
      return (
        <div className="mt-2 space-y-1 font-mono text-[10px] text-neutral-400">
          <div>features extracted: <span className="text-primary">{featureCount}</span></div>
          <div>threshold breaches: <span className="text-danger">{thresholdBreaches}</span></div>
          <div>ratio_max: <span className="text-tertiary">{result.features.features.ratio_max?.toFixed(3) ?? '0.000'}</span></div>
        </div>
      );

    case 'model':
      return (
        <div className="mt-2 space-y-1 font-mono text-[10px] text-neutral-400">
          <div>anomaly_score: <span className="text-danger">{result.assessment.anomaly_score.toFixed(3)}</span></div>
          <div>failure_prob: <span className="text-tertiary">{result.assessment.failure_probability.toFixed(3)}</span></div>
          <div>confidence: <span className="text-primary">{result.assessment.confidence.toFixed(3)}</span></div>
          <div>uncertainty: [{result.assessment.uncertainty_low.toFixed(3)} — {result.assessment.uncertainty_high.toFixed(3)}]</div>
        </div>
      );

    case 'decision':
      return (
        <div className="mt-2 space-y-1 font-mono text-[10px] text-neutral-400">
          <div>severity: <span className={result.prioritized_case.severity === 'critical' ? 'text-danger' : result.prioritized_case.severity === 'high' ? 'text-tertiary' : 'text-white'}>{result.prioritized_case.severity.toUpperCase()}</span></div>
          <div>priority_score: <span className="text-primary">{result.prioritized_case.priority_score.toFixed(3)}</span></div>
          <div>routing: <span className="text-secondary">{result.prioritized_case.routing_bucket}</span></div>
          <div>hash: <span className="text-neutral-500">{result.audit.deterministic_hash.slice(0, 16)}...</span></div>
        </div>
      );

    default:
      return null;
  }
}