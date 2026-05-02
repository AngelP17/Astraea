'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Hash, Graph, ShieldCheck, Cpu, Gauge, Pulse } from '@phosphor-icons/react';

export function BentoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="pipeline" className="relative py-32 md:py-48">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 max-w-2xl"
        >
          <h2 className="font-display text-display-lg font-extrabold tracking-[-0.02em] text-white">
            Operational trust, built into every decision
          </h2>
          <p className="mt-5 text-body-lg text-text-muted">
            Astraea turns raw telemetry into a deterministic proof bundle. Each stage is hashed, replayable, and auditable.
          </p>
        </motion.div>

        <div className="grid grid-cols-4 grid-rows-2 gap-4 grid-flow-dense">
          {/* Card 1: Large feature card with inline image */}
          <div className="col-span-4 md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-2xl border border-white/6 bg-surface p-6 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.08),transparent_40%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber/20 bg-amber/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-amber">
                  <Hash className="h-3 w-3" />
                  Deterministic Hashing
                </div>
                <h3 className="mt-6 font-display text-2xl font-bold uppercase tracking-tight text-white md:text-3xl">
                  Every stage produces a{' '}
                  <span className="inline-block h-8 w-20 rounded-full align-middle bg-cover bg-center mx-1 border border-white/10" style={{ backgroundImage: 'url(https://picsum.photos/seed/hashproof/1920/1080)' }} />
                  {' '}proof
                </h3>
              </div>
              <p className="mt-6 max-w-sm text-sm leading-6 text-text-muted">
                Event, feature, model, prioritization, and execution snapshots are captured and bound by a SHA256 hash. Reproduce any decision exactly.
              </p>
            </div>
          </div>

          {/* Card 2: Horizontal accordion slices */}
          <div className="col-span-4 md:col-span-2 md:row-span-1 group relative overflow-hidden rounded-2xl border border-white/6 bg-surface">
            <div className="flex h-full">
              {[
                { label: 'Ingest', icon: Pulse, color: 'text-amber', bg: 'bg-amber/10', border: 'border-amber/20' },
                { label: 'Score', icon: Gauge, color: 'text-zinc-400', bg: 'bg-white/5', border: 'border-white/10' },
                { label: 'Decide', icon: Cpu, color: 'text-zinc-400', bg: 'bg-white/5', border: 'border-white/10' },
                { label: 'Audit', icon: ShieldCheck, color: 'text-zinc-400', bg: 'bg-white/5', border: 'border-white/10' },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className={`flex flex-1 flex-col items-center justify-center gap-3 border-r border-white/6 px-4 py-6 transition-all duration-500 hover:flex-[2] hover:${item.bg} cursor-default ${i === 3 ? 'border-r-0' : ''}`}
                >
                  <item.icon className={`h-6 w-6 ${i === 0 ? item.color : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                  <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${i === 0 ? item.color : 'text-zinc-500'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Metric */}
          <div className="col-span-2 md:col-span-1 md:row-span-1 group relative overflow-hidden rounded-2xl border border-white/6 bg-surface p-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.06),transparent_50%)]" />
            <div className="relative z-10">
              <Graph className="h-5 w-5 text-success" />
              <div className="mt-4 font-display text-3xl font-black tracking-tight text-white">100%</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">Replay Fidelity</div>
            </div>
          </div>

          {/* Card 4: Feature */}
          <div className="col-span-2 md:col-span-1 md:row-span-1 group relative overflow-hidden rounded-2xl border border-white/6 bg-surface p-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.06),transparent_50%)]" />
            <div className="relative z-10">
              <Cpu className="h-5 w-5 text-amber" />
              <div className="mt-4 font-display text-3xl font-black tracking-tight text-white">7</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">Pipeline Stages</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
