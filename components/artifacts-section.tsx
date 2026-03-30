'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Boxes, FileJson2, Workflow } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { modules } from '@/lib/data';

const artifactSignals = [
  {
    icon: Workflow,
    label: 'Decision pipeline',
    value: 'Seven deterministic stages turn raw telemetry into a routed action bundle.',
  },
  {
    icon: FileJson2,
    label: 'Replay artifacts',
    value: 'Live runs and demo batches both resolve into inspectable JSON proof bundles.',
  },
  {
    icon: Boxes,
    label: 'Composable surfaces',
    value: 'Frontend, API proxy, and FastAPI backend stay aligned around one product story.',
  },
];

export function ArtifactsSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="artifacts" className="border-b border-white/5 bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="info" dot>
              Product layers
            </Badge>
            <h2 className="mt-5 font-display text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">
              The flagship is the system, not a single screen.
            </h2>
            <p className="mt-5 text-base leading-7 text-neutral-400 md:text-lg">
              Astraea becomes credible when the visual shell, decision engine, and audit trail all reinforce the same
              promise: clear actions with replayable proof.
            </p>
          </div>

          <a
            href="https://github.com/AngelP17/Astraea"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-400 transition-colors duration-150 hover:text-white"
          >
            View repository
            <ArrowUpRight className="h-4 w-4 text-indigo" />
          </a>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {artifactSignals.map((signal, index) => {
            const Icon = signal.icon;

            return (
              <motion.div
                key={signal.label}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <Card variant="interactive" padding="md" className="h-full border-white/6">
                  <CardContent className="space-y-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/6 bg-white/[0.03]">
                      <Icon className="h-5 w-5 text-indigo" />
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
                        {signal.label}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-neutral-300">{signal.value}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {modules.map((module, index) => (
            <motion.article
              key={module.name}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <Card variant="interactive" padding="lg" className="h-full border-white/6">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
                      {module.status}
                    </div>
                    <div className="h-2 w-2 rounded-full bg-indigo shadow-[0_0_12px_rgba(99,102,241,0.55)]" />
                  </div>
                  <CardTitle className="mt-4 text-2xl font-black tracking-[-0.03em] text-white">
                    {module.name}
                  </CardTitle>
                  <CardDescription className="mt-3 text-sm leading-6 text-neutral-400">
                    {module.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-wrap gap-2">
                  {module.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/6 bg-black/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-300"
                    >
                      {tag}
                    </span>
                  ))}
                </CardContent>
              </Card>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
