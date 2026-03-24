'use client';

import { motion } from 'framer-motion';
import { metrics } from '@/lib/data';

export function AuditSection() {
  return (
    <section id="audit" className="relative border-b border-white/5 py-24">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-14 max-w-3xl">
          <div className="font-mono text-xs uppercase tracking-[0.28em] text-tertiary">REPLAY + AUDIT</div>
          <h2 className="mt-4 font-headline text-4xl font-black uppercase leading-none tracking-[-0.04em] md:text-6xl">
            Determinism is the product, not just a feature.
          </h2>
          <p className="mt-6 text-lg leading-8 text-neutral-400">
            Astraea does not stop at scoring. It persists the path from input event to execution plan as a stable, inspectable record. That is the trust layer.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65 }}
            className="panel p-1"
          >
            <div className="border border-white/5 bg-black/70 p-8">
              <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">Audit Bundle</div>
              <div className="space-y-3 font-mono text-sm text-neutral-300">
                <div className="border border-white/5 bg-surface-low p-4"><span className="text-primary">EVENT_SNAPSHOT</span> → normalized source record</div>
                <div className="border border-white/5 bg-surface-low p-4"><span className="text-secondary">FEATURE_SNAPSHOT</span> → ratios, deltas, context</div>
                <div className="border border-white/5 bg-surface-low p-4"><span className="text-danger">MODEL_SNAPSHOT</span> → score, confidence, uncertainty</div>
                <div className="border border-white/5 bg-surface-low p-4"><span className="text-tertiary">DECISION_SNAPSHOT</span> → severity, routing, action plan</div>
                <div className="border border-primary/20 bg-primary/5 p-4 text-primary">DETERMINISTIC_HASH → SHA256(event, features, model, decision, execution)</div>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="border border-white/5 bg-surface-low p-6"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">{metric.label}</div>
                <div className="mt-4 font-headline text-4xl font-black uppercase text-white">{metric.value}</div>
                <div className="mt-3 text-sm text-neutral-500">{metric.hint}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}