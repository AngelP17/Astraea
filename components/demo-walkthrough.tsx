'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Copy, Play, Pause } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  buildWalkthroughSteps,
  PipelineResult,
  PipelineWalkthroughStep,
  StageProgressEvent,
} from '@/lib/data';
import { Button } from '@/components/ui/button';

interface DemoWalkthroughProps {
  result: PipelineResult | null;
  totalCases: number;
  isRunning: boolean;
  isDemoRunning: boolean;
  mode: 'idle' | 'live' | 'demo' | 'replay';
  onStreamStage?: (event: StageProgressEvent) => void;
}

const INDIGO = {
  text: 'text-indigo-400',
  border: 'border-indigo-400/30',
  bg: 'bg-indigo-400/10',
};

const STAGE_ID_MAP: Record<string, string> = {
  capture: 'capture',
  event_capture: 'capture',
  normalize: 'normalize',
  normalization: 'normalize',
  feature: 'feature',
  feature_extraction: 'feature',
  score: 'score',
  anomaly_scoring: 'score',
  prioritize: 'prioritize',
  prioritization: 'prioritize',
  dispatch: 'dispatch',
  decision_dispatch: 'dispatch',
  audit: 'audit',
  audit_proof: 'audit',
  complete: 'audit',
};

function modeLabel(mode: DemoWalkthroughProps['mode']) {
  switch (mode) {
    case 'live':
      return 'LIVE TRACE';
    case 'demo':
      return 'DEMO MODE';
    case 'replay':
      return 'REPLAY TRACE';
    default:
      return 'GUIDED WALKTHROUGH';
  }
}

