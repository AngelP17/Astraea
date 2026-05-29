'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Spinner,
  Warning,
  Funnel,
  SortAscending,
  Play,
  ArrowClockwise,
  Copy,
  CheckCircle,
  Files,
  Export,
  GitBranch,
  ShieldCheck,
  Gauge,
  X,
  MagnifyingGlass,
  CaretDown,
  LockKey,
} from '@phosphor-icons/react';
import { fetchCases, verifyReplay, runDemoMode, PipelineResult, ReplayVerification } from '@/lib/data';

type RemoteData<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T; receivedAt: string }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string; recoverable: boolean };

const severityOrder: Record<string, number> = { critical: 0, high: 1, moderate: 2, low: 3 };

const sortOptions = [
  { key: 'priority_score', label: 'Priority Score' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'cost_estimate_usd', label: 'Cost Exposure' },
  { key: 'downtime_avoided_minutes', label: 'Downtime Avoided' },
  { key: 'newest', label: 'Newest First' },
];

export default function EnginePage() {
  const [cases, setCases] = useState<RemoteData<PipelineResult[]>>({ status: 'idle' });
  const [selectedCase, setSelectedCase] = useState<PipelineResult | null>(null);
  const [replayResult, setReplayResult] = useState<ReplayVerification | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterMachine, setFilterMachine] = useState<string>('all');
  const [filterLine, setFilterLine] = useState<string>('all');
  const [filterBucket, setFilterBucket] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('priority_score');
  const [search, setSearch] = useState('');
  const [showJson, setShowJson] = useState(false);

  const loadCases = async () => {
    setCases({ status: 'loading' });
    try {
      const data = await fetchCases();
      if (!data || data.length === 0) {
        const demo = await runDemoMode();
        if (demo && demo.results.length > 0) {
          setCases({ status: 'success', data: demo.results, receivedAt: new Date().toISOString() });
          setSelectedCase(demo.results[demo.results.length - 1]);
        } else {
          setCases({ status: 'empty', message: 'No cases available. Run the demo on the home page to generate data.' });
        }
      } else {
        setCases({ status: 'success', data, receivedAt: new Date().toISOString() });
        setSelectedCase(data[data.length - 1]);
      }
    } catch (err) {
      setCases({ status: 'error', message: 'Failed to load cases. Ensure the backend is running.', recoverable: true });
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const filteredCases = useMemo(() => {
    if (cases.status !== 'success') return [];
    let list = [...cases.data];

    if (filterSeverity !== 'all') list = list.filter((c) => c.prioritized_case.severity === filterSeverity);
    if (filterMachine !== 'all') list = list.filter((c) => c.event.machine_id === filterMachine);
    if (filterLine !== 'all') list = list.filter((c) => c.event.line_id === filterLine);
    if (filterBucket !== 'all') list = list.filter((c) => c.prioritized_case.routing_bucket === filterBucket);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.case_id.toLowerCase().includes(q) ||
          c.event.machine_id.toLowerCase().includes(q) ||
          c.event.event_type.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'priority_score') return (b.prioritized_case.priority_score ?? 0) - (a.prioritized_case.priority_score ?? 0);
      if (sortBy === 'confidence') return (b.assessment.confidence ?? 0) - (a.assessment.confidence ?? 0);
      if (sortBy === 'cost_estimate_usd') return (b.consequence.cost_estimate_usd ?? 0) - (a.consequence.cost_estimate_usd ?? 0);
      if (sortBy === 'downtime_avoided_minutes') return (b.consequence.downtime_avoided_minutes ?? 0) - (a.consequence.downtime_avoided_minutes ?? 0);
      if (sortBy === 'newest') return (b.event.timestamp ?? '').localeCompare(a.event.timestamp ?? '');
      return 0;
    });

    return list;
  }, [cases, filterSeverity, filterMachine, filterLine, filterBucket, sortBy, search]);

  const machines = useMemo(() => {
    if (cases.status !== 'success') return [];
    return Array.from(new Set(cases.data.map((c) => c.event.machine_id))).sort();
  }, [cases]);

  const lines = useMemo(() => {
    if (cases.status !== 'success') return [];
    return Array.from(new Set(cases.data.map((c) => c.event.line_id))).sort();
  }, [cases]);

  const buckets = useMemo(() => {
    if (cases.status !== 'success') return [];
    return Array.from(new Set(cases.data.map((c) => c.prioritized_case.routing_bucket))).sort();
  }, [cases]);

  const handleReplay = async (caseId: string) => {
    setIsReplaying(true);
    setReplayResult(null);
    try {
      const result = await verifyReplay(caseId);
      if (result) setReplayResult(result);
    } catch (err) {
      console.error('Replay failed:', err);
    } finally {
      setIsReplaying(false);
    }
  };

  const handleExportJson = (data: PipelineResult) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.case_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const criticalCount = useMemo(() => {
    if (cases.status !== 'success') return 0;
    return cases.data.filter((c) => c.prioritized_case.severity === 'critical').length;
  }, [cases]);

  return (
    <div className="min-h-[100dvh] bg-background text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 font-display text-xl font-black tracking-tight text-amber">
            <ArrowLeft className="h-5 w-5" />
            ASTRAEA
          </Link>
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
            Engine Command Deck
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 grid gap-6 border border-white/5 bg-surface p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber">Engine Deep Dive</div>
            <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.05em] md:text-6xl">
              Inspect each decision like an operator
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-neutral-400 md:text-lg">
              Select a case, inspect the deterministic trace, and replay the same input to verify that Astraea produces the same audit-bound output.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <OverviewCard label="Cases loaded" value={cases.status === 'success' ? String(cases.data.length) : '-'} hint="local result set" />
            <OverviewCard label="Critical cases" value={String(criticalCount)} hint="operator attention" accent="text-danger" />
            <OverviewCard label="Replay state" value={replayResult ? 'VERIFIED' : 'READY'} hint={replayResult ? 'hash matched' : 'select a case'} accent="text-amber" />
            <OverviewCard label="Selected asset" value={selectedCase?.event.machine_id ?? 'NONE'} hint={selectedCase?.event.event_type ?? 'awaiting selection'} accent="text-zinc-400" />
          </div>
        </div>

        {cases.status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-24">
            <Spinner className="h-8 w-8 animate-spin text-amber" />
            <div className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">Loading cases...</div>
          </div>
        )}

        {cases.status === 'error' && (
          <div className="mb-10 rounded border border-danger/30 bg-danger/10 p-6 text-danger">
            <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.1em]">
              <Warning className="h-4 w-4" />
              {cases.message}
            </div>
            {cases.recoverable && (
              <button onClick={loadCases} className="mt-4 inline-flex items-center gap-2 border border-danger/30 px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-danger transition-colors hover:bg-danger/10">
                        <ArrowClockwise className="h-3 w-3" /> Retry
              </button>
            )}
          </div>
        )}

        {cases.status === 'empty' && (
          <div className="mb-10 rounded border border-white/10 bg-white/[0.02] p-10 text-center">
            <Play className="mx-auto h-10 w-10 text-text-muted" />
            <div className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">{cases.message}</div>
            <Link href="/" className="mt-4 inline-block border border-amber/30 bg-amber/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-amber transition-colors hover:bg-amber/20">
              Run Demo on Home Page
            </Link>
          </div>
        )}

        {cases.status === 'success' && (
          <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MagnifyingGlass className="h-4 w-4 text-text-muted" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search case ID, machine, type..."
                    className="w-full bg-transparent font-mono text-xs uppercase tracking-[0.1em] text-white placeholder:text-text-dim focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FilterSelect icon={Funnel} label="Severity" value={filterSeverity} onChange={setFilterSeverity} options={['all', 'critical', 'high', 'moderate', 'low']} />
                  <FilterSelect icon={Funnel} label="Machine" value={filterMachine} onChange={setFilterMachine} options={['all', ...machines]} />
                  <FilterSelect icon={Funnel} label="Line" value={filterLine} onChange={setFilterLine} options={['all', ...lines]} />
                  <FilterSelect icon={Funnel} label="Bucket" value={filterBucket} onChange={setFilterBucket} options={['all', ...buckets]} />
                </div>
                <div className="flex items-center gap-2">
                  <SortAscending className="h-4 w-4 text-text-muted" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-transparent font-mono text-xs uppercase tracking-[0.1em] text-white focus:outline-none"
                  >
                    {sortOptions.map((o) => (
                      <option key={o.key} value={o.key} className="bg-surface text-white">
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="panel border border-white/5 p-1">
                <div className="border border-white/5 bg-black/60 p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">Case Queue ({filteredCases.length})</div>
                  <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                    {filteredCases.map((item) => {
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
                              ? 'border-amber/30 bg-amber/10'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                              {item.case_id.replace('case_', '').toUpperCase()}
                            </span>
                            <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${severityColor(item.prioritized_case.severity)}`}>
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
                    {filteredCases.length === 0 && (
                      <div className="py-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
                        No cases match filters
                      </div>
                    )}
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
                        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber">Selected Case</span>
                        <span className="border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                          {selectedCase.case_id}
                        </span>
                      </div>
                      <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.04em] text-white">
                        {selectedCase.decision.recommendation}
                      </h2>
                      <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-400 md:text-base">
                        The selected event came from {selectedCase.event.machine_id} on {selectedCase.event.line_id}. Astraea scored the event, prioritized the case, routed it to {selectedCase.prioritized_case.routing_bucket}, and generated a hash-bound audit record.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleReplay(selectedCase.case_id)}
                        disabled={isReplaying}
                        className="inline-flex items-center justify-center gap-2 border border-amber/30 bg-amber/5 px-4 py-3 font-display text-sm font-bold uppercase tracking-[0.2em] text-amber transition-all hover:bg-amber/10 disabled:opacity-50"
                      >
                        {isReplaying ? <Spinner className="h-4 w-4 animate-spin" /> : <ArrowClockwise className="h-4 w-4" />}
                        Replay Decision
                      </button>
                      <button
                        onClick={() => handleExportJson(selectedCase)}
                        className="inline-flex items-center justify-center gap-2 border border-white/10 bg-white/[0.03] px-4 py-3 font-display text-sm font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-white/[0.06]"
                      >
                        <Export className="h-4 w-4" />
                        Export JSON
                      </button>
                      <Link href="/" className="inline-flex items-center justify-center gap-2 border border-white/10 bg-white/[0.03] px-4 py-3 font-display text-sm font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-white/[0.06]">
                        <Play className="h-4 w-4" />
                        Back To Demo
                      </Link>
                    </div>
                  </div>
                </motion.section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <SignalCard icon={Warning} label="Severity" value={selectedCase.prioritized_case.severity.toUpperCase()} accent={severityColor(selectedCase.prioritized_case.severity)} hint={`priority ${selectedCase.prioritized_case.priority_score.toFixed(3)}`} />
                  <SignalCard icon={Gauge} label="Model confidence" value={selectedCase.assessment.confidence.toFixed(3)} accent="text-amber" hint={`uncertainty ${selectedCase.assessment.uncertainty_low.toFixed(3)}-${selectedCase.assessment.uncertainty_high.toFixed(3)}`} />
                  <SignalCard icon={GitBranch} label="Operational impact" value={`${selectedCase.consequence.downtime_avoided_minutes} MIN`} accent="text-zinc-400" hint={`$${formatCompactCurrency(selectedCase.consequence.cost_estimate_usd)} protected`} />
                  <SignalCard icon={ShieldCheck} label="Audit hash" value={`${selectedCase.audit.deterministic_hash.slice(0, 12)}...`} accent="text-zinc-400" hint="deterministic replay anchor" />
                </section>

                <TraceGraph result={selectedCase} />

                {/* Stage-by-Stage Cryptographic Replay Rail */}
                <div className="panel border border-white/6 bg-surface p-1">
                  <div className="border border-white/5 bg-black/60 p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="flex items-center gap-3">
                        <LockKey className="h-5 w-5 text-amber" />
                        <div>
                          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber block">Stage-by-Stage Cryptographic Replay Rail</span>
                          <span className="text-[11px] text-text-muted mt-0.5 block">
                            Rerunning original event telemetry through in-process pipeline state builders
                          </span>
                        </div>
                      </div>
                      {replayResult && (
                        <div className="flex items-center gap-4 font-mono text-[10px]">
                          <span className="border border-white/10 bg-white/[0.02] px-2 py-1 text-text-muted">
                            DURATION: <strong className="text-white">{replayResult.replay_duration_ms.toFixed(2)}ms</strong>
                          </span>
                          <span className={cn(
                            "px-2.5 py-1 font-bold uppercase",
                            replayResult.verified ? "border border-success/30 bg-success/15 text-success" : "border border-danger/30 bg-danger/15 text-danger"
                          )}>
                            {replayResult.verified ? "VERIFICATION PASS" : "HASH MISMATCH"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {[
                        { id: 'event', label: 'Signal Intake (Event)' },
                        { id: 'features', label: 'Feature Extraction' },
                        { id: 'assessment', label: 'Anomaly Scoring' },
                        { id: 'prioritization', label: 'Prioritization Routing' },
                        { id: 'decision', label: 'Decision Dispatch' },
                        { id: 'execution', label: 'Action Execution' },
                      ].map((stage) => {
                        const origHash = selectedCase.audit?.stage_hashes?.[stage.id] || selectedCase.audit?.deterministic_hash || '';
                        const repHash = replayResult?.replay_result?.audit?.stage_hashes?.[stage.id] || replayResult?.replay_result?.audit?.deterministic_hash || '';
                        const isMatched = replayResult ? (!replayResult.stage_diffs.some((d) => d.stage === stage.id)) : false;

                        return (
                          <div key={stage.id} className="grid md:grid-cols-[200px_minmax(0,1fr)_120px] items-center gap-4 border border-white/5 bg-black/30 p-3">
                            <div className="flex flex-col">
                              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-white font-bold">
                                {stage.label}
                              </span>
                              <span className="font-mono text-[8px] text-text-dim mt-0.5 uppercase">
                                STAGE_{stage.id.toUpperCase()}
                              </span>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3 font-mono text-[9px]">
                              <div>
                                <span className="text-text-dim text-[8px] uppercase tracking-wider block mb-1">ORIGINAL</span>
                                <div className="bg-black/50 border border-white/5 px-2 py-1 truncate text-white select-all">
                                  {origHash ? `sha256:${origHash.slice(0, 16)}...` : 'n/a'}
                                </div>
                              </div>
                              <div>
                                <span className="text-text-dim text-[8px] uppercase tracking-wider block mb-1">REPLAY</span>
                                <div className={cn(
                                  "border px-2 py-1 truncate select-all",
                                  replayResult 
                                    ? (isMatched ? "border-success/20 bg-success/5 text-success" : "border-danger/20 bg-danger/5 text-danger")
                                    : "bg-black/50 border border-white/5 text-text-dim"
                                )}>
                                  {replayResult ? (repHash ? `sha256:${repHash.slice(0, 16)}...` : 'n/a') : 'AWAITING VERIFICATION...'}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end">
                              <span className={cn(
                                "font-mono text-[8px] px-2 py-0.5 uppercase tracking-wider",
                                replayResult
                                  ? (isMatched ? "border border-success/30 bg-success/15 text-success" : "border border-danger/30 bg-danger/15 text-danger")
                                  : "border border-white/10 bg-white/[0.02] text-text-dim"
                              )}>
                                {replayResult ? (isMatched ? "MATCH" : "MISMATCH") : "PENDING"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>


                <div className="panel border border-white/5 bg-surface-low p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500">Full Case JSON</div>
                    <button
                      onClick={() => setShowJson(!showJson)}
                      className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted transition-colors hover:text-white"
                    >
                      <Files className="h-3 w-3" />
                      {showJson ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <AnimatePresence>
                    {showJson && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <pre className="max-h-96 overflow-auto rounded bg-black/50 p-4 font-mono text-[10px] text-neutral-400">
                          {JSON.stringify(selectedCase, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="panel border border-white/5 bg-surface-low p-10">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Play className="h-12 w-12 text-neutral-600" />
                  <div className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">
                    No case selected
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function OverviewCard({ label, value, hint, accent = 'text-white' }: { label: string; value: string; hint: string; accent?: string }) {
  return (
    <div className="border border-white/10 bg-black/40 px-4 py-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">{label}</div>
      <div className={`mt-3 font-display text-2xl font-black uppercase tracking-tight ${accent}`}>{value}</div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">{hint}</div>
    </div>
  );
}

function SignalCard({ icon: Icon, label, value, hint, accent }: { icon: typeof Warning; label: string; value: string; hint: string; accent: string }) {
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

function severityColor(severity: string) {
  if (severity === 'critical') return 'text-danger';
  if (severity === 'high') return 'text-amber';
  return 'text-white';
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value >= 1000 ? 1 : 0,
    notation: value >= 1000 ? 'compact' : 'standard',
  }).format(value);
}

function FilterSelect({ icon: Icon, label, value, onChange, options }: { icon: typeof Funnel; label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex items-center gap-2 border border-white/10 bg-white/[0.02] px-2 py-1.5">
      <Icon className="h-3 w-3 text-text-muted" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent font-mono text-[10px] uppercase tracking-[0.1em] text-white focus:outline-none"
      >
        <option value={value} className="bg-surface text-white">{label}: {value}</option>
        {options.filter((o) => o !== value).map((o) => (
          <option key={o} value={o} className="bg-surface text-white">{o}</option>
        ))}
      </select>
    </div>
  );
}

function TraceGraph({ result }: { result: PipelineResult }) {
  const stages = [
    { id: 'event', label: 'Event Capture', icon: Play, data: result.event },
    { id: 'features', label: 'Feature Extraction', icon: GitBranch, data: result.features },
    { id: 'assessment', label: 'Anomaly Scoring', icon: Gauge, data: result.assessment },
    { id: 'prioritized', label: 'Prioritization', icon: Warning, data: result.prioritized_case },
    { id: 'decision', label: 'Decision Dispatch', icon: ShieldCheck, data: result.decision },
    { id: 'execution', label: 'Execution', icon: ArrowClockwise, data: result.execution },
    { id: 'audit', label: 'Audit Proof', icon: CheckCircle, data: result.audit },
  ];

  return (
    <div className="panel border border-white/5 bg-surface-low p-6">
      <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500">Deterministic Trace Graph</div>
      <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:gap-0">
        {stages.map((stage, i) => (
          <div key={stage.id} className="flex flex-1 flex-col items-center text-center">
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-amber/30 bg-amber/10">
              <stage.icon className="h-4 w-4 text-amber" />
            </div>
            <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-amber">{stage.label}</div>
            <div className="mt-1 max-w-[120px] truncate font-mono text-[9px] text-text-dim">
              {stage.id === 'audit' && result.audit?.deterministic_hash
                ? `${result.audit.deterministic_hash.slice(0, 8)}...`
                : stage.data && typeof stage.data === 'object' && 'event_id' in stage.data
                ? (stage.data as { event_id?: string }).event_id?.slice(0, 10) ?? 'ok'
                : 'ok'}
            </div>
            {i < stages.length - 1 && (
              <>
                <div className="hidden md:block absolute top-5 left-0 right-0 h-px bg-white/10" style={{ marginLeft: `${(i + 0.5) * (100 / stages.length)}%`, marginRight: `${(stages.length - i - 1.5) * (100 / stages.length)}%` }} />
                <div className="md:hidden h-8 w-px bg-white/10" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
