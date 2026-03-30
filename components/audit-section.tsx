'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { FileCheck2, Fingerprint, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const auditLayers = [
  {
    label: 'Event snapshot',
    value: 'Source, timestamp, machine, and raw signal frame',
    tone: 'text-cyan',
  },
  {
    label: 'Feature snapshot',
    value: 'Ratios, threshold deltas, and contextual markers',
    tone: 'text-indigo',
  },
  {
    label: 'Model snapshot',
    value: 'Anomaly score, failure probability, confidence band',
    tone: 'text-violet',
  },
  {
    label: 'Decision snapshot',
    value: 'Priority, routing, action plan, and execution state',
    tone: 'text-amber',
  },
];

const trustBlocks = [
  {
    icon: Fingerprint,
    label: 'Hash-bound replay',
    value: 'Every recommendation can be reconstructed from the same decision state.',
  },
  {
    icon: FileCheck2,
    label: 'Evidence attached',
    value: 'Operators receive rationale, confidence, and execution context together.',
  },
  {
    icon: ShieldCheck,
    label: 'Defensible outcome',
    value: 'The product stays trustworthy because it exposes how it arrived there.',
  },
  {
    icon: LockKeyhole,
    label: 'Proof over promise',
    value: 'Determinism is not a claim on the landing page. It is the output itself.',
  },
];

export function AuditSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="audit" className="relative border-b border-white/5 bg-background py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_38%)]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="info" dot className="mx-auto">
            Audit proof
          </Badge>
          <h2 className="mt-5 font-display text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">
            Determinism is the trust surface.
          </h2>
          <p className="mt-5 text-base leading-7 text-neutral-400 md:text-lg">
            Astraea persists the path from raw event to routed action as a proof bundle, so teams can inspect what
            happened, why it happened, and whether the same input would resolve the same way again.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card
              padding="lg"
              className="border-white/6 bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(9,9,11,0.92))]"
            >
              <CardHeader className="pb-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-indigo">
                  Proof bundle
                </div>
                <CardTitle className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">
                  The same decision can be read, checked, and replayed later.
                </CardTitle>
                <CardDescription className="mt-2 text-sm leading-6 text-neutral-400">
                  Instead of hiding the logic inside a final score, Astraea keeps every state transition attached to
                  the recommendation.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {auditLayers.map((layer, index) => (
                  <motion.div
                    key={layer.label}
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.35, delay: index * 0.05 }}
                    className="rounded-2xl border border-white/6 bg-black/30 p-4"
                  >
                    <div className={`font-mono text-[10px] uppercase tracking-[0.22em] ${layer.tone}`}>
                      {layer.label}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-neutral-300">{layer.value}</p>
                  </motion.div>
                ))}

                <div className="rounded-2xl border border-indigo/20 bg-indigo/10 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-indigo">
                    Deterministic hash
                  </div>
                  <div className="mt-3 break-all font-mono text-xs text-white">
                    sha256(event + features + assessment + prioritization + decision + execution)
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {trustBlocks.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.label}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                >
                  <Card variant="interactive" padding="md" className="h-full border-white/6 bg-surface/90">
                    <CardContent className="space-y-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/6 bg-white/[0.03]">
                        <Icon className="h-5 w-5 text-indigo" />
                      </div>
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
                          {item.label}
                        </div>
                        <p className="mt-3 text-sm leading-6 text-neutral-300">{item.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
