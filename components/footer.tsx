'use client';

import Link from 'next/link';
import { ArrowRight, GithubLogo, LinkedinLogo, TwitterLogo } from '@phosphor-icons/react';

export function Footer() {
  return (
    <footer className="relative border-t border-white/6 bg-surface py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-display-md font-extrabold tracking-[-0.02em] text-white">
              Ready to make your decisions deterministic?
            </h2>
            <p className="mt-5 text-body-lg text-text-muted">
              Open the command deck to inspect cases, replay proofs, and verify hash integrity.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/engine"
                className="inline-flex items-center gap-2 bg-amber px-8 py-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-zinc-950 transition-all hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(217,119,6,0.35)]"
              >
                Open Command Deck
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com/AngelP17/Astraea"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/10 bg-white/5 px-8 py-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-white transition-all hover:bg-white/[0.08]"
              >
                <GithubLogo className="h-4 w-4" />
                View Source
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-12">
            <div className="space-y-3">
              <div className="font-mono text-label uppercase tracking-[0.2em] text-text-muted">System</div>
              <div className="flex flex-col gap-2">
                <a href="#system" className="font-mono text-sm uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-white">Overview</a>
                <a href="#pipeline" className="font-mono text-sm uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-white">Pipeline</a>
                <a href="#audit" className="font-mono text-sm uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-white">Audit</a>
              </div>
            </div>
            <div className="space-y-3">
              <div className="font-mono text-label uppercase tracking-[0.2em] text-text-muted">Connect</div>
              <div className="flex gap-3">
                <a href="https://github.com/AngelP17" target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 p-2 text-text-muted transition-colors hover:border-amber hover:text-amber">
                  <GithubLogo className="h-4 w-4" />
                </a>
                <a href="#" className="rounded-full border border-white/10 p-2 text-text-muted transition-colors hover:border-amber hover:text-amber">
                  <LinkedinLogo className="h-4 w-4" />
                </a>
                <a href="#" className="rounded-full border border-white/10 p-2 text-text-muted transition-colors hover:border-amber hover:text-amber">
                  <TwitterLogo className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-white/6 pt-8 md:flex-row">
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-text-dim">
            Astraea &copy; {new Date().getFullYear()}
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-text-dim">
            Deterministic Decision Infrastructure
          </span>
        </div>
      </div>
    </footer>
  );
}
