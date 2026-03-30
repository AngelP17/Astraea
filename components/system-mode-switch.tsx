'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Sparkles, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type SystemMode = 'balanced' | 'safe' | 'autonomous';

const modes: { id: SystemMode; label: string; icon: typeof Shield; color: string; description: string }[] = [
  {
    id: 'balanced',
    label: 'BALANCED',
    icon: Activity,
    color: '#6366F1',
    description: 'Shared control between automation and review',
  },
  {
    id: 'safe',
    label: 'SAFE',
    icon: Shield,
    color: '#00F0FF',
    description: 'Maximum human oversight and lowest operational risk',
  },
  {
    id: 'autonomous',
    label: 'AUTONOMOUS',
    icon: Sparkles,
    color: '#FFD016',
    description: 'Higher automation with tighter policy guardrails',
  },
];

const behaviorDetails: Record<SystemMode, { reviewThreshold: string; autoAction: string; riskTolerance: string }> = {
  balanced: {
    reviewThreshold: 'uncertainty > 0.30',
    autoAction: 'medium priority only',
    riskTolerance: 'balanced',
  },
  safe: {
    reviewThreshold: 'uncertainty > 0.15',
    autoAction: 'low priority only',
    riskTolerance: 'zero-trust',
  },
  autonomous: {
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
          <div className="font-mono text-xs uppercase tracking-[0.28em] text-indigo">Control Policy Preview</div>
          <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.5rem)] font-extrabold tracking-[-0.04em] text-white">
            Preview the operating stance before it becomes a real control surface.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-text-muted">
            These modes are product policy previews that show how Astraea could trade automation for oversight. They are intentionally framed as operating models, not live backend toggles.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex justify-center">
            <Badge variant="info" dot>
              Policy preview, not live production control
            </Badge>
          </div>
          <div className="mb-8 flex justify-center gap-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`relative px-6 py-3 font-display text-sm font-bold uppercase tracking-wider transition-all ${
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
                <div className="font-display text-lg font-bold uppercase" style={{ color: active.color }}>
                  {active.label} stance preview
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  {active.description}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="border border-white/10 p-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 truncate">
                  Review Threshold
                </div>
                  <div className="font-mono text-sm truncate" style={{ color: active.color }}>
                    {behavior.reviewThreshold}
                  </div>
                </div>

              <div className="border border-white/10 p-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 truncate">
                  Auto Action
                </div>
                <div className="font-mono text-sm truncate" style={{ color: active.color }}>
                  {behavior.autoAction}
                </div>
              </div>

              <div className="border border-white/10 p-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 truncate">
                  Risk Tolerance
                </div>
                <div className="font-mono text-sm truncate" style={{ color: active.color }}>
                  {behavior.riskTolerance}
                </div>
              </div>
            </div>

            {activeMode === 'safe' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 flex items-center gap-2 border border-cyan/20 bg-cyan/10 p-3"
              >
                <Shield className="h-4 w-4 shrink-0 text-cyan" />
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-cyan truncate">
                  Safe stance: every uncertain decision is routed to human review
                </span>
              </motion.div>
            )}

            {activeMode === 'autonomous' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 flex items-center gap-2 border border-amber/20 bg-amber/10 p-3"
              >
                <Info className="h-4 w-4 shrink-0 text-amber" />
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-amber truncate">
                  Autonomous stance: faster routing, but still bounded by critical-case review rules
                </span>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
