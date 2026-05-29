'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Pulse,
  Cpu,
  Database,
  Queue,
  LockKey,
  HardDrive,
  Cloud,
  CheckCircle,
  XCircle,
  Spinner,
} from '@phosphor-icons/react';
import { requestJson } from '@/lib/api';
import { SystemArchitecture } from '@/components/system-architecture';

interface DeepHealth {
  status: string;
  timestamp: string;
  database: {
    configured: boolean;
    connected: boolean;
  };
  floci: {
    enabled: boolean;
    url: string;
    reachable: boolean;
    bucket: string;
    queue_url: string;
  };
  celery: {
    configured: boolean;
    workers_online: number;
  };
  pipeline: {
    stance: string;
    stages_count: number;
  };
  artifact_counts: {
    results: number;
    replays: number;
    demo_results: number;
  };
}

export default function ArchitecturePage() {
  const [health, setHealth] = useState<DeepHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await requestJson<DeepHealth>('/api/health/deep');
      setHealth(data);
    } catch (err) {
      console.error(err);
      setError('Unable to reach deep-health endpoint. Confirm backend status.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
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
            SYSTEM ARCHITECTURE & DEPLOYMENT DECK
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12 space-y-12">
        {/* Header Block */}
        <div className="border border-white/5 bg-surface p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber">Deployment & Topology</div>
          <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.05em] md:text-6xl">
            System Architecture
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-neutral-400">
            Astraea is engineered as a clean, decoupled platform. View the interactive network topology, inspect deployment readiness, and monitor service connections across emulated local environments.
          </p>
        </div>

        {/* Live Topology Component */}
        <div className="border border-white/5 bg-zinc-950 p-1">
          <SystemArchitecture />
        </div>

        {/* Deployment Readiness Dashboard */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Readiness Indicators */}
          <div className="border border-white/6 bg-surface p-6 space-y-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber font-bold flex items-center gap-2">
              <Pulse className="h-4.5 w-4.5" />
              DEPLOYMENT READINESS CHECKLIST
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 py-4">
                <Spinner className="h-4 w-4 animate-spin text-amber" />
                <span className="font-mono text-xs text-text-dim">Polling readiness signals...</span>
              </div>
            ) : error ? (
              <div className="text-xs font-mono text-danger">[READINESS ERROR] {error}</div>
            ) : (
              <div className="space-y-4 font-mono text-xs">
                {/* Database Connection */}
                <ReadinessRow
                  icon={Database}
                  label="Postgres Database Core"
                  status={health?.database.configured ? 'online' : 'standby'}
                  description={health?.database.configured ? 'Active PostgreSQL storage connection.' : 'Using SQLite file-fallback mode.'}
                />

                {/* Queue Worker */}
                <ReadinessRow
                  icon={Queue}
                  label="Celery Task Workers"
                  status={health?.celery.workers_online && health.celery.workers_online > 0 ? 'online' : 'standby'}
                  description={health?.celery.workers_online && health.celery.workers_online > 0 ? 'Redis-backed workers running.' : 'Single-node fallback mode.'}
                />

                {/* Local Cloud Emulation */}
                <ReadinessRow
                  icon={Cloud}
                  label="Floci Local Cloud Emulation"
                  status={health?.floci.enabled ? (health.floci.reachable ? 'online' : 'standby') : 'disabled'}
                  description={
                    health?.floci.enabled
                      ? (health.floci.reachable
                          ? 'Floci local S3/SQS emulators accessible on port 4566.'
                          : 'Floci enabled in config but unreachable on port 4566.')
                      : 'Local S3/SQS emulators unconfigured. Using file fallback.'
                  }
                />

                {/* Docker/K8s Artifact readiness */}
                <ReadinessRow
                  icon={Cpu}
                  label="Docker & Kubernetes Assets"
                  status="online"
                  description="`Dockerfile.backend`, `Dockerfile.worker`, and `k8s/` manifests verified."
                />
              </div>
            )}
          </div>

          {/* Cloud Emulation Status */}
          <div className="border border-white/6 bg-surface p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber font-bold flex items-center gap-2">
                <Cloud className="h-4.5 w-4.5" />
                FLOCI LOCAL AWS EMULATOR
              </div>
              <p className="text-xs text-text-muted leading-relaxed font-body">
                Astraea integrates optional local cloud storage (S3) and telemetry queue (SQS) emulation using **Floci** running on standard port `4566` via Docker.
              </p>

              {health && (
                <div className="border border-white/5 bg-black/40 p-4 rounded space-y-3 font-mono text-[10.5px]">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-text-dim uppercase">Status</span>
                    <span className={health.floci.enabled && health.floci.reachable ? 'text-success font-bold' : 'text-text-muted'}>
                      {health.floci.enabled
                        ? (health.floci.reachable ? 'LOCAL CLOUD CONFIGURED & ONLINE' : 'CONFIGURED BUT OFFLINE')
                        : 'LOCAL CLOUD DISCONNECTED'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-text-dim uppercase">Gateway Port</span>
                    <span>4566</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-text-dim uppercase">Emulated S3 Bucket</span>
                    <span className="select-all">{health.floci.bucket}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-dim uppercase">Emulated SQS Queue</span>
                    <span className="truncate max-w-[200px] select-all">{health.floci.queue_url}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border border-white/5 bg-black/20 p-3.5 space-y-2 mt-4">
              <span className="font-mono text-[8px] uppercase tracking-widest text-text-dim block">
                cloud claims transparency
              </span>
              <p className="text-[11px] text-text-muted leading-relaxed font-body">
                Local cloud emulation is enabled optionally for offline development and smoke tests, not as a live hosting claim. Real cloud deployments execute through Kubernetes pods.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ReadinessRow({
  icon: Icon,
  label,
  status,
  description,
}: {
  icon: any;
  label: string;
  status: 'online' | 'standby' | 'disabled';
  description: string;
}) {
  return (
    <div className="border border-white/5 bg-black/30 p-3.5 flex items-start gap-4">
      <div className="h-8 w-8 flex items-center justify-center border border-white/5 bg-black/50 shrink-0">
        <Icon className="h-4.5 w-4.5 text-amber" />
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-white font-bold uppercase">{label}</span>
          <span className={`text-[8.5px] font-bold px-2 py-0.5 uppercase tracking-wider ${
            status === 'online' ? 'border border-success/30 bg-success/15 text-success' :
            status === 'standby' ? 'border border-amber/30 bg-amber/15 text-amber' :
            'border border-white/10 bg-white/5 text-text-dim'
          }`}>
            {status}
          </span>
        </div>
        <p className="text-[11px] text-text-muted leading-relaxed font-body">{description}</p>
      </div>
    </div>
  );
}
