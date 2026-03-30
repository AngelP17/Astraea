'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  FileCheck,
  Gauge,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { fetchCases, replayCase, PipelineResult } from '@/lib/data';
import { PipelineVisualizer } from '@/components/pipeline-visualizer';
import { DecisionBreakdown } from '@/components/decision-breakdown';
import { AuditVisualization } from '@/components/audit-visualization';

export default function EnginePage() {
  const [cases, setCases] = useState<PipelineResult[]>([]);
  const [selectedCase, setSelectedCase] = useState<PipelineResult | null>(null);
  const [replayResult, setReplayResult] = useState<PipelineResult | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCases = async () => {
      const data = await fetchCases();
      setCases(data);
      if (data.length > 0) {
        setSelectedCase(data[data.length - 1]);
      }
      setIsLoading(false);
    };

    loadCases();
  }, []);

  const handleReplay = async (caseId: string) => {
    setIsReplaying(true);
    const result = await replayCase(caseId);
    if (result) {
      setReplayResult(result);
    }
    setIsReplaying(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-indigo" />
      </div>
    );
  }

  const criticalCount = cases.filter((item) => item.prioritized_case.severity === 'critical').length;

  return (
    <div className="min-h-screen bg-background text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 font-display text-xl font-black tracking-tight text-indigo">
            <ArrowLeft className="h-5 w-5" />
            ASTRAEA
          </Link>
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
            Engine Command Deck
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 grid gap-6 border border-white/5 bg-[linear-gradient(135deg,rgba(161,250,255,0.08),transparent_42%),rgba(255,255,255,0.02)] p-6 lg:grid-cols-[1.2fr_0.8fr]"
        >
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-indigo">Engine Deep Dive</div>
            <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.05em] md:text-6xl">
              Inspect each decision like an operator
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-neutral-400 md:text-lg">
              Select a case, inspect the deterministic trace, and replay the same input to verify that Astraea
              produces the same audit-bound output. This view is optimized for customer walkthroughs and technical due diligence.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <OverviewCard label="Cases loaded" value={String(cases.length)} hint="local result set" />
            <OverviewCard label="Critical cases" value={String(criticalCount)} hint="operator attention" accent="text-danger" />
            <OverviewCard
              label="Replay state"
              value={replayResult ? 'VERIFIED' : 'READY'}
              hint={replayResult ? 'hash matched' : 'select a case'}
              accent="text-secondary"
            />
            <OverviewCard
              label="Selected asset"
              value={selectedCase?.event.machine_id ?? 'NONE'}
              hint={selectedCase?.event.event_type ?? 'awaiting selection'}
              accent="text-tertiary"
            />
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="panel border border-white/5 p-1">
              <div className="border border-white/5 bg-black/60 p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">Case Queue</div>
                <div className="mt-4 space-y-3">
                  {cases.map((item) => {
                    const selected = selectedCase?.case_id === item.case_id;

                    return (
                      <button
                        key={item.case_id}
                        onClick={() => {
                          setSelectedCase(item);
                          setReplayResult(null);
                        }}
                        className={`w-full border px-4 py-4 text-left transition-colors ${
                          selected
                            ? 'border-indigo/30 bg-indigo/10'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                            {item.case_id.replace('case_', '').toUpperCase()}
                          </span>
                          <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${severityAccent(item.prioritized_case.severity)}`}>
                            {item.prioritized_case.severity}
                          </span>
                        </div>
                        <div className="mt-3 font-display text-lg font-bold uppercase tracking-tight text-white">
                          {item.event.event_type}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                          <span>{item.event.machine_id}</span>
                          <span>{item.prioritized_case.routing_bucket}</span>
                          <span>{item.prioritized_case.priority_score.toFixed(3)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="panel border border-white/5 p-1">
              <div className="border border-white/5 bg-black/60 p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">Replay Protocol</div>
                <div className="mt-4 space-y-3">
                  <ProtocolStep step="01" text="Load a case from the result set." />
                  <ProtocolStep step="02" text="Replay the original input through the same pipeline." />
                  <ProtocolStep step="03" text="Compare the deterministic hashes and prove reproducibility." />
                </div>
              </div>
            </div>
          </aside>

          {selectedCase ? (
            <div className="space-y-8">
              <motion.section
                key={selectedCase.case_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="panel border border-white/5 p-1"
              >
                <div className="grid gap-6 border border-white/5 bg-black/60 p-6 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-indigo">
                        Selected Case
                      </span>
                      <span className="border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                        {selectedCase.case_id}
                      </span>
                    </div>
                    <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.04em] text-white">
                      {selectedCase.decision.recommendation}
                    </h2>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-400 md:text-base">
                      The selected event came from {selectedCase.event.machine_id} on {selectedCase.event.line_id}. Astraea
                      scored the event, prioritized the case, routed it to {selectedCase.prioritized_case.routing_bucket}, and
                      generated a hash-bound audit record.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleReplay(selectedCase.case_id)}
                      disabled={isReplaying}
                      className="inline-flex items-center justify-center gap-2 border border-indigo/30 bg-indigo/5 px-4 py-3 font-display text-sm font-bold uppercase tracking-[0.2em] text-indigo transition-all hover:bg-indigo/10 disabled:opacity-50"
                    >
                      {isReplaying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                      Replay Decision
                    </button>

                    <Link
                      href="/"
                      className="inline-flex items-center justify-center gap-2 border border-white/10 bg-surface-low px-4 py-3 font-display text-sm font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-surface-high"
                    >
                      <Play className="h-4 w-4" />
                      Back To Demo
                    </Link>
                  </div>
                </div>
              </motion.section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SignalCard
                  icon={AlertTriangle}
                  label="Severity"
                  value={selectedCase.prioritized_case.severity.toUpperCase()}
                  accent={severityAccent(selectedCase.prioritized_case.severity)}
                  hint={`priority ${selectedCase.prioritized_case.priority_score.toFixed(3)}`}
                />
                <SignalCard
                  icon={Gauge}
                  label="Model confidence"
                  value={selectedCase.assessment.confidence.toFixed(3)}
                  accent="text-indigo"
                  hint={`uncertainty ${selectedCase.assessment.uncertainty_low.toFixed(3)}-${selectedCase.assessment.uncertainty_high.toFixed(3)}`}
                />
                <SignalCard
                  icon={Activity}
                  label="Operational impact"
                  value={`${selectedCase.consequence.downtime_avoided_minutes} MIN`}
                  accent="text-tertiary"
                  hint={`$${formatCompactCurrency(selectedCase.consequence.cost_estimate_usd)} protected`}
                />
                <SignalCard
                  icon={Shield}
                  label="Audit hash"
                  value={`${selectedCase.audit.deterministic_hash.slice(0, 12)}...`}
                  accent="text-secondary"
                  hint="deterministic replay anchor"
                />
              </section>

              <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
                <div className="panel border border-white/5 bg-surface-low p-6">
                  <PipelineVisualizer result={selectedCase} />
                </div>

                <div className="panel border border-white/5 bg-surface-low p-6">
                  <DecisionBreakdown result={selectedCase} />
                </div>
              </div>

              <div className="panel border border-white/5 bg-surface-low p-6">
                <AuditVisualization result={selectedCase} />
              </div>

              {replayResult ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="panel border border-secondary/30 p-1"
                >
                  <div className="border border-secondary/20 bg-secondary/5 p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <RefreshCw className="h-5 w-5 text-secondary" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-secondary">
                        Replay Verification
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <ReplayValue
                        label="Original hash"
                        value={`${selectedCase.audit.deterministic_hash.slice(0, 24)}...`}
                      />
                      <ReplayValue
                        label="Replay hash"
                        value={`${replayResult.audit.deterministic_hash.slice(0, 24)}...`}
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-3 border border-secondary/20 bg-black/30 px-4 py-3">
                      <FileCheck className="h-4 w-4 text-secondary" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-secondary">
                        Hash match:{' '}
                        {selectedCase.audit.deterministic_hash === replayResult.audit.deterministic_hash ? 'true' : 'false'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              <div className="panel border border-white/5 bg-surface-low p-6">
                <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500">
                  Full Case JSON
                </div>
                <pre className="max-h-96 overflow-auto rounded bg-black/50 p-4 font-mono text-[10px] text-neutral-400">
                  {JSON.stringify(selectedCase, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="panel border border-white/5 bg-surface-low p-10">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Play className="h-12 w-12 text-neutral-600" />
                <div className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">
                  No cases available yet
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function OverviewCard({
  label,
  value,
  hint,
  accent = 'text-white',
}: {
  label: string;
  value: string;
  hint: string;
  accent?: string;
}) {
  return (
    <div className="border border-white/10 bg-black/40 px-4 py-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">{label}</div>
      <div className={`mt-3 font-display text-2xl font-black uppercase tracking-tight ${accent}`}>{value}</div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">{hint}</div>
    </div>
  );
}

function ProtocolStep({ step, text }: { step: string; text: string }) {
  return (
    <div className="flex items-start gap-3 border border-white/10 bg-white/[0.02] p-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-indigo">{step}</span>
      <span className="text-sm leading-6 text-neutral-400">{text}</span>
    </div>
  );
}

function SignalCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <div className="panel border border-white/5 p-1">
      <div className="border border-white/5 bg-black/55 p-5">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${accent}`} />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">{label}</span>
        </div>
        <div className={`mt-4 font-display text-2xl font-black uppercase tracking-tight ${accent}`}>{value}</div>
        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">{hint}</div>
      </div>
    </div>
  );
}

function ReplayValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/30 px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">{label}</div>
      <div className="mt-3 break-all font-mono text-xs text-neutral-200">{value}</div>
    </div>
  );
}

function severityAccent(severity: string) {
  if (severity === 'critical') return 'text-danger';
  if (severity === 'high') return 'text-tertiary';
  return 'text-white';
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value >= 1000 ? 1 : 0,
    notation: value >= 1000 ? 'compact' : 'standard',
  }).format(value);
}
