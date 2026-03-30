'use client';

import { animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  FileCheck,
  RotateCcw,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type TrendDirection = 'up' | 'down' | 'none';

type Metric = {
  label: string;
  value: number;
  suffix: string;
  icon: typeof Shield;
  color: string;
  trend: TrendDirection;
  description: string;
  note: string;
  isDecimal?: boolean;
};

const metrics: Metric[] = [
  {
    label: 'Deterministic decisions',
    value: 100,
    suffix: '%',
    icon: Shield,
    color: '#6366F1',
    trend: 'up',
    description: 'Identical inputs resolve to the same output every time.',
    note: 'Replay-safe by design',
  },
  {
    label: 'Replay fidelity',
    value: 100,
    suffix: '%',
    icon: RotateCcw,
    color: '#8B5CF6',
    trend: 'up',
    description: 'Every bundle can be reconstructed from the same state.',
    note: 'Same input, same hash',
  },
  {
    label: 'Audit coverage',
    value: 100,
    suffix: '%',
    icon: FileCheck,
    color: '#00F0FF',
    trend: 'up',
    description: 'Pipeline snapshots remain attached from ingest to dispatch.',
    note: 'Evidence preserved',
  },
  {
    label: 'Decision confidence',
    value: 0.59,
    suffix: '',
    icon: TrendingUp,
    color: '#FFD016',
    trend: 'up',
    description: 'Representative confidence across reviewed decisions.',
    note: 'Above the human-review floor',
    isDecimal: true,
  },
];

const bars = [
  { label: 'Actionable output', value: 100, color: '#6366F1', helper: 'All live cases resolve to a concrete recommendation.' },
  { label: 'Operator review surfaced', value: 100, color: '#8B5CF6', helper: 'Uncertainty is exposed rather than hidden.' },
  { label: 'Rationale coverage', value: 67, color: '#FFD016', helper: 'Most cases include multiple explanation factors.' },
];

export function SystemMetrics() {
  return (
    <section className="relative border-b border-white/5 bg-surface py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="info" dot className="mx-auto">
            System health
          </Badge>
          <h2 className="mt-5 font-display text-3xl font-black uppercase tracking-[-0.04em] text-white md:text-4xl">
            Metrics that read like proof, not decoration
          </h2>
          <p className="mt-4 text-base leading-7 text-neutral-400 md:text-lg">
            Astraea surfaces the numbers that matter to operators: determinism, replay fidelity, audit coverage,
            and confidence. The goal is to make reliability visible at a glance.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <MetricCard key={metric.label} metric={metric} index={index} />
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card padding="lg" className="border-white/6">
            <CardHeader className="pb-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-indigo">
                Operational throughput
              </div>
              <CardTitle className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">
                Results translated into business language
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
                The bars below keep the story direct. They show what the system is doing, how often it escalates,
                and how much rationale data is attached to each recommendation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {bars.map((bar, index) => (
                <MetricBar key={bar.label} bar={bar} index={index} />
              ))}
            </CardContent>
          </Card>

          <Card padding="lg" className="border-white/6 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_45%),rgba(17,17,19,0.9)]">
            <CardHeader className="pb-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-indigo">
                Executive summary
              </div>
              <CardTitle className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">
                Three signals tell the whole story
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SummaryRow
                icon={ArrowUpRight}
                label="Faster operator response"
                value="Cases move from anomaly to routed action without ambiguity."
              />
              <SummaryRow
                icon={Users}
                label="Better human review"
                value="Uncertain decisions are explicit, with context attached for the operator."
              />
              <SummaryRow
                icon={FileCheck}
                label="Traceable evidence"
                value="Every recommendation carries a deterministic proof bundle."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ metric, index }: { metric: Metric; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(() =>
    prefersReducedMotion ? (metric.isDecimal ? metric.value.toFixed(2) : Math.round(metric.value).toString()) : '0'
  );
  const Icon = metric.icon;

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      return;
    }

    const controls = animate(0, metric.value, {
      duration: 1,
      delay: index * 0.08,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(value) {
        setDisplayValue(metric.isDecimal ? value.toFixed(2) : Math.round(value).toString());
      },
    });

    return () => controls.stop();
  }, [isInView, prefersReducedMotion, metric.isDecimal, metric.value, index]);

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
    >
      <Card variant="interactive" padding="lg" className="h-full">
        <CardHeader className="flex items-start justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/6 bg-white/[0.02]">
              <Icon className="h-5 w-5" style={{ color: metric.color }} />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
                {metric.label}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                <span className={`h-1.5 w-1.5 rounded-full ${metric.trend === 'up' ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
                {metric.note}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendChip trend={metric.trend} />
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-end gap-2">
            <span className="font-display text-4xl font-black tracking-[-0.04em] text-white">
              {displayValue}
            </span>
            <span className="pb-2 font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">
              {metric.suffix}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-neutral-400">{metric.description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MetricBar({ bar, index }: { bar: (typeof bars)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.35, delay: 0.2 + index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
            {bar.label}
          </div>
          <div className="mt-1 text-sm text-neutral-400">{bar.helper}</div>
        </div>
        <div className="font-display text-lg font-black text-white">{bar.value}%</div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: bar.color }}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${bar.value}%` } : {}}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.9, delay: 0.35 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/[0.02] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/6 bg-black/20">
        <Icon className="h-4 w-4 text-indigo" />
      </div>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">{label}</div>
        <p className="mt-1 text-sm leading-6 text-neutral-300">{value}</p>
      </div>
    </div>
  );
}

function TrendChip({ trend }: { trend: TrendDirection }) {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300">
        <ArrowUpRight className="h-3 w-3" />
        up
      </span>
    );
  }

  if (trend === 'down') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-400/20 bg-red-400/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-red-300">
        <ArrowUpRight className="h-3 w-3 rotate-90" />
        down
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.02] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
      steady
    </span>
  );
}
