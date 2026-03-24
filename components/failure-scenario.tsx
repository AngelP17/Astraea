'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Users, ShieldAlert } from 'lucide-react';

export function FailureScenario() {
  return (
    <section className="relative border-b border-white/5 bg-background py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-12 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.28em] text-danger">Failure Mode</div>
          <h2 className="mt-5 font-headline text-4xl font-black uppercase tracking-[-0.04em]">
            CONFLICTING SIGNALS SCENARIO
          </h2>
        </div>

        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border border-danger/20 bg-danger/5 p-6"
          >
            <div className="mb-6 flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 shrink-0 text-danger" />
              <div>
                <h3 className="font-headline text-lg font-bold uppercase text-danger">
                  Event A + Event B = HUMAN_REVIEW
                </h3>
                <p className="mt-2 font-mono text-sm text-neutral-400">
                  When multiple events produce conflicting signals, Astraea routes to human review for safety.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-white/10 bg-black/40 p-4">
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
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
                <span className="font-headline text-sm font-bold uppercase text-tertiary">
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
                  <div className="font-headline text-lg font-bold uppercase text-white">UNCERTAIN</div>
                </div>
                <div className="space-y-1">
                  <div className="font-mono text-[10px] uppercase text-neutral-500">Uncertainty Interval</div>
                  <div className="font-headline text-lg font-bold uppercase text-white">[0.31 — 0.82]</div>
                </div>
                <div className="space-y-1">
                  <div className="font-mono text-[10px] uppercase text-neutral-500">Escalation</div>
                  <div className="font-headline text-lg font-bold uppercase text-danger">REQUIRED</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 border border-white/10 bg-black/40 p-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-mono text-xs text-neutral-300">
                <span className="text-primary">reliability_engineer</span> assigned for manual review
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
              Why This Matters
            </div>
            <div className="space-y-2 font-mono text-xs text-neutral-400">
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