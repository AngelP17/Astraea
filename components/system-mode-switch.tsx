'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Pulse, Shield, Sparkle, Info, ShieldCheck } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

type SystemStance = 'safe' | 'balanced' | 'autonomous';

interface StanceInfo {
  id: SystemStance;
  label: string;
  icon: typeof Shield;
  color: string;
  description: string;
  threshold: number;
  autoAction: string;
  tolerance: string;
  explanation: string;
}

const stances: StanceInfo[] = [
  {
    id: 'safe',
    label: 'SAFE (ZERO TRUST)',
    icon: Shield,
    color: '#10B981',
    description: 'Minimum auto-execution, maximum human verification',
    threshold: 0.15,
    autoAction: 'Low priority telemetry only',
    tolerance: 'Strict Zero-Trust',
    explanation: 'Surfaces anomalies aggressively. If uncertainty bounds exceed 15%, Astraea locks down auto-actions and routes directly to human operators.',
  },
  {
    id: 'balanced',
    label: 'BALANCED',
    icon: Pulse,
    color: '#D97706',
    description: 'Shared control between automation and human operators',
    threshold: 0.30,
    autoAction: 'Low & Medium priority',
    tolerance: 'Balanced Risk Stance',
    explanation: 'Default operational posture. Bypasses human review for standardized low/medium priority events, routing only high-uncertainty signals.',
  },
  {
    id: 'autonomous',
    label: 'AUTONOMOUS',
    icon: Sparkle,
    color: '#EF4444',
    description: 'Automated execution within policy guardrails',
    threshold: 0.50,
    autoAction: 'All except Critical failures',
    tolerance: 'Optimized Throughput',
    explanation: 'High automation Stance. Assumes automated actions are safe unless the uncertainty interval breaches a wide 50% risk threshold.',
  },
];

export function SystemModeSwitch() {
  const [activeStance, setActiveStance] = useState<SystemStance>('safe');
  const prefersReducedMotion = useReducedMotion();

  const active = stances.find((s) => s.id === activeStance)!;

  return (
    <section id="uncertainty-gate" className="relative border-b border-white/5 bg-surface py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Uncertainty gate &amp; operating stances
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-muted">
            Configure decision boundaries by defining the exact uncertainty threshold at which Astraea routes decisions
            to human review.
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex justify-center">
            <div className="flex items-center gap-2 border border-white/6 bg-black/40 px-3 py-1.5 rounded-none font-mono text-[9px] uppercase tracking-wider text-text-dim">
              <Info className="h-3.5 w-3.5 text-amber" />
              <span>STANCE PREVIEW · NOT LIVE PRODUCTION SWITCH</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {stances.map((stance) => {
              const isActive = activeStance === stance.id;
              const Icon = stance.icon;
              return (
                <button
                  key={stance.id}
                  onClick={() => setActiveStance(stance.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-3 border transition-colors cursor-pointer group",
                    isActive 
                      ? "border-white/20 text-zinc-950 font-bold" 
                      : "border-white/5 bg-black/20 text-neutral-400 hover:border-white/10"
                  )}
                  style={{
                    backgroundColor: isActive ? stance.color : undefined,
                  }}
                >
                  <Icon className={cn("h-5 w-5 mb-1.5", isActive ? "text-zinc-950" : "text-text-dim group-hover:text-text-muted")} />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-center">
                    {stance.id}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className="border border-white/10 bg-black/40 p-5 space-y-5"
            style={{ borderColor: `${active.color}20` }}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center border border-white/5 bg-white/[0.02]">
                <active.icon className="h-5 w-5 animate-pulse" style={{ color: active.color }} />
              </div>
              <div>
                <div className="font-display text-sm font-bold uppercase" style={{ color: active.color }}>
                  {active.label} Posture
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-dim">
                  {active.description}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="border border-white/5 bg-surface p-3 space-y-1">
                <span className="font-mono text-[8px] uppercase tracking-widest text-text-dim block">GATE TRIGGER</span>
                <span className="font-mono text-[11px] font-bold text-white uppercase truncate block">
                  uncertainty &gt; {active.threshold}
                </span>
              </div>
              <div className="border border-white/5 bg-surface p-3 space-y-1">
                <span className="font-mono text-[8px] uppercase tracking-widest text-text-dim block">AUTO ACTIONS</span>
                <span className="font-mono text-[11px] font-bold text-white uppercase truncate block">
                  {active.autoAction}
                </span>
              </div>
              <div className="border border-white/5 bg-surface p-3 space-y-1">
                <span className="font-mono text-[8px] uppercase tracking-widest text-text-dim block">RISK TOLERANCE</span>
                <span className="font-mono text-[11px] font-bold text-white uppercase truncate block">
                  {active.tolerance}
                </span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <span className="font-mono text-[8px] uppercase tracking-widest text-text-dim block">LOGIC DESCRIPTION</span>
              <p className="mt-1.5 text-xs leading-relaxed text-neutral-300">
                {active.explanation}
              </p>
            </div>

            {/* Threshold Visualizer bar */}
            <div className="space-y-1.5 border-t border-white/5 pt-4">
              <div className="flex justify-between font-mono text-[8px] text-text-dim uppercase">
                <span>GATE TRIGGER INTERVAL</span>
                <span style={{ color: active.color }}>{active.threshold * 100}% UNCERTAINTY BOUND</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-white/10" style={{ width: '15%' }} />
                <div className="absolute inset-y-0 left-[15%] bg-white/10" style={{ width: '15%' }} />
                <div className="absolute inset-y-0 left-[30%] bg-white/10" style={{ width: '20%' }} />
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-300"
                  style={{ 
                    backgroundColor: active.color,
                    width: `${active.threshold * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
