'use client';

import { motion } from 'framer-motion';
import { Clock, AlertTriangle, GitBranch, ShieldCheck, DollarSign, Zap } from 'lucide-react';

export function CaseStudy() {
  return (
    <section className="relative border-b border-white/5 bg-background py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-12 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Case Study</div>
          <h2 className="mt-5 font-headline text-4xl font-black uppercase tracking-[-0.04em]">
            PREVENTING LINE FAILURE
          </h2>
        </div>

        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative border border-white/10 bg-surface-low"
          >
            <div className="absolute -left-px top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-danger" />

            <div className="p-8">
              <div className="mb-6 flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                  02:13 AM — March 23, 2026
                </span>
              </div>

              <div className="mb-6 border-l-2 border-primary/30 pl-4">
                <p className="font-body text-lg leading-relaxed text-neutral-200">
                  <span className="text-white">Astraea detected abnormal vibration patterns</span> on Press_07, 
                  correlating across 3 machines on line_7. A standard threshold system would have 
                  triggered a generic alert. Astraea did more.
                </p>
              </div>

              <div className="mb-8 space-y-4">
                <StepItem 
                  icon={AlertTriangle}
                  color="#ff716c"
                  title="Abnormal Vibration Detected"
                  description="Vibration ratio exceeded 1.55x baseline on feeder_motor_A3"
                />
                <StepItem 
                  icon={GitBranch}
                  color="#ac8aff"
                  title="Cross-Machine Correlation"
                  description="Pattern matched 2 additional events within 300-second window"
                />
                <StepItem 
                  icon={Zap}
                  color="#ffd16f"
                  title="High-Confidence Anomaly"
                  description="Anomaly score 0.74, failure probability 0.68, confidence band HIGH"
                />
                <StepItem 
                  icon={ShieldCheck}
                  color="#00f4fe"
                  title="Immediate Inspection Routed"
                  description="Case escalated to operations_supervisor with full audit bundle"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <ResultCard 
                  icon={Clock}
                  value="45"
                  unit="min"
                  label="Downtime Avoided"
                  color="#a1faff"
                />
                <ResultCard 
                  icon={DollarSign}
                  value="3,200"
                  unit="USD"
                  label="Estimated Savings"
                  color="#ffd16f"
                />
                <ResultCard 
                  icon={ShieldCheck}
                  value="100%"
                  unit=""
                  label="Failure Prevented"
                  color="#00f4fe"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-8 border border-tertiary/20 bg-tertiary/5 p-6"
          >
            <h3 className="mb-4 font-headline text-lg font-bold uppercase text-tertiary">
              Why This Matters
            </h3>
            <div className="space-y-4">
              <p className="font-body text-neutral-300">
                <span className="text-white">Without Astraea:</span> A threshold alert fires at 02:13 AM. 
                On-call engineer guesses. Parts are staged wrong. Machine stays down for 3 hours.
              </p>
              <p className="font-body text-neutral-300">
                <span className="text-white">With Astraea:</span> Full context, propagation risk, 
                and recommended action at 02:13 AM. Right parts, right team, right decisions. 
                Line runs until scheduled maintenance.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StepItem({ 
  icon: Icon, 
  color, 
  title, 
  description 
}: { 
  icon: typeof AlertTriangle; 
  color: string; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="flex items-start gap-4">
      <div 
        className="flex h-10 w-10 shrink-0 items-center justify-center border"
        style={{ borderColor: `${color}50`, backgroundColor: `${color}10` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <div className="font-headline text-sm font-bold uppercase" style={{ color }}>
          {title}
        </div>
        <div className="mt-1 font-mono text-xs text-neutral-400">
          {description}
        </div>
      </div>
    </div>
  );
}

function ResultCard({ 
  icon: Icon, 
  value, 
  unit, 
  label, 
  color 
}: { 
  icon: typeof Clock; 
  value: string; 
  unit: string; 
  label: string; 
  color: string; 
}) {
  return (
    <div className="border border-white/10 bg-black/40 p-4 text-center">
      <Icon className="mx-auto h-6 w-6 mb-2" style={{ color }} />
      <div className="font-headline text-3xl font-black uppercase" style={{ color }}>
        {value}<span className="text-lg">{unit}</span>
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-500">
        {label}
      </div>
    </div>
  );
}