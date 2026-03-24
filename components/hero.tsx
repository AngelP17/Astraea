'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Play, Loader2, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { fetchCases, runLivePipeline, PipelineResult } from '@/lib/data';

export function Hero() {
  const [cases, setCases] = useState<PipelineResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRunLive, setHasRunLive] = useState(false);

  const loadCases = useCallback(async () => {
    const data = await fetchCases();
    if (data.length > 0) {
      setCases(data);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    if (cases.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % cases.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [cases.length]);

  const handleRunLive = async () => {
    setIsRunning(true);
    const result = await runLivePipeline();
    setIsRunning(false);
    if (result) {
      setCases((prev) => {
        const exists = prev.find((c) => c.case_id === result.case_id);
        if (exists) return prev;
        return [...prev, result];
      });
      setActiveIndex(cases.length);
      setHasRunLive(true);
    }
  };

  const active = cases[activeIndex];

  return (
    <section id="top" className="relative flex min-h-screen items-center overflow-hidden border-b border-white/5 pt-24">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute left-[10%] top-[15%] h-72 w-72 rounded-full bg-secondary/10 blur-[140px]" />
      <div className="absolute right-[8%] top-[30%] h-96 w-96 rounded-full bg-primary/10 blur-[160px]" />
      <div className="absolute bottom-[10%] left-[30%] h-64 w-64 rounded-full bg-tertiary/10 blur-[120px]" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-14 px-6 pb-20 pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 font-mono text-xs uppercase tracking-[0.32em] text-primary"
          >
            {hasRunLive ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                LIVE PIPELINE EXECUTED
              </span>
            ) : (
              'SYSTEM_BOOT_SEQUENCE'
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08 }}
            className="font-headline text-[4.4rem] font-black uppercase leading-[0.86] tracking-[-0.06em] text-white md:text-[7rem] lg:text-[9rem]"
          >
            ASTRAEA
            <span className="block text-white/25">Decision Infrastructure</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16 }}
            className="mt-8 max-w-2xl text-left font-body text-lg leading-8 text-neutral-400 lg:text-xl"
          >
            A deterministic decision engine for event-driven systems. Every input is traceable. Every decision is explainable. Every outcome is reproducible.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <button
              onClick={handleRunLive}
              disabled={isRunning}
              className="group inline-flex items-center justify-center bg-primary-container px-8 py-4 font-headline text-sm font-bold uppercase tracking-[0.22em] text-[#004346] transition-all duration-150 hover:shadow-[0_0_20px_rgba(0,244,254,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  EXECUTING...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  RUN LIVE PIPELINE
                </>
              )}
            </button>
            <a
              href="#pipeline"
              className="group inline-flex items-center justify-center border border-white/10 bg-white/[0.02] px-8 py-4 font-headline text-sm font-bold uppercase tracking-[0.22em] text-white transition-colors duration-150 hover:bg-white/[0.06]"
            >
              Explore System
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28 }}
            className="mt-6 flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Deterministic
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              Replayable
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-tertiary" />
              Auditable
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.18 }}
          className="panel relative overflow-hidden p-1"
        >
          <div className="border border-white/5 bg-black/70 p-5 scanline">
            <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500">
                  {cases.length > 0 ? 'Live Decision Output' : 'Waiting for pipeline...'}
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                  Event → Feature → Score → Decide → Audit
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-danger/70" />
                <span className="h-2 w-2 rounded-full bg-tertiary/80" />
                <span className="h-2 w-2 rounded-full bg-primary/80" />
              </div>
            </div>

            {active ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.case_id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-4"
                >
                  <div className="grid gap-3 border border-white/5 bg-surface-low p-4 sm:grid-cols-2">
                    <InfoRow label="CASE_ID" value={active.case_id} valueClass="text-primary" />
                    <InfoRow label="EVENT" value={active.event.event_type} />
                    <InfoRow label="MACHINE" value={active.event.machine_id} />
                    <InfoRow
                      label="SEVERITY"
                      value={active.prioritized_case.severity}
                      valueClass={
                        active.prioritized_case.severity === 'critical'
                          ? 'text-danger'
                          : active.prioritized_case.severity === 'high'
                          ? 'text-tertiary'
                          : ''
                      }
                    />
                    <InfoRow label="PRIORITY" value={active.prioritized_case.priority_score.toFixed(3)} />
                    <InfoRow label="CONFIDENCE" value={active.assessment.confidence.toFixed(3)} />
                  </div>

                  <div className="border border-white/5 bg-surface p-4">
                    <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
                      Decision Bundle
                    </div>
                    <div className="space-y-2 font-mono text-xs text-neutral-300">
                      <div>
                        <span className="text-primary">[INGESTION]</span> {active.event.source}
                      </div>
                      <div>
                        <span className="text-secondary">[FEATURE]</span> {Object.keys(active.features.features).length} features extracted
                      </div>
                      <div>
                        <span className="text-danger">[MODEL]</span> anomaly={active.assessment.anomaly_score.toFixed(3)}, failure={active.assessment.failure_probability.toFixed(3)}
                      </div>
                      <div>
                        <span className="text-tertiary">[DECISION]</span> {active.decision.recommendation}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary">[AUDIT]</span>
                        <span className="truncate text-[10px] text-neutral-500">
                          {active.audit.deterministic_hash.slice(0, 24)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border border-primary/20 bg-primary/5 p-3">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                      Uncertainty: [{active.assessment.uncertainty_low.toFixed(3)} — {active.assessment.uncertainty_high.toFixed(3)}]
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Play className="h-12 w-12 text-neutral-600" />
                <div className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Run pipeline to see decisions
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">{label}</div>
      <div className={`mt-2 font-headline text-xl font-bold uppercase tracking-tight text-white ${valueClass ?? ''}`}>
        {value}
      </div>
    </div>
  );
}