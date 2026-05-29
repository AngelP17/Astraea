'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Lightning,
  Waves,
  Spinner,
  CheckCircle,
  Copy,
  GitBranch,
  ArrowRight,
  Play,
  Clock,
  ShieldCheck,
  Warning,
  Info,
} from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  fetchCases,
  runLivePipeline,
  verifyReplay,
  runDemoMode,
  streamDemoStages,
  PipelineResult,
  DemoResult,
  StageProgressEvent,
} from '@/lib/data';
import { DemoWalkthrough } from '@/components/demo-walkthrough';
import { cn } from '@/lib/utils';

const STAGES = [
  { id: 'ingestion', label: 'INGEST' },
  { id: 'feature_extraction', label: 'FEATURE' },
  { id: 'scoring', label: 'SCORE' },
  { id: 'prioritization', label: 'PRIORITIZE' },
  { id: 'execution', label: 'EXECUTE' },
  { id: 'consequence', label: 'IMPACT' },
  { id: 'audit', label: 'AUDIT' },
] as const;

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
    return `${(minutes / 60).toFixed(1)} hrs`;
  }
  return `${minutes} min`;
}

function getActiveStageFromResult(result: PipelineResult | null): number {
  if (!result) return 0;
  if (result.audit) return 6;
  if (result.decision) return 5;
  if (result.prioritized_case) return 4;
  if (result.assessment) return 3;
  if (result.features) return 2;
  if (result.event) return 1;
  return 0;
}

function HeroHeadline() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl leading-[1.05]">
        Deterministic decisions with replayable proof
      </h1>

      <p className="max-w-[520px] font-body text-sm leading-relaxed text-text-muted md:text-base">
        Turn machine telemetry into explainable actions, stage hashes, and replay verification.
      </p>
    </div>
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
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={onRunLive}
        disabled={isRunning || isDemoRunning}
        className="inline-flex items-center justify-center gap-2 border border-amber/40 bg-amber px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-zinc-950 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-hover hover:border-amber-hover active:scale-[0.98]"
      >
        {isRunning ? (
          <>
            <Spinner className="h-3.5 w-3.5 animate-spin" />
            EXECUTING {liveProgress}%
          </>
        ) : (
          <>
            <Lightning className="h-3.5 w-3.5" weight="fill" />
            RUN LIVE PIPELINE
          </>
        )}
      </button>

      <button
        onClick={onRunDemo}
        disabled={isDemoRunning || isRunning}
        className="inline-flex items-center justify-center gap-2 border border-white/10 bg-white/5 px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-white transition-all duration-150 hover:bg-white/[0.08] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDemoRunning ? (
          <>
            <Spinner className="h-3.5 w-3.5 animate-spin" />
            STREAMING {demoProgress}%
          </>
        ) : (
          <>
            <Waves className="h-3.5 w-3.5" />
            RUN DEMO
          </>
        )}
      </button>
    </div>
  );
}

interface StageProgressBarProps {
  activeStage: number;
  isRunning: boolean;
}

