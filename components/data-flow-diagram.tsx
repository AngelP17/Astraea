'use client';

import { motion } from 'framer-motion';

export function DataFlowDiagram() {
  return (
    <section className="relative border-b border-white/5 bg-background py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-16 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.28em] text-secondary">Data Transformation</div>
          <h2 className="mt-5 font-headline text-4xl font-black uppercase tracking-[-0.04em] md:text-5xl">
            Event becomes Decision
          </h2>
        </div>

        <div className="relative">
        <svg className="w-full" viewBox="0 0 800 600" fill="none">
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a1faff" />
              <stop offset="50%" stopColor="#ac8aff" />
              <stop offset="100%" stopColor="#ffd16f" />
            </linearGradient>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#a1faff" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <rect x="20" y="40" width="180" height="80" rx="8" fill="#0e0e0e" stroke="#a1faff" strokeWidth="2" />
              <text x="110" y="70" textAnchor="middle" fill="#a1faff" fontSize="12" fontFamily="monospace">RAW EVENT</text>
              <text x="110" y="90" textAnchor="middle" fill="#666" fontSize="10" fontFamily="monospace">sensor_id: accel_01</text>
              <text x="110" y="105" textAnchor="middle" fill="#666" fontSize="10" fontFamily="monospace">vibration: 12.4</text>
            </motion.g>

            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <path d="M200 80 L280 80" stroke="url(#flowGradient)" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <text x="240" y="70" textAnchor="middle" fill="#666" fontSize="9" fontFamily="monospace">normalize</text>
            </motion.g>

            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <rect x="280" y="40" width="180" height="80" rx="8" fill="#0e0e0e" stroke="#ac8aff" strokeWidth="2" />
              <text x="370" y="70" textAnchor="middle" fill="#ac8aff" fontSize="12" fontFamily="monospace">FEATURE VECTOR</text>
              <text x="370" y="90" textAnchor="middle" fill="#666" fontSize="10" fontFamily="monospace">delta_vib: +4.4</text>
              <text x="370" y="105" textAnchor="middle" fill="#666" fontSize="10" fontFamily="monospace">ratio_vib: 1.55</text>
            </motion.g>

            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <path d="M460 80 L540 80" stroke="url(#flowGradient)" strokeWidth="2" />
              <text x="500" y="70" textAnchor="middle" fill="#666" fontSize="9" fontFamily="monospace">score</text>
            </motion.g>

            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <rect x="540" y="40" width="180" height="80" rx="8" fill="#0e0e0e" stroke="#ff716c" strokeWidth="2" />
              <text x="630" y="70" textAnchor="middle" fill="#ff716c" fontSize="12" fontFamily="monospace">ASSESSMENT</text>
              <text x="630" y="90" textAnchor="middle" fill="#666" fontSize="10" fontFamily="monospace">anomaly: 0.74</text>
              <text x="630" y="105" textAnchor="middle" fill="#666" fontSize="10" fontFamily="monospace">uncertainty: [0.61, 0.87]</text>
            </motion.g>

            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <path d="M630 120 L630 200" stroke="url(#flowGradient)" strokeWidth="2" />
              <text x="645" y="160" fill="#666" fontSize="9" fontFamily="monospace">decide</text>
            </motion.g>

            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
            >
              <rect x="540" y="200" width="180" height="80" rx="8" fill="#0e0e0e" stroke="#ffd16f" strokeWidth="2" />
              <text x="630" y="230" textAnchor="middle" fill="#ffd16f" fontSize="12" fontFamily="monospace">DECISION</text>
              <text x="630" y="250" textAnchor="middle" fill="#666" fontSize="10" fontFamily="monospace">action: Inspect</text>
              <text x="630" y="265" textAnchor="middle" fill="#666" fontSize="10" fontFamily="monospace">urgency: HIGH</text>
            </motion.g>

            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              <path d="M540 240 L460 240" stroke="url(#flowGradient)" strokeWidth="2" />
              <text x="500" y="230" textAnchor="middle" fill="#666" fontSize="9" fontFamily="monospace">audit</text>
            </motion.g>

            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.9 }}
            >
              <rect x="280" y="200" width="180" height="80" rx="8" fill="#0e0e0e" stroke="#a1faff" strokeWidth="2" />
              <text x="370" y="230" textAnchor="middle" fill="#a1faff" fontSize="12" fontFamily="monospace">AUDIT BUNDLE</text>
              <text x="370" y="250" textAnchor="middle" fill="#666" fontSize="10" fontFamily="monospace">hash: cfced6c0...</text>
              <text x="370" y="265" textAnchor="middle" fill="#666" fontSize="10" fontFamily="monospace">replay: VERIFIED</text>
            </motion.g>

            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
            >
              <path d="M280 280 L280 360" stroke="url(#flowGradient)" strokeWidth="2" />
              <text x="295" y="320" fill="#666" fontSize="9" fontFamily="monospace">store</text>
            </motion.g>

            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.1 }}
            >
              <rect x="180" y="360" width="200" height="100" rx="8" fill="#0e0e0e" stroke="#494847" strokeWidth="1" strokeDasharray="4 4" />
              <text x="280" y="390" textAnchor="middle" fill="#666" fontSize="12" fontFamily="monospace">ARTIFACTS</text>
              <text x="280" y="415" textAnchor="middle" fill="#555" fontSize="10" fontFamily="monospace">results/case_evt_001.json</text>
              <text x="280" y="435" textAnchor="middle" fill="#555" fontSize="10" fontFamily="monospace">replays/case_evt_001.json</text>
            </motion.g>

            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
            >
              <path d="M380 410 L460 410" stroke="#494847" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M460 410 L460 320" stroke="#494847" strokeWidth="1" strokeDasharray="4 4" />
              <text x="420" y="400" textAnchor="middle" fill="#555" fontSize="9" fontFamily="monospace">replay</text>
            </motion.g>

            <motion.circle
              cx="720" cy="450" r="60"
              fill="none" stroke="#00f4fe" strokeWidth="2"
              initial={{ strokeDasharray: "377 0", strokeDashoffset: 0 }}
              animate={{ strokeDasharray: "377 0", strokeDashoffset: [0, -377] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <text x="720" y="445" textAnchor="middle" fill="#00f4fe" fontSize="10" fontFamily="monospace">DETER-</text>
            <text x="720" y="460" textAnchor="middle" fill="#00f4fe" fontSize="10" fontFamily="monospace">MINISTIC</text>
          </svg>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-8">
          <HashBadge label="Input Hash" value="abc123..." color="#a1faff" />
          <HashBadge label="Feature Hash" value="def456..." color="#ac8aff" />
          <HashBadge label="Decision Hash" value="789xyz..." color="#ffd16f" />
          <HashBadge label="Final Hash" value="cfced6c0..." color="#00f4fe" />
        </div>
      </div>
    </section>
  );
}

function HashBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <motion.div
      className="flex items-center gap-3 rounded border border-white/10 bg-surface-low px-4 py-2"
      whileHover={{ scale: 1.05 }}
    >
      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">{label}</div>
        <div className="font-mono text-xs" style={{ color }}>{value}</div>
      </div>
    </motion.div>
  );
}
