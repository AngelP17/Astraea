'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Clock,
  Cpu,
  Pulse,
  Warning,
  CheckCircle,
  FileText,
  TrendUp,
  Coins,
  ArrowUpRight,
  Spinner,
} from '@phosphor-icons/react';
import { requestJson } from '@/lib/api';

interface Claim {
  claim: string;
  evidence_file: string;
  demo_surface: string;
  test: string;
  status: 'Verified' | 'Measured' | 'Partial' | 'Prototype';
}

interface EvaluationMetrics {
  timestamp: string;
  total_evaluated_cases: number;
  hash_consistency_rate: number;
  replay_pass_rate: number;
  audit_completeness_rate: number;
  mean_rationale_count: number;
  routing_distribution: Record<string, number>;
  severity_distribution: Record<string, number>;
  priority_score_variance: number;
  baselines: Record<
    string,
    {
      name: string;
      downtime_avoided_minutes: number;
      usd_exposure_prevented: number;
      precision: number;
      recall: number;
      routing_accuracy: number;
      false_escalation_rate?: number;
      pr_auc?: number;
    }
  >;
  model?: {
    version: string;
    artifact_path: string;
    threshold: number;
  };
}

export default function EvaluationPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [claimsData, metricsData] = await Promise.all([
        requestJson<Claim[]>('/api/claims'),
        requestJson<EvaluationMetrics>('/api/evaluation/latest'),
      ]);
      setClaims(claimsData);
      setMetrics(metricsData);
    } catch (err) {
      console.error(err);
      setError('Failed to query evaluation suite. Verify API status.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background text-white selection:bg-amber/30">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 font-display text-xl font-black tracking-tight text-amber">
            <ArrowLeft className="h-5 w-5" />
            ASTRAEA
          </Link>
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
            EVALUATION & CLAIMS AUDIT ROOM
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12 space-y-10">
        {/* Header Block */}
        <div className="border border-white/5 bg-surface p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber">Research & Validation</div>
          <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.05em] md:text-6xl">
            Claims & Baseline Evaluation
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-neutral-400">
            Inspect the claim matrix, frozen model artifact, measured synthetic evaluation, and baseline outcomes. Unsupported claims stay marked partial.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner className="h-8 w-8 animate-spin text-amber" />
            <span className="font-mono text-xs uppercase tracking-widest text-text-dim mt-4">Loading evaluation runs...</span>
          </div>
        ) : error ? (
          <div className="border border-danger/20 bg-danger/10 p-6 text-danger text-xs font-mono">
            [ERROR] {error}
            <button onClick={loadData} className="mt-4 block border border-danger/30 px-3 py-1 uppercase tracking-widest hover:bg-danger/20">
              Retry Load
            </button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] items-start">
            {/* Left: Main evaluation tables */}
            <div className="space-y-8">
              {/* Claims matrix */}
              <div className="border border-white/6 bg-surface p-5 space-y-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber font-bold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  CLAIMS-TO-PROOF MATRIX
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[10.5px]">
                    <thead>
                      <tr className="border-b border-white/10 text-text-dim uppercase tracking-wider text-[9px]">
                        <th className="pb-3 pr-4">CLAIM</th>
                        <th className="pb-3 pr-4">EVIDENCE SOURCE</th>
                        <th className="pb-3 pr-4">VERIFICATION TEST</th>
                        <th className="pb-3 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {claims.map((claim) => (
                        <tr key={claim.claim} className="hover:bg-white/[0.01]">
                          <td className="py-3.5 pr-4 text-white font-bold">{claim.claim}</td>
                          <td className="py-3.5 pr-4 text-text-muted select-all">{claim.evidence_file}</td>
                          <td className="py-3.5 pr-4 text-text-dim select-all">{claim.test}</td>
                          <td className="py-3.5 text-right">
                            <span className={`px-2 py-0.5 font-bold uppercase text-[9px] ${
                              claim.status === 'Verified' ? 'border border-success/30 bg-success/15 text-success' :
                              claim.status === 'Measured' ? 'border border-amber/30 bg-amber/15 text-amber' :
                              claim.status === 'Partial' ? 'border border-zinc-500/30 bg-zinc-500/10 text-zinc-400' :
                              'border border-white/10 bg-white/5 text-text-dim'
                            }`}>
                              {claim.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Baseline comparison */}
              {metrics && (
                <div className="border border-white/6 bg-surface p-5 space-y-6">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber font-bold flex items-center gap-2">
                      <TrendUp className="h-4 w-4" />
                      BASELINE PERFORMANCE COMPARISONS
                    </div>
                    <span className="text-[10px] font-mono text-text-dim mt-1 block uppercase">
                      simulated economic and downtime savings over {metrics.total_evaluated_cases} standard case trials
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {Object.entries(metrics.baselines).map(([key, base]) => {
                      const isAstraea = key === 'astraea';
                      return (
                        <div key={key} className={`border p-4 space-y-4 flex flex-col justify-between ${
                          isAstraea ? 'border-amber/30 bg-amber/5' : 'border-white/5 bg-black/40'
                        }`}>
                          <div>
                            <span className={`font-mono text-[9px] uppercase tracking-wider ${isAstraea ? 'text-amber font-bold' : 'text-text-dim'}`}>
                              {base.name}
                            </span>
                            <div className="mt-4 space-y-2.5 font-mono text-xs">
                              <div className="flex justify-between">
                                <span className="text-text-dim">DOWNTIME AVOIDED:</span>
                                <span className="text-white font-bold">{base.downtime_avoided_minutes} min</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-text-dim">USD EXPOSURE:</span>
                                <span className="text-white font-bold">${base.usd_exposure_prevented.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-text-dim">PRECISION:</span>
                                <span className="text-white font-bold">{(base.precision * 100).toFixed(0)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-text-dim">RECALL:</span>
                                <span className="text-white font-bold">{(base.recall * 100).toFixed(0)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-text-dim">ROUTING ACCURACY:</span>
                                <span className="text-white font-bold">{(base.routing_accuracy * 100).toFixed(0)}%</span>
                              </div>
                              {base.false_escalation_rate !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-text-dim">FALSE ALERTS:</span>
                                  <span className="text-white">{(base.false_escalation_rate * 100).toFixed(0)}%</span>
                                </div>
                              )}
                              {base.pr_auc !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-text-dim">PR-AUC:</span>
                                  <span className="text-white">{base.pr_auc.toFixed(4)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {isAstraea && (
                            <div className="border-t border-amber/15 pt-3 font-mono text-[9px] text-amber uppercase font-semibold">
                              PROVENANCE: Frozen model + deterministic pipeline
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="border border-white/5 bg-black/20 p-4 space-y-2">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-text-dim block">
                      synthetic calibration note
                    </span>
                    <p className="text-[11px] text-text-muted leading-relaxed font-body">
                      Economic metrics represent aggregated calculations matching the current in-process prioritization logic and are labeled explicitly to guarantee engineering honesty.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Observability Summary */}
            {metrics && (
              <div className="space-y-6">
                <div className="border border-white/6 bg-surface p-5 space-y-6">
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber font-bold flex items-center gap-2">
                    <Pulse className="h-4.5 w-4.5" />
                    SUITE METRICS
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    <MetricRow label="HASH-CHAIN CONSISTENCY" value={`${(metrics.hash_consistency_rate * 100).toFixed(2)}%`} valueClass="text-success font-bold" />
                    <MetricRow label="REPLAY PASS RATE" value={`${(metrics.replay_pass_rate * 100).toFixed(2)}%`} valueClass="text-success font-bold" />
                    <MetricRow label="AUDIT LOG COMPLETENESS" value={`${(metrics.audit_completeness_rate * 100).toFixed(2)}%`} valueClass="text-success font-bold" />
                    <MetricRow label="MEAN RATIONALE COUNT" value={metrics.mean_rationale_count.toFixed(2)} />
                    <MetricRow label="PRIORITY SCORE VARIANCE" value={metrics.priority_score_variance.toFixed(2)} />
                    
                    <div className="border-t border-white/5 pt-4">
                      <span className="text-text-dim text-[9px] uppercase tracking-[0.2em] block mb-2">ROUTING ALLOCATION</span>
                      <div className="space-y-2 text-[11px]">
                        {Object.entries(metrics.routing_distribution).map(([bucket, value]) => (
                          <div key={bucket} className="flex justify-between">
                            <span className="text-text-muted">{bucket.replace(/_/g, ' ')}</span>
                            <span>{(value * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Artifact reference */}
                <div className="border border-white/6 bg-surface p-5 space-y-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber font-bold flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5" />
                    VALIDATION FILES
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed font-body">
                    The evaluation suite generates dynamic audit files on each run. Inspect the raw outputs locally:
                  </p>
                  
                  <div className="space-y-2 font-mono text-[9px]">
                    <ArtifactLink label="Latest JSON Report" path="artifacts/evaluation/eval_latest.json" />
                    <ArtifactLink label="Latest Markdown Report" path="artifacts/evaluation/eval_latest.md" />
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

function MetricRow({ label, value, valueClass = 'text-white' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
      <span className="text-text-dim text-[9px] uppercase tracking-wider">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

function ArtifactLink({ label, path }: { label: string; path: string }) {
  return (
    <div className="bg-black/40 border border-white/5 p-2 flex items-center justify-between select-all">
      <div className="flex flex-col">
        <span className="text-white font-bold">{label}</span>
        <span className="text-text-dim text-[8px] mt-0.5">{path}</span>
      </div>
      <ArrowUpRight className="h-3 w-3 text-amber shrink-0" />
    </div>
  );
}