function StageProgressBar({ activeStage, isRunning }: StageProgressBarProps) {
  return (
    <div className="grid grid-cols-7 gap-1 border border-white/5 bg-black/40 p-2">
      {STAGES.map((stage, index) => {
        const isActive = index <= activeStage;
        const isCurrent = index === activeStage;
        return (
          <div key={stage.id} className="flex flex-col items-center justify-between text-center gap-1.5">
            <div className="relative w-full h-1 bg-white/10 overflow-hidden">
              <motion.div
                className={cn("h-full", isActive ? 'bg-amber' : 'bg-transparent')}
                animate={isCurrent && isRunning ? { opacity: [0.3, 1, 0.3], transition: { duration: 0.8, repeat: Infinity } } : {}}
              />
            </div>
            <span className={cn(
              "font-mono text-[8px] tracking-wider truncate w-full",
              isActive ? 'text-amber font-bold' : 'text-text-dim'
            )}>
              {stage.label}
            </span>
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
  const [copied, setCopied] = useState(false);
  const activeResult = showReplay && replayResult ? replayResult : result;
  const activeStage = getActiveStageFromResult(activeResult ?? null);

  const handleCopy = useCallback(() => {
    if (activeResult?.audit?.deterministic_hash) {
      copyToClipboard(activeResult.audit.deterministic_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [activeResult]);

  if (!activeResult && !isRunning && !isDemoRunning) {
    return (
      <div className="border border-white/6 bg-surface/50 p-6 flex flex-col items-center justify-center py-10 text-center">
        <Play className="h-6 w-6 text-text-dim" />
        <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
          Run pipeline to activate the proof console
        </div>
      </div>
    );
  }

  if (showReplay && replayResult) {
    const isMatched = result?.audit?.deterministic_hash === replayResult.audit?.deterministic_hash;
    return (
      <div className="border border-amber/20 bg-amber/5 overflow-hidden">
        <div className="border-b border-amber/10 bg-amber/10 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-3.5 w-3.5 text-amber" />
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber font-bold">REPLAY VERIFIED</span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] border border-amber/30 bg-amber/20 px-2 py-0.5 text-amber">
            MATCH OK
          </span>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <InfoCell label="CASE ID" value={replayResult.case_id} valueClass="text-amber font-mono text-xs" />
            <InfoCell label="SEVERITY" value={replayResult.prioritized_case.severity.toUpperCase()} valueClass={severityColor(replayResult.prioritized_case.severity)} />
            <InfoCell label="PRIORITY" value={replayResult.prioritized_case.priority_score.toFixed(3)} valueClass="font-mono" />
            <InfoCell label="PROVENANCE" value={replayResult.provenance?.toUpperCase() || 'REPLAYED'} valueClass="text-amber font-mono" />
          </div>

          <div className="border border-white/5 bg-black/60 p-3 space-y-2">
            <div className="flex justify-between items-center border-b border-white/5 pb-2 font-mono text-[9px] text-text-muted">
              <span>ORIGINAL HASH</span>
              <span className="text-white truncate max-w-[200px]">{result?.audit?.deterministic_hash.slice(0, 24)}...</span>
            </div>
            <div className="flex justify-between items-center font-mono text-[9px] text-amber">
              <span>REPLAY HASH</span>
              <span className="truncate max-w-[200px]">{replayResult.audit?.deterministic_hash.slice(0, 24)}...</span>
            </div>
          </div>

          <button
            onClick={onBackToLive}
            className="w-full border border-white/10 bg-white/[0.02] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Return to Live Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-white/6 bg-surface overflow-hidden">
      <div className="border-b border-white/6 bg-black/20 p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-text-muted font-bold">
            {activeResult?.case_id ?? 'INITIALIZING...'}
          </span>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse" />
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-amber">
              {activeResult?.provenance?.toUpperCase() || 'REAL'}
            </span>
          </div>
        </div>
        <StageProgressBar activeStage={activeStage} isRunning={isRunning || isDemoRunning} />
      </div>

      <div className="p-4 space-y-4">
        {activeResult && (
          <>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <InfoCell label="TELEMETRY SOURCE" value={`${activeResult.event.machine_id} [${activeResult.event.line_id}]`} valueClass="font-mono" />
              <InfoCell label="SEVERITY" value={activeResult.prioritized_case.severity.toUpperCase()} valueClass={severityColor(activeResult.prioritized_case.severity)} />
              <InfoCell label="PRIORITY SCORE" value={`${activeResult.prioritized_case.priority_score.toFixed(1)} / 100`} valueClass="font-mono" />
              <div className="flex flex-col">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-dim">CONFIDENCE BOUND</span>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full bg-amber"
                      initial={{ width: 0 }}
                      animate={{ width: `${(activeResult.assessment.confidence * 100).toFixed(0)}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="font-mono text-xs font-bold text-amber">
                    {(activeResult.assessment.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-3">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-amber font-bold">
                RECOMMENDED ACTION
              </div>
              <div className="mt-1 font-body text-xs text-white leading-relaxed">
                {activeResult.decision.recommendation}
              </div>
            </div>

            {activeResult.consequence && (
              <div className="flex justify-between border-t border-white/5 pt-3 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-amber" />
                  <span className="text-text-muted">{formatDowntime(activeResult.consequence.downtime_avoided_minutes)} Downtime Avoided</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-success" />
                  <span className="text-text-muted">{formatCurrency(activeResult.consequence.cost_estimate_usd)} Est. Prevented</span>
                </div>
              </div>
            )}

            {activeResult.stage_timings?.total && (
              <div className="flex justify-between border-t border-white/5 pt-3 font-mono text-[9px] text-text-dim">
                <span>PIPELINE LATENCY:</span>
                <span className="text-white font-bold">{activeResult.stage_timings.total.toFixed(3)} ms</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <div className="flex items-center gap-1.5 font-mono text-[9px] text-text-dim">
                <span className="text-amber/70 font-bold">sha256:</span>
                <span className="truncate max-w-[140px] text-white">{activeResult.audit.deterministic_hash}</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 border border-white/10 bg-white/[0.02] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-text-muted transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-success" weight="fill" />
                    COPIED
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    COPY HASH
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {(isRunning || isDemoRunning) && !activeResult && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Spinner className="h-5 w-5 animate-spin text-amber" />
            <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim">
              {isRunning ? 'Processing Live telemetry frame...' : 'Streaming multi-event pipeline simulation...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCell({ label, value, valueClass = 'text-white' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-dim">{label}</span>
      <span className={cn("mt-1 font-display font-semibold tracking-tight", valueClass)}>{value}</span>
    </div>
  );
}

function severityColor(severity: string) {
  if (severity === 'critical') return 'text-danger font-bold';
  if (severity === 'high') return 'text-amber font-bold';
  return 'text-white';
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
    if (data.length > 0) setCases(data);
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleRunLive = async () => {
    setError(null);
    setIsRunning(true);
    setLiveProgress(5);
    setShowReplay(false);
    setShowDemoResults(false);
    setStreamingEvent(null);
    try {
      const progressInterval = setInterval(() => setLiveProgress((c) => Math.min(c + 15, 95)), 120);
      const result = await runLivePipeline();
      clearInterval(progressInterval);
      setLiveProgress(100);
      if (result) {
        let nextIndex = 0;
        setCases((prev) => {
          const existingIndex = prev.findIndex((c) => c.case_id === result.case_id);
          if (existingIndex !== -1) { nextIndex = existingIndex; return prev; }
          nextIndex = prev.length;
          return [...prev, result];
        });
        setActiveIndex(nextIndex);
        setHasRunLive(true);
      } else {
        setError('Pipeline execution failed. Verify FastAPI backend status.');
      }
    } catch (err) {
      console.error('handleRunLive error:', err);
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
      const progressInterval = setInterval(() => setLiveProgress((c) => Math.min(c + 20, 95)), 120);
      const result = await verifyReplay(active.case_id);
      clearInterval(progressInterval);
      setLiveProgress(100);
      if (result) setReplayResult(result.replay_result);
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
        setDemoProgress(Math.min((event.stage / 7) * 100, 95));
      },
      (err) => console.error('Demo stream error:', err),
      () => setDemoProgress(100)
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
        setError('Demo stream initialization failed. Verify backend services.');
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
    <section id="system" className="relative border-b border-white/5 pt-16 md:pt-20">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-12 pt-4 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="flex flex-col justify-center space-y-6">
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
              <div className="border border-danger/20 bg-danger/10 p-3 text-danger text-xs font-mono">
                [ERROR] {error}
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-4 border-t border-white/5 pt-4">
              {displayResult ? (
                <button
                  onClick={handleReplay}
                  disabled={isReplaying}
                  className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-amber transition-colors hover:text-white disabled:opacity-50"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  {isReplaying ? 'VERIFYING DECISION...' : 'REPLAY & VERIFY HASH'}
                </button>
              ) : null}
              <Link
                href="/engine"
                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/70 transition-colors hover:text-white"
              >
                OPEN ENGINE WORKSPACE
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <DemoWalkthrough
              result={streamingEvent?.partial_result as PipelineResult ?? displayResult}
              totalCases={loadedCases}
              isRunning={isRunning}
              isDemoRunning={isDemoRunning}
              mode={walkthroughMode}
              onStreamStage={handleStreamStage}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
