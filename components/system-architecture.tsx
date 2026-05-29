'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Browser,
  Network,
  Cpu,
  Database,
  Queue,
  LockKey,
  ArrowRight,
  Info,
  CheckCircle,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface SystemNode {
  id: string;
  name: string;
  subtitle: string;
  port?: string;
  tech: string;
  icon: any;
  status: 'online' | 'active' | 'standby';
  description: string;
  modules: string[];
  guarantees: string[];
  coords: { x: number; y: number; w: number; h: number };
}

const NODES: SystemNode[] = [
  {
    id: 'nextjs',
    name: 'Next.js Console',
    subtitle: 'Operator Web Interface',
    port: ':3000',
    tech: 'React 19 / Tailwind',
    icon: Browser,
    status: 'online',
    description: 'B2B console providing proof visualization, live SSE event streams, case inspection, and interactive determinism replays.',
    modules: ['app/page.tsx', 'components/hero.tsx', 'components/audit-section.tsx'],
    guarantees: ['Renders only real backend data', 'Live SSE event binding', 'Honest offline states'],
    coords: { x: 300, y: 30, w: 200, h: 90 },
  },
  {
    id: 'fastapi',
    name: 'FastAPI Gateway',
    subtitle: 'API Service router',
    port: ':8000',
    tech: 'Python 3.11 / Uvicorn',
    icon: Network,
    status: 'online',
    description: 'API Router handling case retrieval, execution triggers, True Replay comparisons, and server-sent stream orchestration.',
    modules: ['backend/api/main.py', 'backend/api/router.py'],
    guarantees: ['Asynchronous event handlers', 'Strict JSON contracts', 'High uptime verification'],
    coords: { x: 300, y: 170, w: 200, h: 90 },
  },
  {
    id: 'pipeline',
    name: 'Astraea Pipeline',
    subtitle: '7-Stage Decision Engine',
    port: 'In-process',
    tech: 'Core Python Logic',
    icon: Cpu,
    status: 'active',
    description: 'Core runtime executing capture, normalization, feature extraction, anomaly scoring, prioritizer, decision, and dispatch steps.',
    modules: ['backend/core/pipeline.py', 'backend/decision/prioritizer.py', 'backend/evaluation/calibration.py'],
    guarantees: ['Time-instrumented stages', 'Stage-level stable hashes', 'Calibrated uncertainty bands'],
    coords: { x: 20, y: 220, w: 200, h: 100 },
  },
  {
    id: 'postgres',
    name: 'PostgreSQL DB',
    subtitle: 'Case Registry & Logs',
    port: ':5432',
    tech: 'Relational DB / SQLite fallback',
    icon: Database,
    status: 'online',
    description: 'Stores case execution metadata, severity distributions, and original event parameters to enable true historical replay.',
    modules: ['backend/database/models.py', 'backend/database/crud.py'],
    guarantees: ['ACID compliant state records', 'Safe schema validation', 'Stable key binding'],
    coords: { x: 580, y: 170, w: 200, h: 90 },
  },
  {
    id: 'redis',
    name: 'Redis / Celery',
    subtitle: 'Simulation Queue Worker',
    port: ':6379',
    tech: 'Celery / Redis / Mock Broker',
    icon: Queue,
    status: 'standby',
    description: 'Background queue handling high-throughput event generation, temporal velocity calculations, and benchmark suite runs.',
    modules: ['backend/core/worker.py', 'backend/core/temporal.py'],
    guarantees: ['Parallel stream processing', 'Non-blocking pipeline execution', 'Load-balanced worker scaling'],
    coords: { x: 300, y: 350, w: 200, h: 90 },
  },
  {
    id: 'audit',
    name: 'Audit Store',
    subtitle: 'Cryptographic Proof receipts',
    port: 'Local FS / DB',
    tech: 'JSON / SHA256 receipts',
    icon: LockKey,
    status: 'active',
    description: 'Stores immutable, stable stage hash receipts. Exposes raw JSON payloads that operators can run through the True Replay engine.',
    modules: ['backend/audit/recorder.py', 'backend/core/replay_engine.py'],
    guarantees: ['Stable SHA256 hashing', 'Stage-by-stage verification', 'Zero dynamic timestamps in signature'],
    coords: { x: 580, y: 310, w: 200, h: 90 },
  },
];

