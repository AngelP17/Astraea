'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Play, Loader2, CheckCircle2, AlertTriangle, Zap, RotateCcw, GitBranch, Shield, FileCheck, RotateCcwIcon, Activity, Waves } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { fetchCases, runLivePipeline, replayCase, runDemoMode, PipelineResult, DemoResult } from '@/lib/data';

const trustSignals = [
  { label: 'DETERMINISM', value: '100%', icon: Shield, color: '#a1faff' },
  { label: 'REPLAY', value: 'VERIFIED', icon: RotateCcwIcon, color: '#ac8aff' },
  { label: 'AUDIT', value: 'COMPLETE', icon: FileCheck, color: '#00f4fe' },
];

export function Hero() {
  const [cases, setCases] = useState<PipelineResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [hasRunLive, setHasRunLive] = useState(false);
  const [replayResult, setReplayResult] = useState<PipelineResult | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const [showDemoResults, setShowDemoResults] = useState(false);
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);

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
    try {
      const result = await runLivePipeline();
      if (result) {
        setCases((prev) => {
          const exists = prev.find((c) => c.case_id === result.case_id);
          if (exists) return prev;
          return [...prev, result];
        });
        setActiveIndex((prev) => prev + 1);
        setHasRunLive(true);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleReplay = async () => {
    if (!active) return;
    setIsReplaying(true);
    setShowReplay(true);
    try {
      const result = await replayCase(active.case_id);
      if (result) {
        setReplayResult(result);
      }
    } finally {
      setIsReplaying(false);
    }
  };

  const handleRunDemo = async () => {
    setIsDemoRunning(true);
    setDemoProgress(0);
    setShowDemoResults(false);
    try {
      const progressInterval = setInterval(() => {
        setDemoProgress(p => Math.min(p + 5, 95));
      }, 200);
      
      const result = await runDemoMode();
      
      clearInterval(progressInterval);
      setDemoProgress(100);
      
      if (result) {
        setDemoResult(result);
        setCases(result.results);
        setActiveIndex(0);
        setShowDemoResults(true);
        setHasRunLive(true);
      }
    } finally {
      setIsDemoRunning(false);
    }
  };

  const active = cases[activeIndex];

  return (
    <section id="top" className="relative flex min-h-screen items-center overflow-hidden border-b border-white/5 pt-20">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute left-[10%] top-[15%] h-72 w-72 rounded-full bg-secondary/10 blur-[140px]" />
      <div className="absolute right-[8%] top-[30%] h-96 w-96 rounded-full bg-primary/10 blur-[160px]" />
      <div className="absolute bottom-[10%] left-[30%] h-64 w-64 rounded-full bg-tertiary/10 blur-[120px]" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-6 pb-12 pt-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <div className="mb-4 flex flex-wrap gap-4">
              {trustSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="flex items-center gap-2 border border-white/10 bg-white/[0.02] px-3 py-2"
                >
                  <signal.icon className="h-4 w-4" style={{ color: signal.color }} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                    {signal.label}:
                  </span>
                  <span className="font-headline text-xs font-bold uppercase" style={{ color: signal.color }}>
                    {signal.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-2 font-mono text-xs uppercase tracking-[0.32em] text-primary"
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
            className="font-headline text-[2.8rem] font-black uppercase leading-[0.86] tracking-[-0.06em] text-white md:text-[4rem] lg:text-[5rem]"
          >
            ASTRAEA
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16 }}
            className="mt-6 max-w-2xl text-left font-body text-base leading-7 text-neutral-400 lg:text-lg"
          >
            A deterministic decision engine that transforms event streams into 
            explainable, replayable, and auditable actions.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-4 max-w-2xl text-left font-mono text-xs leading-6 text-neutral-500"
          >
            It combines anomaly detection, graph reasoning, and execution planning 
            to produce decisions that can be verified and reproduced exactly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22 }}
            className="mt-8 flex flex-col gap-4 sm:flex-row"
          >
            <button
              onClick={handleRunLive}
              disabled={isRunning || isDemoRunning}
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
            <button
              onClick={handleRunDemo}
              disabled={isDemoRunning || isRunning}
              className="group inline-flex items-center justify-center border border-tertiary/30 bg-tertiary/5 px-8 py-4 font-headline text-sm font-bold uppercase tracking-[0.22em] text-tertiary transition-all duration-150 hover:bg-tertiary/10 hover:shadow-[0_0_20px_rgba(0,244,254,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDemoRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  STREAMING {demoProgress}%
                </>
              ) : (
                <>
                  <Waves className="mr-2 h-4 w-4" />
                  RUN 100-EVENT DEMO
                </>
              )}
            </button>
            <button
              onClick={handleReplay}
              disabled={isReplaying || !active || showDemoResults}
              className="group inline-flex items-center justify-center border border-secondary/30 bg-secondary/5 px-8 py-4 font-headline text-sm font-bold uppercase tracking-[0.22em] text-secondary transition-all duration-150 hover:bg-secondary/10 hover:shadow-[0_0_20px_rgba(172,138,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isReplaying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  REPLAYING...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  REPLAY THIS DECISION
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
            className="mt-5 flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500"
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
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/5 pb-3">
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500 truncate">
                  {showDemoResults ? 'DEMO MODE - 100 EVENTS' : showReplay && replayResult ? 'REPLAY RESULT' : cases.length > 0 ? 'Live Decision Output' : 'Waiting for pipeline...'}
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                  {showDemoResults ? (
                    <span className="flex items-center gap-2">
                      <Waves className="h-3 w-3 shrink-0" />
                      <span className="truncate">STREAMING PIPELINE COMPLETE</span>
                    </span>
                  ) : showReplay && replayResult ? (
                    <span className="flex items-center gap-2">
                      <GitBranch className="h-3 w-3 shrink-0" />
                      <span className="truncate">VERIFIED REPLAY</span>
                    </span>
                  ) : (
                    <span className="truncate">Event → Feature → Score → Decide → Audit</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-danger/70" />
                <span className="h-2 w-2 rounded-full bg-tertiary/80" />
                <span className="h-2 w-2 rounded-full bg-primary/80" />
              </div>
            </div>

            {showReplay && replayResult ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={replayResult.case_id + '-replay'}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-4"
                >
                  <div className="grid gap-3 border border-secondary/20 bg-secondary/5 p-4 sm:grid-cols-2">
                    <InfoRow label="CASE_ID" value={replayResult.case_id} valueClass="text-secondary" />
                    <InfoRow label="EVENT" value={replayResult.event.event_type} />
                    <InfoRow label="MACHINE" value={replayResult.event.machine_id} />
                    <InfoRow
                      label="SEVERITY"
                      value={replayResult.prioritized_case.severity}
                      valueClass={
                        replayResult.prioritized_case.severity === 'critical'
                          ? 'text-danger'
                          : replayResult.prioritized_case.severity === 'high'
                          ? 'text-tertiary'
                          : ''
                      }
                    />
                    <InfoRow label="PRIORITY" value={replayResult.prioritized_case.priority_score.toFixed(3)} />
                    <InfoRow label="CONFIDENCE" value={replayResult.assessment.confidence.toFixed(3)} />
                  </div>

                  <div className="border border-white/5 bg-surface p-4">
                    <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-secondary">
                      Replay Verification
                    </div>
                    <div className="space-y-2 font-mono text-xs text-neutral-300">
                      <div className="flex items-start gap-2 truncate">
                        <span className="text-secondary shrink-0">[HASH]</span>
                        <span className="truncate">{replayResult.audit.deterministic_hash.slice(0, 24)}...</span>
                      </div>
                      <div className="flex items-start gap-2 truncate">
                        <span className="text-secondary shrink-0">[RATIONALE]</span>
                        <span className="truncate">{replayResult.prioritized_case.rationale.length} factors</span>
                      </div>
                      <div className="flex items-start gap-2 truncate">
                        <span className="text-secondary shrink-0">[DECISION]</span>
                        <span className="truncate">{replayResult.decision.recommendation}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border border-secondary/20 bg-secondary/5 p-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-secondary truncate">
                      REPLAY VERIFIED - Same input produces identical output
                    </span>
                  </div>

                  <button
                    onClick={() => setShowReplay(false)}
                    className="w-full border border-white/10 bg-white/[0.02] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:bg-white/[0.06]"
                  >
                    Back to Live Output
                  </button>
                </motion.div>
              </AnimatePresence>
            ) : active ? (
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
                      <div className="flex items-start gap-2 truncate">
                        <span className="text-primary shrink-0">[INGESTION]</span>
                        <span className="truncate">{active.event.source}</span>
                      </div>
                      <div className="flex items-start gap-2 truncate">
                        <span className="text-secondary shrink-0">[FEATURE]</span>
                        <span className="truncate">{Object.keys(active.features.features).length} features extracted</span>
                      </div>
                      <div className="flex items-start gap-2 truncate">
                        <span className="text-danger shrink-0">[MODEL]</span>
                        <span className="truncate">anomaly={active.assessment.anomaly_score.toFixed(3)}, failure={active.assessment.failure_probability.toFixed(3)}</span>
                      </div>
                      <div className="flex items-start gap-2 truncate">
                        <span className="text-tertiary shrink-0">[DECISION]</span>
                        <span className="truncate">{active.decision.recommendation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary shrink-0">[AUDIT]</span>
                        <span className="truncate text-[10px] text-neutral-500">
                          {active.audit.deterministic_hash.slice(0, 24)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  {active.consequence && (
                    <div className="border border-tertiary/20 bg-tertiary/5 p-4">
                      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-tertiary">
                        Consequence
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="min-w-0">
                          <div className="font-mono text-[10px] uppercase text-neutral-500 truncate">Downtime</div>
                          <div className="font-headline text-base font-bold uppercase text-tertiary truncate">
                            {active.consequence.downtime_avoided_minutes} min
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono text-[10px] uppercase text-neutral-500 truncate">Risk</div>
                          <div className="font-headline text-base font-bold uppercase text-danger truncate">
                            {active.consequence.risk_level}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono text-[10px] uppercase text-neutral-500 truncate">Escalate</div>
                          <div className="font-headline text-base font-bold uppercase text-white truncate">
                            {active.consequence.escalation_required ? 'YES' : 'NO'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 border border-primary/20 bg-primary/5 p-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-primary" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary truncate">
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
    <div className="min-w-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500 truncate">{label}</div>
      <div className={`mt-2 font-headline text-xl font-bold uppercase tracking-tight text-white truncate ${valueClass ?? ''}`}>
        {value}
      </div>
    </div>
  );
}