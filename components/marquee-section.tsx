'use client';

import { Cpu, ShieldCheck, Hash, Graph, Pulse, Gauge, Lightning, Waves, GitBranch, Lock } from '@phosphor-icons/react';

const items = [
  { icon: Cpu, label: 'Event Capture' },
  { icon: Pulse, label: 'Normalization' },
  { icon: Gauge, label: 'Feature Engine' },
  { icon: Graph, label: 'Anomaly Scoring' },
  { icon: ShieldCheck, label: 'Prioritization' },
  { icon: Lightning, label: 'Decision Dispatch' },
  { icon: Hash, label: 'Audit Proof' },
  { icon: Waves, label: 'Streaming' },
  { icon: GitBranch, label: 'Replay' },
  { icon: Lock, label: 'Zero Trust' },
];

export function MarqueeSection() {
  return (
    <section className="relative overflow-hidden border-y border-white/6 py-12">
      <div className="absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
      <div className="flex animate-marquee whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <div key={i} className="mx-8 flex items-center gap-3">
            <item.icon className="h-5 w-5 text-amber" />
            <span className="font-mono text-sm uppercase tracking-[0.2em] text-text-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
