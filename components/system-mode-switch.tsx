'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, AlertTriangle, Activity } from 'lucide-react';

type SystemMode = 'normal' | 'safe' | 'aggressive';

const modes: { id: SystemMode; label: string; icon: typeof Shield; color: string; description: string }[] = [
  {
    id: 'normal',
    label: 'NORMAL',
    icon: Activity,
    color: '#a1faff',
    description: 'Balanced decision-making',
  },
  {
    id: 'safe',
    label: 'SAFE',
    icon: Shield,
    color: '#ac8aff',
    description: 'Maximum human oversight',
  },
  {
    id: 'aggressive',
    label: 'AGGRESSIVE',
    icon: Zap,
    color: '#ffd16f',
    description: 'More autonomous actions',
  },
];

const behaviorDetails: Record<SystemMode, { reviewThreshold: string; autoAction: string; riskTolerance: string }> = {
  normal: {
    reviewThreshold: 'uncertainty > 0.30',
    autoAction: 'medium priority only',
    riskTolerance: 'balanced',
  },
  safe: {
    reviewThreshold: 'uncertainty > 0.15',
    autoAction: 'low priority only',
    riskTolerance: 'zero-trust',
  },
  aggressive: {
    reviewThreshold: 'uncertainty > 0.50',
    autoAction: 'all except critical',
    riskTolerance: 'efficient',
  },
};

export function SystemModeSwitch() {
  const [activeMode, setActiveMode] = useState<SystemMode>('safe');

  const active = modes.find((m) => m.id === activeMode)!;
  const behavior = behaviorDetails[activeMode];

  return (
    <section className="relative border-b border-white/5 bg-surface py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-8 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.28em] text-neutral-500">Enterprise Controls</div>
          <h2 className="mt-4 font-headline text-3xl font-black uppercase tracking-[-0.04em]">
            SYSTEM MODE SWITCH
          </h2>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex justify-center gap-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`relative px-6 py-3 font-headline text-sm font-bold uppercase tracking-wider transition-all ${
                  activeMode === mode.id
                    ? 'text-black'
                    : 'border border-white/20 text-neutral-400 hover:border-white/40'
                }`}
                style={{
                  backgroundColor: activeMode === mode.id ? mode.color : 'transparent',
                }}
              >
                {activeMode === mode.id && (
                  <motion.div
                    layoutId="activeMode"
                    className="absolute inset-0 -z-10"
                    style={{ backgroundColor: mode.color }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <mode.icon className="mr-2 inline h-4 w-4" />
                {mode.label}
              </button>
            ))}
          </div>

          <motion.div
            key={activeMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-white/10 bg-black/40 p-6"
            style={{ borderColor: `${active.color}30` }}
          >
            <div className="mb-6 flex items-center gap-3">
              <active.icon className="h-6 w-6" style={{ color: active.color }} />
              <div>
                <div className="font-headline text-lg font-bold uppercase" style={{ color: active.color }}>
                  {active.label} MODE ACTIVE
                </div>
                <div className="font-mono text-[10px] text-neutral-500">
                  {active.description}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="border border-white/10 p-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  Review Threshold
                </div>
                <div className="font-mono text-sm" style={{ color: active.color }}>
                  {behavior.reviewThreshold}
                </div>
              </div>

              <div className="border border-white/10 p-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  Auto Action
                </div>
                <div className="font-mono text-sm" style={{ color: active.color }}>
                  {behavior.autoAction}
                </div>
              </div>

              <div className="border border-white/10 p-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  Risk Tolerance
                </div>
                <div className="font-mono text-sm" style={{ color: active.color }}>
                  {behavior.riskTolerance}
                </div>
              </div>
            </div>

            {activeMode === 'safe' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 flex items-center gap-2 border border-ac8aff/20 bg-ac8aff/10 p-3"
              >
                <Shield className="h-4 w-4 text-ac8aff" />
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ac8aff">
                  SAFE mode: All uncertain decisions routed to human review
                </span>
              </motion.div>
            )}

            {activeMode === 'aggressive' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 flex items-center gap-2 border border-ffd16f/20 bg-ffd16f/10 p-3"
              >
                <AlertTriangle className="h-4 w-4 text-ffd16f" />
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ffd16f">
                  AGGRESSIVE mode: Fewer review gates, faster decisions
                </span>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}