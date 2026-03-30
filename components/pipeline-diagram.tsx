'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import {
  ArrowDownCircle,
  Filter,
  Lock,
  Scale,
  Send,
  Shield,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pipelineStages = [
  {
    id: 'capture',
    label: 'Event capture',
    icon: ArrowDownCircle,
    color: '#6366F1',
    description: 'Raw telemetry enters with source, machine, and timestamp context intact.',
  },
  {
    id: 'normalize',
    label: 'Normalization',
    icon: Scale,
    color: '#818CF8',
    description: 'The event contract is validated and converted into a stable shape.',
  },
  {
    id: 'feature',
    label: 'Feature extraction',
    icon: Zap,
    color: '#A78BFA',
    description: 'Threshold deltas and ratios expose machine state in plain language.',
  },
  {
    id: 'score',
    label: 'Anomaly scoring',
    icon: Shield,
    color: '#8B5CF6',
    description: 'The model scores risk and uncertainty without hiding its confidence band.',
  },
  {
    id: 'prioritize',
    label: 'Prioritization',
    icon: Filter,
    color: '#6366F1',
    description: 'The case is routed into an operational bucket with clear rationale.',
  },
  {
    id: 'dispatch',
    label: 'Decision dispatch',
    icon: Send,
    color: '#818CF8',
    description: 'The recommendation becomes an action bundle with owner and next steps.',
  },
  {
    id: 'audit',
    label: 'Audit proof',
    icon: Lock,
    color: '#A1FFAF',
    description: 'Snapshots and hash material make the final decision replayable.',
  },
];

export function PipelineDiagram() {
  const [activeStage, setActiveStage] = useState<number>(0);
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative border-b border-white/5 bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="info" dot className="mx-auto">
            Architecture
          </Badge>
          <h2 className="mt-5 font-display text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
            A seven-stage control loop that stays readable
          </h2>
          <p className="mt-5 text-base leading-7 text-neutral-400 md:text-lg">
            Every decision moves from capture to audit proof through a deterministic path. The diagram is designed
            to explain the system quickly, without the visual noise common in technical landing pages.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card padding="lg" className="overflow-hidden border-white/6">
            <CardHeader className="pb-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-indigo">
                Pipeline overview
              </div>
              <CardTitle className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">
                The same path, every time
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
                Hover a stage to inspect it, or read left to right for the full narrative. The active stage uses an
                indigo glow so the flow feels guided rather than busy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-5 right-5 top-[2.1rem] hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent xl:block" />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
                  {pipelineStages.map((stage, index) => {
                    const Icon = stage.icon;
                    const isActive = activeStage === index;

                    return (
                      <motion.button
                        key={stage.id}
                        type="button"
                        onMouseEnter={() => setActiveStage(index)}
                        onFocus={() => setActiveStage(index)}
                        onBlur={() => setActiveStage(0)}
                        onClick={() => setActiveStage(index)}
                        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.35, delay: index * 0.04 }}
                        className="group relative flex min-h-[180px] flex-col items-start rounded-2xl border border-white/6 bg-black/30 p-4 text-left transition-all duration-200 hover:border-white/12"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${
                            isActive ? 'border-indigo/30 bg-indigo/10 text-indigo' : 'border-white/10 bg-white/[0.02] text-neutral-500'
                          }`}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-indigo shadow-[0_0_12px_rgba(99,102,241,0.7)]' : 'bg-white/20'}`} />
                        </div>

                        <div
                          className={`mt-4 flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-200 ${
                            isActive ? 'border-indigo/30 bg-indigo/10' : 'border-white/6 bg-white/[0.02]'
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${isActive ? 'text-indigo' : 'text-neutral-300'}`} />
                        </div>

                        <div className={`mt-4 font-display text-sm font-bold uppercase tracking-[0.08em] ${
                          isActive ? 'text-white' : 'text-neutral-200'
                        }`}>
                          {stage.label}
                        </div>

                        <p className="mt-2 text-sm leading-6 text-neutral-400">
                          {stage.description}
                        </p>

                        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: stage.color }}
                            initial={{ width: '0%' }}
                            whileInView={{ width: isActive ? '100%' : '70%' }}
                            viewport={{ once: true }}
                            transition={{ duration: prefersReducedMotion ? 0.01 : 0.8, delay: index * 0.05 }}
                          />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card padding="lg" className="border-white/6 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_45%),rgba(17,17,19,0.9)]">
              <CardHeader className="pb-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-indigo">
                  Active stage
                </div>
                <CardTitle className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">
                  {String(activeStage + 1).padStart(2, '0')} / {pipelineStages[activeStage].label}
                </CardTitle>
                <CardDescription className="mt-2 text-sm leading-6 text-neutral-400">
                  {pipelineStages[activeStage].description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile label="Guarantee" value="Deterministic trace" />
                  <InfoTile label="Outcome" value="Replayable audit bundle" />
                </div>
                <div className="rounded-2xl border border-white/6 bg-black/30 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
                    Why this matters
                  </div>
                  <p className="mt-3 text-sm leading-7 text-neutral-300">
                    The visualization favors clarity over spectacle. That keeps the pipeline legible for technical
                    audiences while still feeling premium enough for executive demos.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <FeatureCard
                title="Deterministic hash"
                description="Every stage contributes to the same proof chain, so any decision can be replayed later."
                code="sha256(event + features + model + decision)"
                color="#6366F1"
              />
              <FeatureCard
                title="Uncertainty quantification"
                description="Confidence and uncertainty stay visible, which makes operator review feel deliberate."
                code="[0.614 — 0.866]"
                color="#8B5CF6"
              />
              <FeatureCard
                title="Zero-trust execution"
                description="High-uncertainty cases stay in human review until the recommendation is ready."
                code="if confidence < threshold: review_required"
                color="#FFD016"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  description,
  code,
  color,
}: {
  title: string;
  description: string;
  code: string;
  color: string;
}) {
  return (
    <Card variant="interactive" padding="md" className="border-white/6">
      <CardHeader className="pb-3">
        <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        <CardTitle className="mt-4 text-lg font-black uppercase tracking-[-0.02em]" style={{ color }}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-6 text-neutral-400">{description}</p>
        <div className="rounded-xl border border-white/6 bg-black/40 p-3 font-mono text-[10px] text-neutral-200">
          {code}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-black/30 p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">{label}</div>
      <div className="mt-3 font-display text-sm font-bold uppercase tracking-[0.08em] text-white">{value}</div>
    </div>
  );
}
