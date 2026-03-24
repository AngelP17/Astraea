'use client';

import { motion } from 'framer-motion';
import { PipelineResult } from '@/lib/data';
import { AlertTriangle, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

interface DecisionBreakdownProps {
  result: PipelineResult;
}

export function DecisionBreakdown({ result }: DecisionBreakdownProps) {
  const { assessment, prioritized_case, decision, execution } = result;

  return (
    <div className="space-y-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500">
        Decision Breakdown
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ScoreCard
          label="Anomaly Score"
          value={assessment.anomaly_score}
          icon={AlertTriangle}
          color="danger"
        />
        <ScoreCard
          label="Failure Probability"
          value={assessment.failure_probability}
          icon={TrendingUp}
          color="tertiary"
        />
        <ScoreCard
          label="Confidence"
          value={assessment.confidence}
          icon={CheckCircle2}
          color="primary"
        />
        <ScoreCard
          label="Priority Score"
          value={prioritized_case.priority_score}
          icon={Clock}
          color={prioritized_case.severity === 'critical' ? 'danger' : prioritized_case.severity === 'high' ? 'tertiary' : 'secondary'}
        />
      </div>

      <div className="border border-white/5 bg-surface-low p-4">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
          Uncertainty Interval
        </div>
        <div className="relative h-8 overflow-hidden rounded bg-black/50">
          <motion.div
            className="absolute inset-y-0 rounded bg-danger/30"
            initial={{ width: '0%' }}
            animate={{ width: `${assessment.uncertainty_high * 100}%` }}
            style={{ left: `${assessment.uncertainty_low * 100}%` }}
          />
          <motion.div
            className="absolute inset-y-0 w-1 bg-danger"
            initial={{ left: '0%' }}
            animate={{ left: `${assessment.anomaly_score * 100}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-2 font-mono text-[10px] text-neutral-400">
            <span>{assessment.uncertainty_low.toFixed(2)}</span>
            <span className="text-white">{assessment.anomaly_score.toFixed(2)}</span>
            <span>{assessment.uncertainty_high.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="border border-white/5 bg-surface-low p-4">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
          Explanation Factors
        </div>
        <div className="space-y-2">
          {assessment.explanation_factors.map((factor, i) => (
            <motion.div
              key={factor}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-2 font-mono text-xs text-neutral-300"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="break-words">{factor}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="border border-white/5 bg-surface-low p-4">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
          Rationale
        </div>
        <div className="space-y-2">
          {prioritized_case.rationale.map((reason, i) => (
            <motion.div
              key={reason}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-2 font-mono text-xs text-neutral-300"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
              <span className="break-words">{reason}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded border border-tertiary/30 bg-tertiary/5 p-4">
        <div className="mb-2 font-headline text-lg font-bold uppercase text-tertiary">
          {decision.recommendation}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
          URGENCY: {decision.urgency} | OWNER: {decision.owner ?? 'unassigned'}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof AlertTriangle;
  color: 'primary' | 'secondary' | 'danger' | 'tertiary';
}) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10 border-primary/30',
    secondary: 'text-secondary bg-secondary/10 border-secondary/30',
    danger: 'text-danger bg-danger/10 border-danger/30',
    tertiary: 'text-tertiary bg-tertiary/10 border-tertiary/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`border p-4 ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="mt-2 font-headline text-xl font-bold uppercase">{value.toFixed(3)}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">{label}</div>
    </motion.div>
  );
}