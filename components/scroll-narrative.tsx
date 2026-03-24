'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { narrativeSteps } from '@/lib/data';

export function ScrollNarrative() {
  return (
    <section id="pipeline" className="relative border-b border-white/5 bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-16 max-w-3xl">
          <div className="font-mono text-xs uppercase tracking-[0.28em] text-primary">DATA-SCROLL NARRATIVE</div>
          <h2 className="mt-5 font-headline text-4xl font-black uppercase leading-none tracking-[-0.04em] md:text-6xl">
            Event becomes decision through a staged control loop.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-400">
            Scroll drives the story. Each stage reveals how Astraea transforms unstable telemetry into a bounded decision artifact with execution semantics and replayable audit state.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-8 lg:sticky lg:top-28 lg:h-[420px]">
            <div className="panel p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500">Pipeline Trace</div>
              <div className="mt-5 space-y-4">
                {narrativeSteps.map((step) => (
                  <div key={step.step} className="flex items-start gap-4 border border-white/5 bg-black/30 p-4">
                    <div className="font-headline text-2xl font-black text-primary/80">{step.step}</div>
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">{step.eyebrow}</div>
                      <div className="mt-2 font-headline text-lg font-bold uppercase leading-tight md:text-xl [overflow-wrap:anywhere]">{step.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-20">
            {narrativeSteps.map((step, index) => (
              <NarrativeCard key={step.step} {...step} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NarrativeCard({
  step,
  title,
  eyebrow,
  description,
  metrics,
  index,
}: {
  step: string;
  title: string;
  eyebrow: string;
  description: string;
  metrics: string[];
  index: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 30%'] });

  const opacity = useTransform(scrollYProgress, [0, 0.35, 1], [0.25, 1, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.96, 1, 1]);
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <motion.article
      ref={ref}
      style={{ opacity, y, scale }}
      className="panel relative overflow-hidden p-1"
    >
      <div className="border border-white/5 bg-black/60 p-8 md:p-10">
        <div className="mb-5 flex items-center justify-between gap-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">{eyebrow}</div>
            <h3 className="mt-3 font-headline text-3xl font-black uppercase tracking-[-0.04em] leading-[0.95] md:text-5xl">
              {title}
            </h3>
          </div>
          <div className="font-headline text-5xl font-black text-white/10">{step}</div>
        </div>

        <p className="max-w-2xl text-lg leading-8 text-neutral-400">{description}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric} className="border border-white/5 bg-surface-low p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">Signal</div>
              <div className="mt-3 font-headline text-base font-bold uppercase leading-tight md:text-lg [overflow-wrap:anywhere]">{metric}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 border border-white/5 bg-surface p-4">
          <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
            <span>Stage Progress</span>
            <span>{String((index + 1) * 25).padStart(2, '0')}%</span>
          </div>
          <div className="h-2 w-full bg-white/5">
            <motion.div style={{ width: progressWidth }} className="h-full bg-primary" />
          </div>
        </div>
      </div>
    </motion.article>
  );
}
