'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play, Loader2, CheckCircle2, Zap, GitBranch, Waves, Copy } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { fetchCases, runLivePipeline, replayCase, runDemoMode, streamDemoStages, PipelineResult, DemoResult, StageProgressEvent } from '@/lib/data';
import { DemoWalkthrough } from '@/components/demo-walkthrough';

const STAGES = ['INGESTION', 'FEATURE', 'MODEL', 'DECISION', 'AUDIT'] as const;
type StageName = typeof STAGES[number];

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

function formatCurrency(value: number | undefined) {
  if (typeof value !== 'number') return 'n/a';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDowntime(minutes: number | undefined) {
  if (minutes === undefined) return 'n/a';
  if (minutes >= 60) {
    const hrs = (minutes / 60).toFixed(1);
    return `${hrs} hrs`;
  }
  return `${minutes} min`;
}

function getActiveStageFromResult(result: PipelineResult | null): number {
  if (!result) return 0;
  if (result.audit) return 4;
  if (result.decision) return 3;
  if (result.prioritized_case) return 2;
  if (result.assessment) return 2;
  if (result.features) return 1;
  return 0;
}

function HeroHeadline() {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.05,
        delayChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.1 : 0.4, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo" />
        <span className="font-display text-[11px] font-medium uppercase tracking-[0.1em] text-indigo">
          Deterministic Decision Infrastructure
        </span>
      </motion.div>

      <motion.h1
        variants={itemVariants}
        className="font-display text-[clamp(3.5rem,10vw,7rem)] font-extrabold tracking-[-0.03em] leading-[1.0] text-white"
      >
        ASTRAEA
      </motion.h1>

      <motion.p
        variants={itemVariants}
        className="max-w-[480px] font-body text-lg text-text-muted leading-[1.5]"
      >
        Explainable Operational Decisions For Industrial Systems
      </motion.p>

      <motion.p
        variants={itemVariants}
        className="max-w-[40rem] text-sm leading-7 text-text-muted md:text-base"
      >
        Process volatile telemetry, quantify uncertainty, and route high-stakes actions with a proof bundle that your operators, customers, and investors can actually inspect.
      </motion.p>
    </motion.div>
  );
}

interface HeroCTAsProps {
  onRunLive: () => void;
  onRunDemo: () => void;
  isRunning: boolean;
  isDemoRunning: boolean;
  liveProgress: number;
  demoProgress: number;
}

function HeroCTAs({ onRunLive, onRunDemo, isRunning, isDemoRunning, liveProgress, demoProgress }: HeroCTAsProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.05,
        delayChildren: prefersReducedMotion ? 0 : 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.1 : 0.4, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const buttonBaseClass = "inline-flex items-center justify-center px-8 py-4 font-display text-sm font-bold uppercase tracking-[0.22em] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap items-center gap-3"
    >
      <motion.div variants={itemVariants}>
        <button
          onClick={onRunLive}
          disabled={isRunning || isDemoRunning}
          className={`${buttonBaseClass} bg-indigo text-white hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(99,102,241,0.4)] active:translate-y-0`}
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              EXECUTING {liveProgress}%
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              RUN LIVE PIPELINE
            </>
          )}
        </button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <button
          onClick={onRunDemo}
          disabled={isDemoRunning || isRunning}
          className={`${buttonBaseClass} border border-white/10 bg-white/5 text-white hover:-translate-y-0.5 hover:bg-white/[0.08] active:translate-y-0`}
        >
          {isDemoRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              STREAMING {demoProgress}%
            </>
          ) : (
            <>
              <Waves className="mr-2 h-4 w-4" />
              RUN DEMO
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}

interface StageProgressBarProps {
  activeStage: number;
  isRunning: boolean;
}

