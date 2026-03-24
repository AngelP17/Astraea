'use client';

import { motion } from 'framer-motion';
import { Shield, RotateCcw, FileCheck, Activity } from 'lucide-react';

const metrics = [
  {
    label: 'Determinism Rate',
    value: '100%',
    icon: Shield,
    color: '#a1faff',
    description: 'Identical inputs produce identical outputs',
  },
  {
    label: 'Replay Accuracy',
    value: '100%',
    icon: RotateCcw,
    color: '#ac8aff',
    description: 'Every decision can be reproduced',
  },
  {
    label: 'Audit Coverage',
    value: '100%',
    icon: FileCheck,
    color: '#00f4fe',
    description: 'Full pipeline state preserved',
  },
  {
    label: 'Decision Confidence',
    value: '0.59',
    icon: Activity,
    color: '#ffd16f',
    description: 'Average across all decisions',
  },
];

export function SystemMetrics() {
  return (
    <section className="relative border-b border-white/5 bg-surface py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-10 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.28em] text-primary">System Health</div>
          <h2 className="mt-4 font-headline text-3xl font-black uppercase tracking-[-0.04em]">
            SYSTEM METRICS
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="border border-white/10 bg-black/40 p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <metric.icon className="h-8 w-8 shrink-0" style={{ color: metric.color }} />
                <span 
                  className="font-headline text-2xl font-black uppercase truncate"
                  style={{ color: metric.color }}
                >
                  {metric.value}
                </span>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 truncate">
                {metric.label}
              </div>
              <div className="mt-2 font-mono text-[9px] text-neutral-600">
                {metric.description}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <MetricBar label="Action Rate" value={100} color="#a1faff" />
          <MetricBar label="Human Review Rate" value={100} color="#ac8aff" />
          <MetricBar label="Rationale Coverage" value={67} color="#ffd16f" />
        </div>
      </div>
    </section>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.15em]">
        <span className="text-neutral-500">{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </div>
    </div>
  );
}