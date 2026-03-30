'use client';

import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, ArrowRight, BrainCircuit, Clock3, Play, RefreshCw, ShieldCheck, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const referenceTrace = [
  {
    id: 'capture',
    phase: '01',
    title: 'Event accepted into the pipeline contract',
    eyebrow: 'Signal intake',
    icon: Activity,
    duration: '042ms',
    details: ['Source authenticated', 'Line context attached', 'Timestamp normalized to UTC'],
  },
  {
    id: 'score',
    phase: '02',
    title: 'Feature and anomaly layers agree this case is abnormal',
    eyebrow: 'Model state',
    icon: BrainCircuit,
    duration: '118ms',
    details: ['Threshold deltas extracted', 'Failure probability elevated', 'Confidence interval attached'],
  },
  {
    id: 'route',
    phase: '03',
    title: 'Decision engine routes to human review with action context',
    eyebrow: 'Routing action',
    icon: Ticket,
    duration: '094ms',
    details: ['Owner assigned', 'Maintenance window suggested', 'Escalation prepared for review'],
  },
  {
    id: 'proof',
    phase: '04',
    title: 'Audit proof and replay bundle are sealed',
    eyebrow: 'Proof layer',
    icon: ShieldCheck,
    duration: '061ms',
    details: ['Hash generated', 'Snapshots persisted', 'Replay bundle written to artifacts'],
  },
];

export function TimelineView() {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const totalLatency = useMemo(
    () =>
      referenceTrace.reduce((total, item) => total + Number.parseInt(item.duration, 10), 0),
    [],
  );

  const runReferenceTrace = () => {
    setIsPlaying(true);
    setActiveIndex(0);

    if (prefersReducedMotion) {
      setActiveIndex(referenceTrace.length - 1);
      setIsPlaying(false);
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= referenceTrace.length - 1) {
          window.clearInterval(interval);
          setIsPlaying(false);
          return current;
        }

        return current + 1;
      });
    }, 900);
  };

  return (
    <section className="relative border-b border-white/5 bg-background py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="font-mono text-xs uppercase tracking-[0.28em] text-indigo">Reference Trace</div>
            <h2 className="mt-5 font-display text-[clamp(2.25rem,4.5vw,4rem)] font-extrabold tracking-[-0.04em] text-white">
              A calm operator view of what happens when Astraea makes a call.
            </h2>
            <p className="mt-5 text-base leading-8 text-text-muted md:text-lg">
              This is a curated reference execution trace, not a live transport log. It exists to explain the timing,
              ownership, and proof mechanics behind a typical decision without turning the landing page into an internal console.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="info" dot>
              Reference scenario
            </Badge>
            <Button
              variant="secondary"
              size="md"
              onClick={runReferenceTrace}
              disabled={isPlaying}
              className="font-mono text-[11px] uppercase tracking-[0.16em]"
            >
              {isPlaying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Running trace' : 'Play reference trace'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <Card
            variant="elevated"
            padding="lg"
            className="border-white/10 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_50%),rgba(255,255,255,0.02)]"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              Trace metrics
            </div>
            <div className="mt-6 space-y-5">
              <Metric label="Total latency" value={`${totalLatency}ms`} />
              <Metric label="Pipeline phases" value={String(referenceTrace.length)} />
              <Metric label="Execution stance" value="Human review" />
            </div>
          </Card>

          <div className="space-y-4">
            {referenceTrace.map((item, index) => {
              const Icon = item.icon;
              const isActive = index === activeIndex;
              const isComplete = index < activeIndex;

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`group w-full text-left ${index === referenceTrace.length - 1 ? '' : ''}`}
                  initial={false}
                  animate={{ opacity: isActive || isComplete ? 1 : 0.82 }}
                >
                  <Card
                    variant="interactive"
                    padding="lg"
                    className={`relative overflow-hidden border ${
                      isActive ? 'border-indigo/30 bg-indigo/[0.08]' : 'border-white/10'
                    }`}
                  >
                    <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-indigo/80 to-transparent" />
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                            isActive ? 'border-indigo/30 bg-indigo/10' : 'border-white/10 bg-white/[0.02]'
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${isActive ? 'text-indigo' : 'text-white/70'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                              Phase {item.phase}
                            </span>
                            <Badge variant={isActive ? 'info' : 'default'}>
                              {item.eyebrow}
                            </Badge>
                          </div>
                          <h3 className="mt-3 font-display text-xl font-bold tracking-tight text-white">
                            {item.title}
                          </h3>
                          <div className="mt-5 flex flex-wrap gap-2">
                            {item.details.map((detail) => (
                              <span
                                key={detail}
                                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/75"
                              >
                                {detail}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                          <Clock3 className="h-3.5 w-3.5 text-indigo" />
                          {item.duration}
                        </div>
                        <ArrowRight className={`h-4 w-4 transition-transform ${isActive ? 'translate-x-1 text-indigo' : 'text-white/30'}`} />
                      </div>
                    </div>
                  </Card>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold tracking-tight text-white">
        {value}
      </div>
    </div>
  );
}
