'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { fetchCases, replayCase, PipelineResult } from '@/lib/data';
import { PipelineVisualizer } from '@/components/pipeline-visualizer';
import { DecisionBreakdown } from '@/components/decision-breakdown';
import { AuditVisualization } from '@/components/audit-visualization';
import { ArrowLeft, RefreshCw, Loader2, Play, RotateCcw } from 'lucide-react';
import Link from 'next/link';

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
        setSelectedCase(data[0]);
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 font-headline text-xl font-black tracking-tight text-primary">
            <ArrowLeft className="h-5 w-5" />
            ASTRAEA
          </Link>
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
            Decision Engine — Deep Dive
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="font-mono text-xs uppercase tracking-[0.32em] text-primary">ENGINE DEEP DIVE</div>
          <h1 className="mt-4 font-headline text-5xl font-black uppercase tracking-[-0.04em] md:text-6xl">
            How Astraea Makes Decisions
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
            Every decision passes through 7 deterministic stages. Select a case below to see the full pipeline trace, decision breakdown, and audit trail with real data.
          </p>
        </motion.div>

        <div className="mb-8 flex flex-wrap gap-3">
          {cases.map((c, i) => (
            <button
              key={c.case_id}
              onClick={() => {
                setSelectedCase(c);
                setReplayResult(null);
              }}
              className={`group border px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] transition-all ${
                selectedCase?.case_id === c.case_id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-white/10 bg-surface-low text-neutral-400 hover:border-white/30 hover:text-white'
              }`}
            >
              <span className="text-neutral-500">CASE </span>{c.case_id.replace('case_', '').toUpperCase()}
            </button>
          ))}
        </div>

        {selectedCase && (
          <div className="space-y-8">
            <motion.div
              key={selectedCase.case_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-8 lg:grid-cols-[1fr_1fr]"
            >
              <div className="panel border border-white/5 bg-surface-low p-6">
                <PipelineVisualizer result={selectedCase} />
              </div>

              <div className="space-y-6">
                <div className="panel border border-white/5 bg-surface-low p-6">
                  <DecisionBreakdown result={selectedCase} />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleReplay(selectedCase.case_id)}
                    disabled={isReplaying}
                    className="flex-1 inline-flex items-center justify-center gap-2 border border-primary/30 bg-primary/5 px-4 py-3 font-headline text-sm font-bold uppercase tracking-[0.2em] text-primary transition-all hover:bg-primary/10 disabled:opacity-50"
                  >
                    {isReplaying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    REPLAY THIS DECISION
                  </button>

                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 border border-white/10 bg-surface-low px-4 py-3 font-headline text-sm font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-surface-high"
                  >
                    <Play className="h-4 w-4" />
                    LIVE DEMO
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="panel border border-white/5 bg-surface-low p-6"
            >
              <AuditVisualization result={selectedCase} />
            </motion.div>

            {replayResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded border border-primary/30 bg-primary/5 p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                    REPLAY RESULT — VERIFIED
                  </span>
                </div>
                <div className="space-y-2 font-mono text-xs text-neutral-400">
                  <div>
                    Original hash: <span className="text-primary">{selectedCase.audit.deterministic_hash.slice(0, 24)}...</span>
                  </div>
                  <div>
                    Replay hash: <span className="text-primary">{replayResult.audit.deterministic_hash.slice(0, 24)}...</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-primary">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    HASH MATCH: {selectedCase.audit.deterministic_hash === replayResult.audit.deterministic_hash ? 'TRUE' : 'FALSE'}
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="panel border border-white/5 bg-surface-low p-6"
            >
              <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500">
                Full Case JSON
              </div>
              <pre className="max-h-96 overflow-auto rounded bg-black/50 p-4 font-mono text-[10px] text-neutral-400">
                {JSON.stringify(selectedCase, null, 2)}
              </pre>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}