function StageProgressBar({ activeStage, isRunning }: StageProgressBarProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex items-center gap-2">
      {STAGES.map((stage, index) => {
        const isActive = index <= activeStage;
        const isCurrent = index === activeStage;

        return (
          <div key={stage} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                className={`h-3 w-3 rounded-full border-2 transition-colors duration-200 ${
                  isActive
                    ? 'border-indigo bg-indigo'
                    : 'border-white/20 bg-transparent'
                }`}
                animate={isCurrent && isRunning ? {
                  scale: [1, 1.2, 1],
                  transition: { duration: 0.6, repeat: Infinity }
                } : {}}
                initial={prefersReducedMotion ? {} : { scale: 0.8 }}
                whileInView={prefersReducedMotion ? {} : { scale: isActive ? 1 : 0.8 }}
                transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              />
              <span className={`font-mono text-[9px] uppercase tracking-[0.12em] ${
                isActive ? 'text-indigo' : 'text-text-muted'
              }`}>
                {stage}
              </span>
            </div>
            {index < STAGES.length - 1 && (
              <motion.div
                className="h-px w-8 bg-white/10"
                initial={prefersReducedMotion ? {} : { scaleX: 0 }}
                animate={isActive ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ originX: 0 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface DecisionPanelProps {
  result: PipelineResult | null;
  isRunning: boolean;
  isDemoRunning: boolean;
  showReplay: boolean;
  replayResult: PipelineResult | null;
  onBackToLive: () => void;
}

function DecisionPanel({ result, isRunning, isDemoRunning, showReplay, replayResult, onBackToLive }: DecisionPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const activeResult = showReplay && replayResult ? replayResult : result;

  const handleCopy = useCallback(() => {
    if (activeResult?.audit?.deterministic_hash) {
      copyToClipboard(activeResult.audit.deterministic_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [activeResult]);

  const activeStage = getActiveStageFromResult(activeResult ?? null);

  if (!activeResult && !isRunning && !isDemoRunning) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="panel border border-white/5 p-6"
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Play className="h-10 w-10 text-text-muted" />
          <div className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
            Run pipeline to see decisions
          </div>
        </div>
      </motion.div>
    );
  }

  if (showReplay && replayResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="panel overflow-hidden border border-white/5"
      >
        <div className="border-b border-white/5 bg-secondary/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-secondary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-secondary">
                REPLAY RESULT
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-secondary">
                VERIFIED
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <InfoCell label="CASE_ID" value={replayResult.case_id} valueClass="text-secondary" />
            <InfoCell label="SEVERITY" value={replayResult.prioritized_case.severity.toUpperCase()} valueClass={
              replayResult.prioritized_case.severity === 'critical' ? 'text-danger' :
              replayResult.prioritized_case.severity === 'high' ? 'text-tertiary' : 'text-white'
            } />
            <InfoCell label="PRIORITY" value={replayResult.prioritized_case.priority_score.toFixed(3)} />
            <InfoCell label="CONFIDENCE" value={replayResult.assessment.confidence.toFixed(3)} />
          </div>

          <div className="border border-white/5 bg-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-secondary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-secondary">
                REPLAY VERIFIED
              </span>
            </div>
            <div className="space-y-2 font-mono text-xs text-neutral-300">
              <div className="flex items-center gap-2">
                <span className="text-secondary shrink-0">[HASH]</span>
                <span className="text-neutral-400">{replayResult.audit.deterministic_hash.slice(0, 24)}...</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary shrink-0">[RATIONALE]</span>
                <span className="text-neutral-400">{replayResult.prioritized_case.rationale.length} factors</span>
              </div>
            </div>
          </div>

          <button
            onClick={onBackToLive}
            className="w-full border border-white/10 bg-white/[0.02] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:bg-white/[0.06]"
          >
            Back to Live Output
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="panel overflow-hidden border border-white/5"
    >
      <div className="border-b border-white/5 bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-text-muted">
              {activeResult?.case_id ?? 'PROCESSING...'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo" />
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-indigo">AUDIT</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-tertiary/80" />
              <span className="h-2 w-2 rounded-full bg-secondary/80" />
              <span className="h-2 w-2 rounded-full bg-indigo/80" />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <StageProgressBar activeStage={activeStage} isRunning={isRunning || isDemoRunning} />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {activeResult && (
          <>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <InfoCell 
                label="MACHINE" 
                value={`${activeResult.event.machine_id} · ${activeResult.event.line_id}`} 
              />
              <InfoCell 
                label="SEVERITY" 
                value={activeResult.prioritized_case.severity.toUpperCase()} 
                valueClass={
                  activeResult.prioritized_case.severity === 'critical' ? 'text-danger' :
                  activeResult.prioritized_case.severity === 'high' ? 'text-tertiary' : 'text-white'
                }
                indicator={activeResult.prioritized_case.severity === 'critical' || activeResult.prioritized_case.severity === 'high' ? activeResult.prioritized_case.severity : undefined}
              />
              <InfoCell 
                label="PRIORITY" 
                value={`${activeResult.prioritized_case.priority_score.toFixed(0)} / 100`} 
              />
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">CONFIDENCE</span>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2 flex-1 bg-white/10 overflow-hidden rounded-full">
                    <motion.div 
                      className="h-full bg-indigo rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(activeResult.assessment.confidence * 100).toFixed(0)}%` }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <span className="font-display text-sm font-bold text-indigo">
                    {(activeResult.assessment.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-5">
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-indigo">
                DECISION: {activeResult.decision.recommendation}
              </div>
              <div className="flex flex-wrap gap-2">
                {['INGESTION', 'FEATURE', 'MODEL', 'DECISION', 'AUDIT'].map((stage, i) => (
                  <span
                    key={stage}
                    className={`border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
                      i <= activeStage
                        ? 'border-indigo/30 bg-indigo/10 text-indigo'
                        : 'border-white/10 bg-white/[0.02] text-text-muted'
                    }`}
                  >
                    {stage}
                  </span>
                ))}
              </div>
            </div>

            {activeResult.consequence && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/5 pt-5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-tertiary" />
                  <span className="text-text-muted">
                    {formatDowntime(activeResult.consequence.downtime_avoided_minutes)} downtime avoided
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-danger" />
                  <span className="text-text-muted">
                    {formatCurrency(activeResult.consequence.cost_estimate_usd)} prevented
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <div className="flex items-center gap-2 font-mono text-[10px] text-text-muted">
                <span className="text-indigo/60">sha256:</span>
                <span className="text-neutral-400">{activeResult.audit.deterministic_hash.slice(0, 16)}...</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 border border-white/10 bg-white/[0.02] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    COPIED
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    COPY
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {(isRunning || isDemoRunning) && !activeResult && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo" />
            <div className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
              {isRunning ? 'Executing live pipeline...' : 'Streaming demo events...'}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface InfoCellProps {
  label: string;
  value: string;
  valueClass?: string;
  indicator?: string;
}

function InfoCell({ label, value, valueClass = 'text-white', indicator }: InfoCellProps) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">{label}</span>
      <div className="mt-1.5 flex items-center gap-2">
        {indicator && (
          <span className={`h-2 w-2 rounded-full ${
            indicator === 'critical' ? 'bg-danger' : 'bg-tertiary'
          }`} />
        )}
        <span className={`font-display text-base font-bold uppercase tracking-tight ${valueClass}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function TrustStats() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
      <span>100% Deterministic</span>
      <span className="text-white/20">|</span>
      <span>Replay Verified</span>
      <span className="text-white/20">|</span>
      <span>SHA256 Hash</span>
    </div>
  );
}

export function Hero() {
  const [cases, setCases] = useState<PipelineResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [liveProgress, setLiveProgress] = useState(0);
  const [hasRunLive, setHasRunLive] = useState(false);
  const [replayResult, setReplayResult] = useState<PipelineResult | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const [showDemoResults, setShowDemoResults] = useState(false);
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);
  const [streamingEvent, setStreamingEvent] = useState<StageProgressEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    const data = await fetchCases();
    if (data.length > 0) {
      setCases(data);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleRunLive = async () => {
    setError(null);
    setIsRunning(true);
    setLiveProgress(8);
    setShowReplay(false);
    setShowDemoResults(false);
    setStreamingEvent(null);
    try {
      const progressInterval = setInterval(() => {
        setLiveProgress((current) => Math.min(current + 18, 92));
      }, 180);

      const result = await runLivePipeline();
      clearInterval(progressInterval);
      setLiveProgress(100);

      if (result) {
        let nextIndex = 0;
        setCases((prev) => {
          const existingIndex = prev.findIndex((c) => c.case_id === result.case_id);
          if (existingIndex !== -1) {
            nextIndex = existingIndex;
            return prev;
          }

          nextIndex = prev.length;
          return [...prev, result];
        });
        setActiveIndex(nextIndex);
        setHasRunLive(true);
      } else {
        setError('Pipeline execution failed - check backend is running');
      }
    } catch (error) {
      console.error('handleRunLive error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReplay = async () => {
    const active = cases[activeIndex] ?? cases[cases.length - 1];
    if (!active) return;
    setIsReplaying(true);
    setShowReplay(true);
    setLiveProgress(10);
    try {
      const progressInterval = setInterval(() => {
        setLiveProgress((current) => Math.min(current + 22, 94));
      }, 180);

      const result = await replayCase(active.case_id);
      clearInterval(progressInterval);
      setLiveProgress(100);

      if (result) {
        setReplayResult(result);
      }
    } finally {
      setIsReplaying(false);
    }
  };

  const handleRunDemo = async () => {
    setError(null);
    setIsDemoRunning(true);
    setDemoProgress(0);
    setShowReplay(false);
    setShowDemoResults(false);
    setStreamingEvent(null);

    const cleanup = streamDemoStages(
      (event) => {
        setStreamingEvent(event);
        setDemoProgress(Math.min((event.stage / 5) * 100, 95));
      },
      (error) => {
        console.error('Demo stream error:', error);
      },
      () => {
        setDemoProgress(100);
      }
    );

    try {
      const result = await runDemoMode();

      if (result) {
        setDemoResult(result);
        setCases(result.results);
        setActiveIndex(0);
        setShowDemoResults(true);
        setHasRunLive(true);
      } else {
        setError('Demo execution failed - check backend is running');
      }
    } finally {
      cleanup();
      setIsDemoRunning(false);
    }
  };

  const handleStreamStage = useCallback((event: StageProgressEvent) => {
    setStreamingEvent(event);
  }, []);

  const active = cases[activeIndex] ?? cases[cases.length - 1];
  const displayResult = showReplay && replayResult ? replayResult : active ?? null;
  const walkthroughMode = showReplay && replayResult
    ? 'replay'
    : showDemoResults || isDemoRunning
    ? 'demo'
    : displayResult || isRunning
    ? 'live'
    : 'idle';
  const loadedCases = showDemoResults && demoResult ? demoResult.count : cases.length;

  return (
    <section id="top" className="relative overflow-hidden border-b border-white/5 pt-20">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute left-[10%] top-[15%] h-72 w-72 rounded-full bg-indigo/10 blur-[140px]" />
      <div className="absolute right-[8%] top-[30%] h-96 w-96 rounded-full bg-indigo/5 blur-[160px]" />
      <div className="absolute bottom-[10%] left-[30%] h-64 w-64 rounded-full bg-cyan/5 blur-[120px]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-12 pt-6 lg:px-10">
        <div className="grid min-h-[calc(100vh-8rem)] gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col justify-center space-y-10">
            <HeroHeadline />

            <HeroCTAs
              onRunLive={handleRunLive}
              onRunDemo={handleRunDemo}
              isRunning={isRunning}
              isDemoRunning={isDemoRunning}
              liveProgress={liveProgress}
              demoProgress={demoProgress}
            />

            <DecisionPanel
              result={displayResult}
              isRunning={isRunning}
              isDemoRunning={isDemoRunning}
              showReplay={showReplay}
              replayResult={replayResult}
              onBackToLive={() => setShowReplay(false)}
            />

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <TrustStats />

            <div className="flex flex-wrap items-center gap-4 border-t border-white/5 pt-6">
              {displayResult ? (
                <button
                  onClick={handleReplay}
                  disabled={isReplaying}
                  className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-secondary transition-colors hover:text-white disabled:opacity-50"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  {isReplaying ? 'Replaying latest proof' : 'Replay latest proof'}
                </button>
              ) : null}
              <Link
                href="/engine"
                className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/70 transition-colors hover:text-white"
              >
                Open Command Deck
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="hidden h-3 w-px bg-white/10 md:block" />
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
                {hasRunLive ? 'Live proof bundle available below' : 'Run a live trace or demo batch to activate the walkthrough'}
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <DemoWalkthrough
              result={streamingEvent?.partial_result as PipelineResult ?? displayResult}
              totalCases={loadedCases}
              isRunning={isRunning}
              isDemoRunning={isDemoRunning}
              mode={walkthroughMode}
              onStreamStage={handleStreamStage}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
