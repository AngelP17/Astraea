'use client';

import { useEffect, useState } from 'react';
import { Clock, ShieldCheck, TrendDown, ArrowUpRight } from '@phosphor-icons/react';
import { requestJson } from '@/lib/api';

interface Baseline {
  downtime_avoided_minutes: number;
  usd_exposure_prevented: number;
  false_escalation_rate: number;
}

interface EvaluationData {
  dataset: string;
  total_evaluated_cases: number;
  baselines: {
    threshold_only: Baseline;
    astraea: Baseline;
  };
}

// Baked fallback mirrors the committed artifact so the marketing page stays
// honest and traceable when the backend is offline. Regenerate with
// `uv run python -m backend.evaluation.run_eval`. Source of truth: /evaluation.
const FALLBACK = {
  dataset: 'generated_labeled_synthetic_v1',
  total_evaluated_cases: 500,
  baselines: {
    threshold_only: { false_escalation_rate: 0.6 } as Baseline,
    astraea: {
      downtime_avoided_minutes: 4500,
      usd_exposure_prevented: 3375000,
      false_escalation_rate: 0.0,
    } as Baseline,
  },
};

function formatUsd(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function ConsequenceLayer() {
  const [data, setData] = useState<EvaluationData | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let active = true;
    requestJson<EvaluationData>('/api/evaluation/latest')
      .then((d) => {
        if (active) {
          setData(d);
          setIsLive(true);
        }
      })
      .catch(() => {
        /* backend offline: keep the traceable artifact-baked fallback */
      });
    return () => {
      active = false;
    };
  }, []);

  const src = data ?? (FALLBACK as unknown as EvaluationData);
  const astraea = src.baselines.astraea;
  const threshold = src.baselines.threshold_only;

  const stats = [
    {
      icon: Clock,
      label: 'Downtime Avoided',
      value: `${astraea.downtime_avoided_minutes.toLocaleString()} min`,
      desc: 'Production downtime prevented by proactive routing across the evaluation set.',
    },
    {
      icon: ShieldCheck,
      label: 'Exposure Prevented',
      value: formatUsd(astraea.usd_exposure_prevented),
      desc: 'Aggregated hardware and opportunity cost avoided under the consequence model.',
    },
    {
      icon: TrendDown,
      label: 'False Escalations',
      value: `${astraea.false_escalation_rate.toFixed(2)} / case`,
      desc: `Down from ${threshold.false_escalation_rate.toFixed(2)} for a static threshold alerter on the same cases.`,
    },
  ];

  return (
    <section className="relative border-b border-white/5 bg-surface py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Operational &amp; economic impact
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-muted">
            Each resolved case is mapped to an operational consequence model. These figures are measured
            over a {src.total_evaluated_cases.toLocaleString()}-case synthetic evaluation set.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em]">
            <span className="flex items-center gap-1.5 border border-white/10 bg-white/[0.03] px-2.5 py-1 text-neutral-400">
              <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-success' : 'bg-text-dim'}`} />
              {isLive ? 'Measured · live artifact' : 'Measured · artifact baked'}
            </span>
            <span className="text-text-dim">{src.dataset}</span>
            <a href="/evaluation" className="flex items-center gap-1 text-amber hover:text-white">
              See evaluation <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="grid gap-px overflow-hidden border border-white/6 bg-white/6 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex flex-col justify-between gap-4 bg-background p-5">
                <div className="flex h-8 w-8 items-center justify-center border border-white/5 bg-white/[0.02]">
                  <Icon className="h-4 w-4 text-amber" />
                </div>
                <div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
                    {stat.label}
                  </h3>
                  <div className="mt-2 font-display text-3xl font-black tracking-tight text-white">
                    {stat.value}
                  </div>
                </div>
                <p className="border-t border-white/5 pt-3 text-xs leading-relaxed text-text-muted">
                  {stat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
