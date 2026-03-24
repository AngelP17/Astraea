'use client';

import { motion } from 'framer-motion';
import { PipelineResult } from '@/lib/data';
import { Hash, CheckCircle2, Eye, Database, FileText, Shield, GitBranch } from 'lucide-react';

interface AuditVisualizationProps {
  result: PipelineResult;
}

const colorMap = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  secondary: { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/30' },
  danger: { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/30' },
  tertiary: { bg: 'bg-tertiary/10', text: 'text-tertiary', border: 'border-tertiary/30' },
};

export function AuditVisualization({ result }: AuditVisualizationProps) {
  const { audit } = result;

  const layers = [
    {
      id: 'event',
      label: 'Event Snapshot',
      icon: Database,
      color: 'primary',
      hash: typeof audit.event_snapshot === 'object' ? JSON.stringify(audit.event_snapshot).slice(0, 32) : '',
    },
    {
      id: 'feature',
      label: 'Feature Snapshot',
      icon: FileText,
      color: 'secondary',
      hash: typeof audit.feature_snapshot === 'object' ? JSON.stringify(audit.feature_snapshot).slice(0, 32) : '',
    },
    {
      id: 'model',
      label: 'Model Snapshot',
      icon: Shield,
      color: 'danger',
      hash: typeof audit.model_snapshot === 'object' ? JSON.stringify(audit.model_snapshot).slice(0, 32) : '',
    },
    {
      id: 'prioritization',
      label: 'Prioritization',
      icon: GitBranch,
      color: 'tertiary',
      hash: typeof audit.prioritization_snapshot === 'object' ? JSON.stringify(audit.prioritization_snapshot).slice(0, 32) : '',
    },
    {
      id: 'decision',
      label: 'Decision Snapshot',
      icon: CheckCircle2,
      color: 'primary',
      hash: typeof audit.decision_snapshot === 'object' ? JSON.stringify(audit.decision_snapshot).slice(0, 32) : '',
    },
    {
      id: 'execution',
      label: 'Execution Snapshot',
      icon: Eye,
      color: 'secondary',
      hash: typeof audit.execution_snapshot === 'object' ? JSON.stringify(audit.execution_snapshot).slice(0, 32) : '',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500">
        Audit Trail
      </div>

      <div className="space-y-3">
          {layers.map((layer, index) => (
          <motion.div
            key={layer.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="flex items-center gap-3 border border-white/5 bg-surface-low p-3"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded ${colorMap[layer.color as keyof typeof colorMap].bg}`}>
              <layer.icon className={`h-4 w-4 ${colorMap[layer.color as keyof typeof colorMap].text}`} />
            </div>
            <div className="flex-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                {layer.label}
              </div>
              <div className="mt-1 font-mono text-[9px] text-neutral-600">
                {layer.hash}...
              </div>
            </div>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded border border-primary/30 bg-primary/5 p-4"
      >
        <div className="mb-3 flex items-center gap-2">
          <Hash className="h-5 w-5 shrink-0 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            Deterministic Hash
          </span>
        </div>
        <div className="break-all font-mono text-xs text-primary truncate">
          {audit.deterministic_hash}
        </div>
        <div className="mt-3 border-t border-primary/20 pt-3 font-mono text-[10px] text-neutral-500">
          TIMESTAMP: {new Date(audit.timestamp).toISOString()}
        </div>
      </motion.div>

      <div className="rounded border border-white/5 bg-black/30 p-4">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
          Hash Computation
        </div>
        <div className="space-y-1 font-mono text-[9px] text-neutral-600">
          <div>SHA256(event_snapshot || feature_snapshot || model_snapshot ||</div>
          <div>prioritization_snapshot || decision_snapshot || execution_snapshot)</div>
          <div className="mt-2 text-primary">= {audit.deterministic_hash.slice(0, 24)}...</div>
        </div>
      </div>
    </div>
  );
}