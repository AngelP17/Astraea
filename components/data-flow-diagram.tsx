'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  AudioWaveform,
  Binary,
  BrainCircuit,
  ClipboardCheck,
  FileStack,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const architectureFlow = [
  {
    id: 'capture',
    label: 'Signal Intake',
    title: 'Telemetry enters a strict event contract',
    icon: AudioWaveform,
    summary:
      'Every machine signal arrives with source, line context, and timestamp normalization before the model sees anything.',
    details: ['Schema locked', 'Source verified', 'UTC timestamped'],
  },
  {
    id: 'feature',
    label: 'Feature State',
    title: 'Behavior becomes measurable evidence',
    icon: Binary,
    summary:
      'Threshold deltas, ratios, and context markers turn noisy telemetry into a bounded machine-state representation.',
    details: ['Ratios extracted', 'Thresholds marked', 'Context preserved'],
  },
  {
    id: 'decision',
    label: 'Decision Resolution',
    title: 'Risk becomes routing and action',
    icon: BrainCircuit,
    summary:
      'Scoring, prioritization, and consequence modeling produce an explainable action bundle instead of a raw anomaly score.',
    details: ['Confidence scored', 'Routing assigned', 'Business impact framed'],
  },
  {
    id: 'proof',
    label: 'Proof Layer',
    title: 'Every outcome ships with replay evidence',
    icon: ClipboardCheck,
    summary:
      'Audit snapshots, deterministic hashes, and replay bundles make the output defensible in front of operators and buyers.',
    details: ['Hash sealed', 'Replay ready', 'Execution recorded'],
  },
];

const proofArtifacts = [
  {
    label: 'Event Bundle',
    value: 'Normalized source record',
    icon: FileStack,
  },
  {
    label: 'Decision Proof',
    value: 'Recommendation + impact trace',
    icon: ShieldCheck,
  },
  {
    label: 'Replay Bundle',
    value: 'Deterministic audit snapshots',
    icon: ClipboardCheck,
  },
];

export function DataFlowDiagram() {
  return (
    <section className="relative border-b border-white/5 bg-background py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="font-mono text-xs uppercase tracking-[0.28em] text-indigo">System Architecture</div>
            <h2 className="mt-5 font-display text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold tracking-[-0.04em] text-white">
              From live telemetry to an audit-grade decision.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-text-muted md:text-lg">
              This is the architectural spine of Astraea. The flow below highlights the real system contracts that let the walkthrough, replay view, and command deck stay aligned.
            </p>
          </div>
          <Badge variant="info" dot className="self-start lg:self-auto">
            Reference architecture view
          </Badge>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="grid gap-4 lg:grid-cols-4">
            {architectureFlow.map((stage, index) => {
              const Icon = stage.icon;

              return (
                <div key={stage.id} className="relative">
                  <Card
                    variant="interactive"
                    padding="lg"
                    className="relative h-full overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo/70 to-transparent" />
                    <div className="flex items-center justify-between gap-4">
                      <Badge variant="info" className="border border-indigo/20 bg-indigo/10 text-indigo">
                        {stage.label}
                      </Badge>
                      <Icon className="h-5 w-5 text-indigo" />
                    </div>
                    <h3 className="mt-6 font-display text-xl font-bold tracking-tight text-white">
                      {stage.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-text-muted">
                      {stage.summary}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {stage.details.map((detail) => (
                        <span
                          key={detail}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/75"
                        >
                          {detail}
                        </span>
                      ))}
                    </div>
                  </Card>
                  {index < architectureFlow.length - 1 ? (
                    <div className="pointer-events-none absolute right-[-1.05rem] top-1/2 hidden -translate-y-1/2 xl:block">
                      <div className="flex items-center gap-2">
                        <div className="h-px w-6 bg-gradient-to-r from-indigo/50 to-white/10" />
                        <ArrowRight className="h-4 w-4 text-indigo/70" />
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <Card
            variant="elevated"
            padding="lg"
            className="border-white/10 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_52%),rgba(255,255,255,0.02)]"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
              Output artifacts
            </div>
            <div className="mt-5 space-y-4">
              {proofArtifacts.map((artifact) => {
                const Icon = artifact.icon;
                return (
                  <div
                    key={artifact.label}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo/20 bg-indigo/10">
                        <Icon className="h-4 w-4 text-indigo" />
                      </div>
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                          {artifact.label}
                        </div>
                        <div className="mt-1 text-sm font-medium text-white">
                          {artifact.value}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35 }}
              className="mt-6 rounded-2xl border border-indigo/20 bg-indigo/10 p-4"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-indigo">
                Why it matters
              </div>
              <p className="mt-2 text-sm leading-7 text-white/80">
                The interface only feels trustworthy because the event contract, decision logic, and replay proof are all built from the same pipeline record.
              </p>
            </motion.div>
          </Card>
        </div>
      </div>
    </section>
  );
}
