'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Clock, Cpu, HardDrive, Pulse, Shield, Spinner, Warning } from '@phosphor-icons/react';
import { requestJson } from '@/lib/api';

interface EvaluationData {
  total_evaluated_cases: number;
  hash_consistency_rate: number;
  replay_pass_rate: number;
  audit_completeness_rate: number;
  rationale_coverage_rate: number;
  throughput_events_per_sec: number;
  latency_mean_ms: number;
  latency_p99_ms: number;
  verdict: string;
  model?: {
    version: string;
    artifact_path: string;
    threshold: number;
  };
}

interface DeepHealth {
  database: { configured: boolean; connected: boolean };
  floci: { enabled: boolean; reachable: boolean };
  celery: { configured: boolean; workers_online: number };
  pipeline: { stance: string; stages_count: number };
  artifact_counts: { results: number; demo_results: number; replays: number };
}

export function SystemMetrics() {
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [health, setHealth] = useState<DeepHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerificationData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [evaluationData, healthData] = await Promise.all([
        requestJson<EvaluationData>('/api/evaluation/latest'),
        requestJson<DeepHealth>('/api/health/deep'),
      ]);
      setEvaluation(evaluationData);
      setHealth(healthData);
    } catch (err) {
      console.error('Failed to load verification data:', err);
      setError('Backend proof endpoints are unavailable. No benchmark or health proof is being fabricated.');
      setEvaluation(null);
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVerificationData();
  }, []);

  const artifactCount = health
    ? health.artifact_counts.results + health.artifact_counts.demo_results + health.artifact_counts.replays
    : 0;

  return (
    <section id="verification" className="relative border-b border-white/5 bg-background py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Verification cockpit
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-muted">
            Metrics shown here come from the generated evaluation artifact and live deep-health endpoint.
          </p>
        </div>

        {isLoading && (
          <div className="mb-6 flex items-center justify-center gap-2 border border-white/6 bg-surface p-4 font-mono text-xs text-text-muted">
            <Spinner className="h-4 w-4 animate-spin text-amber" />
            Loading proof endpoints
          </div>
        )}

        {error && (
          <div className="mb-6 border border-danger/20 bg-danger/10 p-4 text-xs text-danger">
            <div className="flex items-center gap-2 font-mono uppercase tracking-[0.12em]">
              <Warning className="h-4 w-4" />
              Backend offline
            </div>
            <p className="mt-2 leading-relaxed text-danger/90">{error}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6 border border-white/6 bg-surface p-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-amber">
              <Cpu className="h-4 w-4" />
              Measured Evaluation
            </div>

            {evaluation ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Metric label="Cases" value={evaluation.total_evaluated_cases.toLocaleString()} suffix="events" />
                  <Metric label="Throughput" value={evaluation.throughput_events_per_sec.toLocaleString()} suffix="evt/sec" />
                  <Metric label="Mean latency" value={evaluation.latency_mean_ms.toFixed(3)} suffix="ms" />
                  <Metric label="P99 latency" value={evaluation.latency_p99_ms.toFixed(3)} suffix="ms" />
                  <Metric label="Replay pass" value={(evaluation.replay_pass_rate * 100).toFixed(2)} suffix="%" tone="success" />
                  <Metric label="Audit complete" value={(evaluation.audit_completeness_rate * 100).toFixed(2)} suffix="%" tone="success" />
                </div>

                {evaluation.model && (
                  <div className="border border-white/5 bg-black/20 p-3 font-mono text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="uppercase text-text-muted">Frozen model</span>
                      <span className="font-bold text-white">{evaluation.model.version}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="uppercase text-text-muted">Threshold</span>
                      <span className="text-amber">{evaluation.model.threshold.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border border-success/15 bg-success/5 p-3 font-mono text-[10px]">
                  <span className="uppercase text-text-muted">Artifact verdict</span>
                  <span className="text-right font-bold text-success">{evaluation.verdict}</span>
                </div>
              </>
            ) : (
              <EmptyProof message="No evaluation artifact loaded. Run `uv run python -m backend.evaluation.run_eval`." />
            )}
          </div>

          <div className="flex flex-col justify-between space-y-6 border border-white/6 bg-surface p-6">
            <div>
              <div className="mb-6 flex items-center gap-2 border-b border-white/5 pb-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-amber">
                <Pulse className="h-4 w-4" />
                Runtime Health
              </div>

              {health ? (
                <div className="space-y-4 font-mono text-xs">
                  <RuntimeRow icon={Shield} label="Policy" value={`${health.pipeline.stance} stance`} />
                  <RuntimeRow icon={Cpu} label="Pipeline stages" value={String(health.pipeline.stages_count)} />
                  <RuntimeRow
                    icon={Clock}
                    label="Database"
                    value={health.database.connected ? 'connected' : health.database.configured ? 'configured offline' : 'file fallback'}
                  />
                  <RuntimeRow
                    icon={HardDrive}
                    label="Artifact bundles"
                    value={artifactCount.toLocaleString()}
                    accent
                  />
                  <RuntimeRow
                    icon={Pulse}
                    label="Floci local emulation"
                    value={health.floci.enabled ? (health.floci.reachable ? 'reachable' : 'configured offline') : 'disabled'}
                  />
                </div>
              ) : (
                <EmptyProof message="No runtime health loaded. The UI is not substituting fake service state." />
              )}
            </div>

            <div className="border border-white/5 bg-black/20 p-3">
              <span className="block font-mono text-[8px] uppercase tracking-widest text-text-dim">Evidence endpoints</span>
              <div className="mt-2 flex flex-wrap gap-3 font-mono text-[10px]">
                <a href="/api/evaluation/latest" target="_blank" className="flex items-center gap-1 text-amber hover:text-white">
                  /api/evaluation/latest <ArrowUpRight className="h-3 w-3" />
                </a>
                <a href="/api/health/deep" target="_blank" className="flex items-center gap-1 text-amber hover:text-white">
                  /api/health/deep <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  suffix,
  tone = 'default',
}: {
  label: string;
  value: string;
  suffix: string;
  tone?: 'default' | 'success';
}) {
  return (
    <div className="border border-white/5 bg-black/30 p-4">
      <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-text-dim">{label}</span>
      <span className={`mt-2 block font-display text-2xl font-black ${tone === 'success' ? 'text-success' : 'text-white'}`}>
        {value}
        <span className="ml-1 font-mono text-[10px] text-text-dim">{suffix}</span>
      </span>
    </div>
  );
}

function RuntimeRow({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3">
      <div className="flex items-center gap-2 text-text-muted">
        <Icon className="h-4 w-4 text-text-dim" />
        <span>{label}</span>
      </div>
      <span className={`font-bold uppercase ${accent ? 'text-amber' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function EmptyProof({ message }: { message: string }) {
  return (
    <div className="border border-white/10 bg-black/30 p-5 text-sm leading-relaxed text-text-muted">
      {message}
    </div>
  );
}