export function DemoWalkthrough({
  result,
  totalCases,
  isRunning,
  isDemoRunning,
  mode,
  onStreamStage,
}: DemoWalkthroughProps) {
  const steps = buildWalkthroughSteps(result);
  const [activeStep, setActiveStep] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(false);

  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setActiveStep(0);
  }, [result?.case_id, mode]);

  const handlePrev = useCallback(() => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setActiveStep((prev) => Math.min(steps.length - 1, prev + 1));
  }, [steps.length]);

  useEffect(() => {
    if (!autoAdvance || steps.length === 0) return;

    const interval = window.setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2600);

    return () => window.clearInterval(interval);
  }, [autoAdvance, steps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key >= '1' && e.key <= '7') {
        const index = parseInt(e.key) - 1;
        if (index < steps.length) {
          setActiveStep(index);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, steps.length]);

  useEffect(() => {
    if (!isDemoRunning || !onStreamStage) return;

    let cleanup: (() => void) | undefined;

    import('@/lib/data').then(({ streamDemoStages }) => {
      cleanup = streamDemoStages(
        (event) => {
          const stepId = STAGE_ID_MAP[event.stage_name];
          if (stepId) {
            const index = steps.findIndex((s) => s.id === stepId);
            if (index !== -1) {
              setActiveStep(index);
            }
          }
          onStreamStage?.(event);
        },
        (error) => console.error('Stream error:', error),
        () => {}
      );
    });

    return () => {
      cleanup?.();
    };
  }, [isDemoRunning, onStreamStage, steps]);

  const activeStepData = steps[activeStep] ?? steps[0];
  const transitionDuration = prefersReducedMotion ? 0.01 : 0.2;
  const modeSummary =
    mode === 'demo'
      ? `${totalCases} cases are staged for live playback while the walkthrough follows the active case.`
      : mode === 'replay'
      ? 'The replay trace is now verifying the same decision path against the stored proof bundle.'
      : mode === 'live'
      ? 'The current pipeline result is being unpacked step by step for operators and buyers.'
      : 'Run the pipeline to replace placeholders with live execution evidence.';

  const copyHash = () => {
    if (result?.audit?.deterministic_hash) {
      navigator.clipboard.writeText(result.audit.deterministic_hash);
    }
  };

  return (
    <section id="walkthrough" className="panel relative mt-10 overflow-hidden p-1">
      <div className="relative overflow-hidden border border-white/5 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.06),transparent_30%),rgba(7,7,7,0.94)] p-6 lg:p-8">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-400">
                  GUIDED WALKTHROUGH
                </span>
                <span className={`inline-flex items-center gap-1.5 border ${INDIGO.border} ${INDIGO.text} bg-black/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em]`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isDemoRunning || isRunning ? 'bg-green-400 animate-pulse' : 'bg-neutral-500'}`} />
                  {modeLabel(mode)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                  {steps.length} stages
                </span>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-text-muted">
                {modeSummary}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500 lg:inline">
                {totalCases} cases loaded
              </span>
              <Button
                variant={autoAdvance ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setAutoAdvance(!autoAdvance)}
                className="font-mono text-[10px] uppercase tracking-wider"
              >
                {autoAdvance ? (
                  <>
                    <Pause className="h-3 w-3" /> AUTO
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" /> AUTO
                  </>
                )}
              </Button>
            </div>
          </div>

            <div className="mt-8">
              <StepIndicator
                steps={steps}
                activeStep={activeStep}
                onStepClick={setActiveStep}
                transitionDuration={transitionDuration}
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  {result?.case_id ? `Tracing ${result.case_id}` : 'Ready for first execution'}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  Keyboard: 1-7, Left, Right
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                key={activeStep}
                initial={prefersReducedMotion ? false : { opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: transitionDuration }}
                className="mt-8"
              >
                <StepContent
                  step={activeStepData}
                  stepIndex={activeStep}
                  result={result}
                  onCopyHash={copyHash}
                />
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
              <Button
                variant="secondary"
                size="md"
                onClick={handlePrev}
                disabled={activeStep === 0}
                className="gap-2 font-mono text-xs uppercase tracking-wider"
              >
                <ChevronLeft className="h-4 w-4" /> PREV
              </Button>
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                Stage {activeStep + 1} of {steps.length}
              </span>
              <Button
                variant="secondary"
                size="md"
                onClick={handleNext}
                disabled={activeStep === steps.length - 1}
                className="gap-2 font-mono text-xs uppercase tracking-wider"
              >
                NEXT STAGE <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepIndicator({
  steps,
  activeStep,
  onStepClick,
  transitionDuration,
}: {
  steps: PipelineWalkthroughStep[];
  activeStep: number;
  onStepClick: (index: number) => void;
  transitionDuration: number;
}) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, index) => {
        const isActive = index === activeStep;
        const isCompleted = index < activeStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              onClick={() => onStepClick(index)}
              className="group relative flex flex-col items-center gap-2"
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1 : 1,
                  backgroundColor: isCompleted || isActive 
                    ? 'rgb(99, 102, 241)' 
                    : 'transparent',
                  borderColor: isCompleted || isActive 
                    ? 'rgb(99, 102, 241)' 
                    : 'rgba(255,255,255,0.3)',
                }}
                transition={{ duration: 0.15 }}
                className="relative flex h-5 w-5 items-center justify-center rounded-full border-2"
              >
                {isActive && (
                  <motion.div
                    initial={false}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full border-2 border-indigo-400"
                  />
                )}
              </motion.div>
              <span
                className={`font-mono text-[10px] uppercase tracking-widest transition-colors ${
                  isActive 
                    ? 'text-indigo-400' 
                    : isCompleted 
                      ? 'text-neutral-400' 
                      : 'text-neutral-600'
                }`}
              >
                {step.step}
              </span>
            </button>
            {!isLast && (
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)',
                  scaleY: isCompleted ? 1 : 0.6,
                }}
                transition={{ duration: 0.15 }}
                className="mx-1 h-px w-8 origin-center bg-neutral-600"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepContent({
  step,
  stepIndex,
  result,
  onCopyHash,
}: {
  step: PipelineWalkthroughStep;
  stepIndex: number;
  result: PipelineResult | null;
  onCopyHash: () => void;
}) {
  const isAuditStep = step.id === 'audit';

  return (
    <div className="border border-white/6 bg-black/40 p-5 md:p-6">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={`font-mono text-[10px] uppercase tracking-[0.1em] ${INDIGO.text}`}>
              {step.step} / {step.eyebrow}
            </div>
            <h3 className="mt-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white md:text-3xl">
              {step.title}
            </h3>
          </div>
        </div>

        <div className="h-px w-full bg-white/5" />

        <p className="max-w-2xl text-base leading-relaxed text-neutral-300">
          {step.summary}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border border-white/6 bg-surface-2 p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-500">
              {step.metricLabel}
            </div>
            <div className={`mt-1.5 font-display text-base font-bold uppercase ${INDIGO.text}`}>
              {step.metricValue}
            </div>
          </div>
          <div className="border border-white/6 bg-surface-2 p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-500">
              {step.supportLabel}
            </div>
            <div className={`mt-1.5 font-display text-base font-bold uppercase ${INDIGO.text}`}>
              {step.supportValue}
            </div>
          </div>
        </div>

        <div className="border border-white/6 bg-surface-2 p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-500">
            What Happens Here
          </div>
          <div className="mt-3 space-y-2.5">
            {step.bullets.map((bullet, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                <p className="text-sm leading-6 text-neutral-300">{bullet}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-500">
            Evidence From This Case
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {step.evidence.map((item, i) => (
              <div
                key={`${step.id}-${item.label}-${i}`}
                className="border border-white/6 bg-surface-2 p-3"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-500">
                  {item.label}
                </div>
                <div className="mt-1.5 break-words font-mono text-sm font-medium text-white">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isAuditStep && result?.audit?.deterministic_hash && (
          <div className="border border-white/6 bg-surface-2 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-500">
                  Deterministic Hash
                </div>
                <div className="mt-1.5 font-mono text-sm text-white">
                  sha256:{result.audit.deterministic_hash}
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={onCopyHash}
                className="gap-1.5 font-mono text-[10px] uppercase tracking-wider"
              >
                <Copy className="h-3 w-3" /> COPY
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