const CONNECTIONS = [
  { from: 'nextjs', to: 'fastapi', path: 'M 400 120 L 400 170', label: 'HTTP requests / SSE Stream' },
  { from: 'fastapi', to: 'pipeline', path: 'M 300 215 L 220 250', label: 'Process Event' },
  { from: 'pipeline', to: 'audit', path: 'M 220 290 L 300 375 L 580 355', label: 'Seal Stage Hashes' },
  { from: 'fastapi', to: 'postgres', path: 'M 500 215 L 580 215', label: 'Query Cases' },
  { from: 'fastapi', to: 'redis', path: 'M 400 260 L 400 350', label: 'Simulate Jobs' },
  { from: 'redis', to: 'pipeline', path: 'M 300 395 L 120 320', label: 'Temporal trigger' },
  { from: 'postgres', to: 'audit', path: 'M 680 260 L 680 310', label: 'Link Registry Record' },
];

export function SystemArchitecture() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('pipeline');
  const prefersReducedMotion = useReducedMotion();

  const selectedNode = NODES.find((n) => n.id === selectedNodeId) || NODES[2];

  return (
    <section id="architecture" className="relative border-b border-white/5 bg-surface py-20 overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Service topology &amp; data flow
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-muted">
            The full operational lifecycle: from telemetry intake through deterministic hashing, database
            persistence, queue management, and proof replication. Select a node to inspect it.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          {/* SVG Diagram Canvas */}
          <div className="border border-white/6 bg-black/40 p-4 relative overflow-hidden rounded-lg">
            <div className="absolute top-3 left-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse" />
              <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-text-dim">
                INTERACTIVE SERVICE TOPOLOGY
              </span>
            </div>

            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 800 480"
                className="w-[800px] h-[480px] select-none mx-auto block"
              >
                {/* SVG Blueprint Grid */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="800" height="480" fill="url(#grid)" />

                {/* Connection Paths */}
                {CONNECTIONS.map((conn, idx) => {
                  const isActive = conn.from === selectedNodeId || conn.to === selectedNodeId;
                  return (
                    <g key={idx}>
                      <path
                        d={conn.path}
                        fill="none"
                        className={cn(
                          "transition-all duration-300",
                          isActive ? "stroke-amber stroke-[2px]" : "stroke-white/10 stroke-[1.5px]"
                        )}
                        strokeDasharray={isActive ? "4 4" : undefined}
                      />
                    </g>
                  );
                })}

                {/* Nodes rendering */}
                {NODES.map((node) => {
                  const Icon = node.icon;
                  const isSelected = node.id === selectedNodeId;

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer group"
                      onClick={() => setSelectedNodeId(node.id)}
                    >
                      {/* Node Container Box */}
                      <rect
                        x={node.coords.x}
                        y={node.coords.y}
                        width={node.coords.w}
                        height={node.coords.h}
                        rx="4"
                        className={cn(
                          "transition-all duration-200 fill-zinc-950/90 stroke-white/10 stroke-[1.5px]",
                          isSelected && "stroke-amber/70 fill-zinc-900/90 shadow-[0_0_12px_rgba(217,119,6,0.1)]",
                          !isSelected && "hover:stroke-white/20 hover:fill-zinc-900/60"
                        )}
                      />

                      {/* Header bar within node */}
                      <line
                        x1={node.coords.x}
                        y1={node.coords.y + 28}
                        x2={node.coords.x + node.coords.w}
                        y2={node.coords.y + 28}
                        className={cn(
                          "transition-colors",
                          isSelected ? "stroke-amber/20" : "stroke-white/5"
                        )}
                      />

                      {/* Icon */}
                      <g transform={`translate(${node.coords.x + 10}, ${node.coords.y + 7})`}>
                        <Icon
                          className={cn(
                            "h-3.5 w-3.5 transition-colors",
                            isSelected ? "text-amber" : "text-text-dim group-hover:text-white"
                          )}
                        />
                      </g>

                      {/* Title */}
                      <text
                        x={node.coords.x + 30}
                        y={node.coords.y + 18}
                        fill="#FFFFFF"
                        className="font-mono text-[9px] font-bold tracking-wider"
                      >
                        {node.name.toUpperCase()}
                      </text>

                      {/* Port badge */}
                      {node.port && (
                        <text
                          x={node.coords.x + node.coords.w - 10}
                          y={node.coords.y + 18}
                          fill={isSelected ? "#D97706" : "#A1A1AA"}
                          className="font-mono text-[8px] text-right font-semibold"
                          textAnchor="end"
                        >
                          {node.port}
                        </text>
                      )}

                      {/* Subtitle / Tech details */}
                      <text
                        x={node.coords.x + 12}
                        y={node.coords.y + 44}
                        fill="#A1A1AA"
                        className="font-mono text-[8px]"
                      >
                        {node.subtitle}
                      </text>

                      <text
                        x={node.coords.x + 12}
                        y={node.coords.y + 58}
                        fill="#71717A"
                        className="font-mono text-[7px] italic"
                      >
                        {node.tech}
                      </text>

                      {/* Status Dot */}
                      <circle
                        cx={node.coords.x + node.coords.w - 14}
                        cy={node.coords.y + 50}
                        r="3.5"
                        className={cn(
                          node.status === 'online' && "fill-success animate-pulse",
                          node.status === 'active' && "fill-amber animate-pulse",
                          node.status === 'standby' && "fill-zinc-600"
                        )}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Node Inspector Workspace */}
          <div className="border border-white/6 bg-surface p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 flex items-center justify-center border border-white/5 bg-black/40">
                    <selectedNode.icon className="h-4 w-4 text-amber" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-white uppercase tracking-tight">
                      {selectedNode.name}
                    </h3>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-text-dim">
                      {selectedNode.subtitle} &middot; {selectedNode.tech}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full animate-pulse",
                    selectedNode.status === 'online' && "bg-success",
                    selectedNode.status === 'active' && "bg-amber",
                    selectedNode.status === 'standby' && "bg-zinc-600"
                  )} />
                  <span className="font-mono text-[8px] tracking-wider text-text-muted uppercase">
                    {selectedNode.status}
                  </span>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-text-muted mb-6">
                {selectedNode.description}
              </p>

              <div className="space-y-4">
                {/* Modules involved */}
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-dim block mb-2">
                    RELEVANT MODULES & FILES
                  </span>
                  <div className="space-y-1.5">
                    {selectedNode.modules.map((m) => (
                      <div key={m} className="font-mono text-[9.5px] text-white bg-black/40 border border-white/5 px-2.5 py-1 flex items-center gap-1.5 select-all">
                        <span className="h-1 w-1 bg-amber" />
                        {m}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operations & Guarantees */}
                <div className="border-t border-white/5 pt-4">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-dim block mb-2">
                    COMPLIANCE GUARANTEES
                  </span>
                  <div className="grid gap-2">
                    {selectedNode.guarantees.map((g) => (
                      <div key={g} className="flex items-center gap-2 text-xs text-text-muted">
                        <CheckCircle className="h-4 w-4 text-success shrink-0" weight="fill" />
                        <span>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-white/5 pt-4 flex justify-between items-center text-[10px] font-mono text-text-dim">
              <span>ACTIVE SELECTION:</span>
              <span className="text-amber uppercase font-bold">{selectedNode.id} node verified</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
