'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Cpu, Brain, GitBranch, Play, Clock } from 'lucide-react';

const timelineStages = [
  {
    id: 't0',
    label: 't0: Event',
    icon: Database,
    color: '#a1faff',
    description: 'Raw telemetry captured',
    detail: 'sensor_id: accel_01\nvibration: 12.4\ntimestamp: 14:32:00',
  },
  {
    id: 't1',
    label: 't1: Anomaly',
    icon: Cpu,
    color: '#ac8aff',
    description: 'Feature extraction complete',
    detail: 'delta_vib: +4.4\nratio_vib: 1.55\nthreshold_breaches: 2',
  },
  {
    id: 't2',
    label: 't2: Score',
    icon: Brain,
    color: '#ff716c',
    description: 'Model assessment ready',
    detail: 'anomaly: 0.74\nfailure_prob: 0.68\nconfidence: 0.81',
  },
  {
    id: 't3',
    label: 't3: Decision',
    icon: GitBranch,
    color: '#ffd16f',
    description: 'Decision resolved',
    detail: 'severity: HIGH\nrouting: human_review\nrecommendation: Inspect',
  },
  {
    id: 't4',
    label: 't4: Execution',
    icon: Play,
    color: '#00f4fe',
    description: 'Action dispatched',
    detail: 'team: reliability_eng\nticket: created\nescalation: pending',
  },
];

export function TimelineView() {
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handlePlay = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setCurrentStep(0);
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= timelineStages.length - 1) {
          clearInterval(interval);
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  return (
    <section className="relative border-b border-white/5 bg-background py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-12 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Streaming View</div>
          <h2 className="mt-5 font-headline text-4xl font-black uppercase tracking-[-0.04em]">
            DECISION TIMELINE
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-neutral-400">
            From event capture to execution dispatch in milliseconds. Full pipeline traceability.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-secondary via-danger via-tertiary to-primary opacity-30" />

            <div className="space-y-6">
              {timelineStages.map((stage, index) => {
                const isActive = activeStage === index || currentStep >= index;
                const isCurrent = currentStep === index;

                return (
                  <motion.div
                    key={stage.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex gap-6"
                    onMouseEnter={() => setActiveStage(index)}
                    onMouseLeave={() => setActiveStage(null)}
                  >
                    <div
                      className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center border-2 transition-all duration-300"
                      style={{
                        borderColor: isActive ? stage.color : '#494847',
                        backgroundColor: isActive ? `${stage.color}20` : 'transparent',
                        boxShadow: isCurrent ? `0 0 30px ${stage.color}40` : 'none',
                      }}
                    >
                      <stage.icon
                        className="h-6 w-6 transition-colors"
                        style={{ color: isActive ? stage.color : '#494847' }}
                      />
                    </div>

                    <div className="flex-1 border border-white/10 bg-surface-low p-4 transition-all duration-300"
                      style={{
                        borderColor: isActive ? `${stage.color}50` : undefined,
                        backgroundColor: isActive ? `${stage.color}05` : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: stage.color }}>
                            {stage.label}
                          </div>
                          <div className="mt-1 font-headline text-lg font-bold uppercase text-white">
                            {stage.description}
                          </div>
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-neutral-500">
                          {isActive ? 'COMPLETE' : 'PENDING'}
                        </div>
                      </div>

                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 border-t border-white/10 pt-3"
                        >
                          <pre className="font-mono text-[10px] text-neutral-400 whitespace-pre">
                            {stage.detail}
                          </pre>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <button
              onClick={handlePlay}
              disabled={isPlaying}
              className="group inline-flex items-center gap-3 border border-primary/30 bg-primary/5 px-8 py-4 font-headline text-sm font-bold uppercase tracking-[0.22em] text-primary transition-all hover:bg-primary/10 hover:shadow-[0_0_30px_rgba(161,250,255,0.2)] disabled:opacity-50"
            >
              <Play className="h-5 w-5" />
              {isPlaying ? 'Streaming...' : 'Play Pipeline Stream'}
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="border border-white/10 bg-surface-low p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  Total Latency
                </span>
              </div>
              <div className="font-headline text-2xl font-bold uppercase text-white">
                ~847ms
              </div>
            </div>

            <div className="border border-white/10 bg-surface-low p-4">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="h-4 w-4 text-secondary" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  Events/sec
                </span>
              </div>
              <div className="font-headline text-2xl font-bold uppercase text-white">
                13,893
              </div>
            </div>

            <div className="border border-white/10 bg-surface-low p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-tertiary" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  Hash Verified
                </span>
              </div>
              <div className="font-headline text-2xl font-bold uppercase text-white">
                100%
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}