'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Users, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function FailureScenario() {
  return (
    <section className="relative border-b border-white/5 bg-background py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-12 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.28em] text-indigo">Safeguard Protocol</div>
          <h2 className="mt-5 font-display text-[clamp(2rem,4vw,3.5rem)] font-extrabold tracking-[-0.04em] text-white">
            When signals conflict, Astraea slows down on purpose.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-text-muted">
            This reference scenario shows the system choosing review over false confidence. The goal is not to dramatize a failure, but to make the safety posture legible.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.08),rgba(255,208,22,0.04))] p-6"
          >
            <div className="mb-6 flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 shrink-0 text-amber" />
              <div>
                <div className="mb-3">
                  <Badge variant="warning" dot>
                    Reference safeguard scenario
                  </Badge>
                </div>
                <h3 className="font-display text-lg font-bold uppercase text-white">
                  Event A + Event B = human review
                </h3>
                <p className="mt-2 text-sm leading-7 text-text-muted">
                  When two machine states pull the model in different directions, Astraea routes to review instead of forcing an automated answer.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-white/10 bg-black/40 p-4">
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-indigo">
                  Event A: feeder_motor_A3
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-500 shrink-0">Event Type</span>
                    <span className="text-white truncate">vibration_spike</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-500 shrink-0">Anomaly Score</span>
                    <span className="text-danger">0.82</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-500 shrink-0">Failure Probability</span>
                    <span className="text-danger">0.74</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-500 shrink-0">Signal</span>
                    <span className="text-danger">HIGH</span>
                  </div>
                </div>
              </div>

              <div className="border border-white/10 bg-black/40 p-4">
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-secondary">
                  Event B: conveyor_drive_B1
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-500 shrink-0">Event Type</span>
                    <span className="text-white truncate">temperature_rise</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-500 shrink-0">Anomaly Score</span>
                    <span className="text-secondary">0.31</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-500 shrink-0">Failure Probability</span>
                    <span className="text-secondary">0.28</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-500 shrink-0">Signal</span>
                    <span className="text-secondary">NORMAL</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <ArrowRight className="h-6 w-6 text-neutral-600" />
              <div className="px-6 py-3 border border-tertiary/30 bg-tertiary/10">
                <span className="font-display text-sm font-bold uppercase text-tertiary">
                  ROUTING: HUMAN_REVIEW
                </span>
              </div>
              <ArrowRight className="h-6 w-6 text-neutral-600" />
            </div>

            <div className="mt-6 border-t border-danger/20 pt-6">
              <div className="mb-4 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-tertiary" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-tertiary">
                  System Response
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <div className="font-mono text-[10px] uppercase text-neutral-500">Confidence Band</div>
                  <div className="font-display text-lg font-bold uppercase text-white">UNCERTAIN</div>
                </div>
                <div className="space-y-1">
                  <div className="font-mono text-[10px] uppercase text-neutral-500">Uncertainty Interval</div>
                  <div className="font-display text-lg font-bold uppercase text-white">[0.31 — 0.82]</div>
                </div>
                <div className="space-y-1">
                  <div className="font-mono text-[10px] uppercase text-neutral-500">Escalation</div>
                  <div className="font-display text-lg font-bold uppercase text-danger">REQUIRED</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 border border-white/10 bg-black/40 p-3">
              <Users className="h-5 w-5 text-indigo" />
              <span className="font-mono text-xs text-neutral-300">
                <span className="text-indigo">reliability_engineer</span> assigned for manual review
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 border border-white/10 bg-surface-low p-4"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
              Why This Safeguard Matters
            </div>
            <div className="space-y-2 text-sm leading-7 text-text-muted">
              <p>
                <span className="text-white">Safety-first design:</span> When the model cannot confidently distinguish
                between normal and anomalous behavior, Astraea defaults to human oversight.
              </p>
              <p>
                <span className="text-white">Zero-trust execution:</span> No autonomous action is taken when
                uncertainty bands are wide or conflicting signals exist.
              </p>
              <p>
                <span className="text-white">Manager visibility:</span> All conflicting signal cases are escalated
                with full context for informed decision-making.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
