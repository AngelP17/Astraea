'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const pipelineStages = [
  { id: 'ingest', label: 'Ingest', icon: '📥', color: '#a1faff', description: 'Raw telemetry capture' },
  { id: 'normalize', label: 'Normalize', icon: '⚡', color: '#ac8aff', description: 'Schema validation' },
  { id: 'feature', label: 'Feature', icon: '🔢', color: '#dac9ff', description: 'Threshold analysis' },
  { id: 'score', label: 'Score', icon: '📊', color: '#ff716c', description: 'Anomaly detection' },
  { id: 'prioritize', label: 'Prioritize', icon: '🎯', color: '#ffd16f', description: 'Risk ranking' },
  { id: 'decide', label: 'Decide', icon: '✅', color: '#00f4fe', description: 'Action resolution' },
  { id: 'audit', label: 'Audit', icon: '🔐', color: '#a1faff', description: 'Hash verification' },
];

export function PipelineDiagram() {
  const [activeStage, setActiveStage] = useState<number | null>(null);

  return (
    <section className="relative border-b border-white/5 bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-16 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Architecture</div>
          <h2 className="mt-5 font-headline text-4xl font-black uppercase tracking-[-0.04em] md:text-5xl">
            7-Stage Deterministic Pipeline
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-neutral-400">
            Every decision flows through a deterministic control loop. No randomness. No black boxes. Full auditability.
          </p>
        </div>

        <div className="relative overflow-x-auto pb-8">
          <div className="mx-auto flex min-w-[940px] items-start justify-between gap-3">
            {pipelineStages.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-3">
                <motion.div
                  className="relative flex flex-col items-center"
                  onMouseEnter={() => setActiveStage(index)}
                  onMouseLeave={() => setActiveStage(null)}
                >
                <motion.div
                  className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 text-2xl"
                  style={{ 
                    borderColor: stage.color,
                    backgroundColor: activeStage === index ? `${stage.color}20` : 'rgba(10,10,10,0.8)',
                  }}
                  animate={{
                    scale: activeStage === index ? 1.15 : 1,
                    boxShadow: activeStage === index ? `0 0 30px ${stage.color}40` : 'none',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {stage.icon}
                </motion.div>
                
                <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] whitespace-nowrap" style={{ color: stage.color }}>
                  {stage.label}
                </div>
                
                <div className="mt-1 h-1 w-12 rounded-full bg-white/10">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ backgroundColor: stage.color }}
                    initial={{ width: '0%' }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                  />
                </div>

                {activeStage === index && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-4 whitespace-nowrap rounded border border-white/10 bg-black/90 px-3 py-2 font-mono text-[10px] text-neutral-300"
                  >
                    {stage.description}
                  </motion.div>
                )}
                </motion.div>

                {index < pipelineStages.length - 1 && (
                  <div className="flex min-w-10 items-center">
                    <div className="h-px w-7" style={{ backgroundColor: `${stage.color}99` }} />
                    <div
                      className="h-2 w-2 rotate-45 border-r border-t"
                      style={{ borderColor: `${stage.color}99` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-3">
          <FeatureCard
            title="Deterministic Hash"
            description="Every pipeline stage produces a SHA256 hash. Reproduce any decision by replaying the same input."
            code="hash = sha256(event + features + model + decision)"
            color="#a1faff"
          />
          <FeatureCard
            title="Uncertainty Quantification"
            description="Every decision includes confidence intervals. Know exactly when the model is uncertain."
            code="uncertainty = [0.614 — 0.866]"
            color="#ff716c"
          />
          <FeatureCard
            title="Zero-Trust Execution"
            description="All decisions require human review under uncertainty. No fully autonomous actions."
            code="if confidence < threshold: human_review_required"
            color="#ffd16f"
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ title, description, code, color }: { title: string; description: string; code: string; color: string }) {
  return (
    <motion.div
      className="panel overflow-hidden p-1"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="border border-white/5 bg-black/60 p-6">
        <div className="mb-4 h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        <h3 className="font-headline text-xl font-bold uppercase" style={{ color }}>
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-neutral-400">{description}</p>
        <div className="mt-4 rounded bg-surface-low p-3 font-mono text-[10px] text-primary/80">
          {code}
        </div>
      </div>
    </motion.div>
  );
}
