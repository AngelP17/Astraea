'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  DollarSign,
  GitBranch,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const stageItems = [
  {
    icon: AlertTriangle,
    title: 'Anomaly surfaced',
    description: 'Vibration ratio exceeded baseline on feeder_motor_A3.',
    tone: 'text-danger',
    iconTone: 'bg-danger/10 border-danger/20',
  },
  {
    icon: GitBranch,
    title: 'Pattern confirmed',
    description: 'Correlated with two adjacent machines inside a 300 second window.',
    tone: 'text-secondary',
    iconTone: 'bg-secondary/10 border-secondary/20',
  },
  {
    icon: Zap,
    title: 'Confidence raised',
    description: 'Anomaly score climbed to 0.74 with a high-confidence abnormal band.',
    tone: 'text-tertiary',
    iconTone: 'bg-tertiary/10 border-tertiary/20',
  },
  {
    icon: ShieldCheck,
    title: 'Inspection routed',
    description: 'Operations received the case with the full audit bundle attached.',
    tone: 'text-indigo',
    iconTone: 'bg-indigo/10 border-indigo/20',
  },
];

const resultItems = [
  {
    icon: Clock,
    value: '45',
    unit: 'min',
    label: 'Downtime avoided',
    description: 'Maintenance was planned before the line could fail.',
  },
  {
    icon: DollarSign,
    value: '3.2k',
    unit: 'USD',
    label: 'Estimated savings',
    description: 'Reduced repair and lost-output exposure.',
  },
  {
    icon: ShieldCheck,
    value: '1',
    unit: '',
    label: 'Failure prevented',
    description: 'A single intervention kept the process stable.',
  },
];

export function CaseStudy() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative border-b border-white/5 bg-background py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="info" dot className="mx-auto">
            Case Study
          </Badge>
          <h2 className="mt-5 font-display text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
            A line failure was prevented before the first alarm
          </h2>
          <p className="mt-5 text-base leading-7 text-neutral-400 md:text-lg">
            Astraea did not just flag an alert. It tied a vibration spike to nearby machines, quantified the risk,
            and routed a precise action bundle before downtime could spread.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card variant="interactive" padding="lg" className="border-indigo/15 bg-[linear-gradient(180deg,rgba(17,17,19,0.95),rgba(12,12,14,0.92))]">
              <CardHeader className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-indigo">
                    Decision Trace
                  </div>
                  <CardTitle className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">
                    Press_07, March 23, 2026
                  </CardTitle>
                  <CardDescription className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">
                    The system ingested a vibration anomaly from feeder_motor_A3 and immediately correlated the pattern
                    across the adjacent line.
                  </CardDescription>
                </div>
                <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-300">
                  <Clock className="h-3.5 w-3.5 text-indigo" />
                  02:13 AM
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="rounded-2xl border border-white/5 bg-black/30 p-5">
                  <p className="max-w-3xl text-[17px] leading-8 text-neutral-300 md:text-lg">
                    <span className="font-semibold text-white">
                      Astraea detected abnormal vibration patterns
                    </span>{' '}
                    on Press_07, linked the event to three machines on line_7, and prioritized the case as a real
                    operational risk instead of a generic threshold breach.
                  </p>
                </div>

                <div className="grid gap-4">
                  {stageItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.title}
                        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-30px' }}
                        transition={{ duration: 0.35, delay: index * 0.05 }}
                        className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                      >
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${item.iconTone}`}>
                          <Icon className={`h-5 w-5 ${item.tone}`} />
                        </div>
                        <div>
                          <div className={`font-display text-sm font-bold uppercase tracking-[0.08em] ${item.tone}`}>
                            {item.title}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-neutral-400">{item.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
                      Why this mattered
                    </div>
                    <ArrowRight className="h-4 w-4 text-indigo" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ImpactBlock
                      title="Without Astraea"
                      body="A threshold alert would have fired, the on-call engineer would have guessed, and the wrong parts would likely have been staged."
                    />
                    <ImpactBlock
                      title="With Astraea"
                      body="The right team got context, routing, and audit proof at the same moment the anomaly surfaced. Maintenance stayed scheduled."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card padding="lg" className="border-white/8 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_42%),rgba(17,17,19,0.88)]">
                <CardHeader className="pb-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-indigo">
                    Impact summary
                  </div>
                  <CardTitle className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">
                    Outcome at a glance
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  {resultItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-2xl border border-white/6 bg-black/30 p-4">
                        <Icon className="h-5 w-5 text-indigo" />
                        <div className="mt-4 flex items-end gap-2">
                          <span className="font-display text-3xl font-black uppercase tracking-[-0.04em] text-white">
                            {item.value}
                          </span>
                          <span className="pb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                            {item.unit}
                          </span>
                        </div>
                        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                          {item.label}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-neutral-400">{item.description}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card padding="lg" className="border-white/8 bg-surface/90">
                <CardHeader className="pb-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-indigo">
                    Operator value
                  </div>
                  <CardTitle className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">
                    Why this matters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-7 text-neutral-300">
                  <p>
                    <span className="font-semibold text-white">Without Astraea:</span> the system would have produced
                    a noisy alert, the team would have lost context, and the incident likely would have drifted into
                    avoidable downtime.
                  </p>
                  <p>
                    <span className="font-semibold text-white">With Astraea:</span> the case arrives with confidence,
                    routing, consequence estimates, and a deterministic hash that lets the decision be replayed and
                    trusted later.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ImpactBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo">{title}</div>
      <p className="mt-2 text-sm leading-6 text-neutral-400">{body}</p>
    </div>
  );
}
