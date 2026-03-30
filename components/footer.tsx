import Link from 'next/link';
import { ArrowUpRight, ExternalLink, Github, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const links = [
  { label: 'System', href: '#system' },
  { label: 'Walkthrough', href: '#walkthrough' },
  { label: 'Pipeline', href: '#pipeline' },
  { label: 'Audit', href: '#audit' },
];

export function Footer() {
  return (
    <footer className="bg-black px-6 py-12 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Card padding="lg" className="border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_32%),rgba(10,10,11,0.96)]">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl border border-indigo/20 bg-indigo/10" />
                <div>
                  <div className="font-display text-2xl font-black tracking-[-0.03em] text-white">
                    ASTRAEA
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
                    Deterministic decision infrastructure
                  </div>
                </div>
              </div>

              <p className="max-w-2xl text-sm leading-7 text-neutral-400 md:text-base">
                Built for event-driven systems that need to stay explainable, replayable, and trusted under pressure.
                The goal is simple: make high-stakes decisions feel clear.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info" dot>
                  Replay-ready
                </Badge>
                <Badge variant="success" dot>
                  Audit proof
                </Badge>
                <Badge variant="warning" dot>
                  Human review
                </Badge>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-2 sm:grid-cols-2">
                {links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="group rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-4 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
                          Section
                        </div>
                        <div className="mt-1 font-display text-sm font-bold uppercase tracking-[0.08em] text-white">
                          {link.label}
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-indigo transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/engine" className="block">
                  <Button variant="primary" size="md" className="w-full justify-between">
                    <span>View engine</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="mailto:hello@astraea.systems" className="block">
                  <Button variant="secondary" size="md" className="w-full justify-between">
                    <span>Contact team</span>
                    <Mail className="h-4 w-4" />
                  </Button>
                </a>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-white/6 pt-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
                  Built to be replayed, audited, and trusted.
                </div>
                <a
                  href="https://github.com/AngelP17/Astraea"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-400 transition-colors hover:text-white"
                >
                  <Github className="h-4 w-4" />
                  Repo
                </a>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/5 pt-6 text-[10px] uppercase tracking-[0.24em] text-neutral-500 md:flex-row md:items-center md:justify-between">
          <span>Copyright 2026 Astraea</span>
          <span>Deterministic decision infrastructure for event-driven systems</span>
        </div>
      </div>
    </footer>
  );
}
