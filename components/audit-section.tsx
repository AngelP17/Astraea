'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Fingerprint, CheckCircle, Warning, Spinner, ShieldCheck, ArrowRight, Play } from '@phosphor-icons/react';
import { fetchCases, PipelineResult, verifyReplay } from '@/lib/data';
import { cn } from '@/lib/utils';

interface VerificationResponse {
  case_id: string;
  verified: boolean;
  original_hash: string;
  replay_hash: string;
  original_case_id: string;
  replay_case_id: string;
  stage_outputs_match: boolean;
  replay_result: PipelineResult;
}

export function AuditSection() {
  const [cases, setCases] = useState<PipelineResult[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const loadCases = useCallback(async () => {
    try {
      const list = await fetchCases();
      setCases(list);
      if (list.length > 0 && !selectedCaseId) {
        setSelectedCaseId(list[list.length - 1].case_id);
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    }
  }, [selectedCaseId]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleVerify = async () => {
    if (!selectedCaseId) return;
    setIsVerifying(true);
    setError(null);
    setResult(null);
    try {
      const data = await verifyReplay(selectedCaseId);
      if (!data) {
        throw new Error('Replay verification returned no payload');
      }
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('Verification request failed. Check API health.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section id="audit" className="relative border-b border-white/5 bg-background py-20">
      <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-12 max-w-2xl">
          <div className="mb-3 flex">
            <span className="flex items-center gap-1.5 border border-amber/20 bg-amber/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-amber">
              <Fingerprint className="h-3.5 w-3.5" />
              Prove determinism
            </span>
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Deterministic execution replay
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-muted">
            Astraea persists every state transition from ingest to dispatch as a cryptographic proof bundle.
            Choose an executed case below to replay its raw inputs and verify hash stability.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          {/* Left panel: Verification Workspace */}
          <div className="border border-white/6 bg-surface p-6 space-y-6">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-dim">STEP 1: SELECT CASE INSTANCE</span>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedCaseId}
                  onChange={(e) => {
                    setSelectedCaseId(e.target.value);
                    setResult(null);
                    setError(null);
                  }}
                  className="flex-1 bg-black/60 border border-white/10 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber min-w-[200px]"
                >
                  <option value="">Awaiting pipeline execution...</option>
                  {cases.map((c) => (
                    <option key={c.case_id} value={c.case_id}>
                      {c.case_id} &middot; {c.event.event_type.toUpperCase()} ({c.event.machine_id})
                    </option>
                  ))}
                </select>
                <button
                  onClick={loadCases}
                  className="border border-white/10 bg-white/[0.02] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-text-muted hover:bg-white/[0.06] hover:text-white"
                >
                  REFRESH QUEUE
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-dim">STEP 2: REPLAY FROM STORED INPUT</span>
              <button
                onClick={handleVerify}
                disabled={!selectedCaseId || isVerifying}
                className="w-full flex items-center justify-center gap-2 border border-amber/40 bg-amber px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-zinc-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-hover hover:border-amber-hover"
              >
                {isVerifying ? (
                  <>
                    <Spinner className="h-4 w-4 animate-spin" />
                    RECONSTRUCTING RUNTIME STATE...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" weight="fill" />
                    REPLAY &amp; VERIFY HASH
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="border border-danger/20 bg-danger/10 p-3 text-danger text-xs font-mono">
                [ERROR] {error}
              </div>
            )}

            {result && (
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 border-t border-white/5 pt-4"
              >
                <div className={cn(
                  "border p-4 flex items-start gap-3",
                  result.verified ? "border-success/20 bg-success/5" : "border-danger/20 bg-danger/5"
                )}>
                  {result.verified ? (
                    <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" weight="fill" />
                  ) : (
                    <Warning className="h-5 w-5 text-danger shrink-0 mt-0.5" weight="fill" />
                  )}
                  <div className="space-y-1">
                    <h4 className={cn("font-mono text-xs font-bold uppercase", result.verified ? "text-success" : "text-danger")}>
                      {result.verified ? "VERIFICATION CRITERIA SATISFIED" : "HASH MISMATCH DETECTED"}
                    </h4>
                    <p className="text-xs text-text-muted leading-relaxed">
                      {result.verified 
                        ? "Cryptographic proof matches perfectly. Astraea has successfully replayed the case input from identical state parameters, yielding the exact same deterministic hash."
                        : "State parameter divergence has broken determinism. The replayed case hash does not match original database state."
                      }
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="border border-white/5 bg-black/40 p-3">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-dim">STAGE OUTPUTS</span>
                    <div className={cn("mt-1 font-mono font-bold uppercase", result.stage_outputs_match ? "text-success" : "text-danger")}>
                      {result.stage_outputs_match ? "ALL 7 MATCH" : "DIVERGED"}
                    </div>
                  </div>
                  <div className="border border-white/5 bg-black/40 p-3">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-dim">BUNDLE HASH</span>
                    <div className={cn("mt-1 font-mono font-bold uppercase", result.verified ? "text-success" : "text-danger")}>
                      {result.verified ? "EXACT MATCH" : "MISMATCH"}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right panel: Side-by-Side cryptographic comparison */}
          <div className="border border-white/6 bg-surface p-6 space-y-6 h-full flex flex-col justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber font-bold mb-4">
                HASH CHAIN COMPARISON
              </div>
              <p className="text-xs leading-relaxed text-text-muted mb-6">
                Most decision systems cannot reproduce conclusions because ML model scores are volatile and non-deterministic. 
                Astraea forces validation by enforcing state encapsulation.
              </p>

              <div className="space-y-4 font-mono text-[10px]">
                <div className="space-y-1.5">
                  <span className="text-text-dim block">ORIGINAL BUNDLE SIGNATURE</span>
                  <div className="border border-white/10 bg-black/50 p-2.5 break-all text-white select-all">
                    {result ? result.original_hash : 'sha256:AWAITING_VERIFICATION_EXECUTION...'}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="text-text-dim block">REPLAYED EVALUATION SIGNATURE</span>
                  <div className={cn(
                    "border p-2.5 break-all select-all",
                    result 
                      ? (result.verified ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger")
                      : "border-white/10 bg-black/50 text-text-dim"
                  )}>
                    {result ? result.replay_hash : 'sha256:AWAITING_VERIFICATION_EXECUTION...'}
                  </div>
                </div>
              </div>
            </div>

            {result && result.verified && (
              <div className="border border-white/5 bg-black/20 p-4 space-y-2 mt-6">
                <div className="flex items-center gap-2 text-success">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold">AUDIT MATCH VERIFIED</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Both state hashes matched on 7 pipeline stages. The execution provenance has been updated to <strong>REPLAYED</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
