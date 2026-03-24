'use client';

import { motion } from 'framer-motion';

const links = [
  { label: 'System', href: '#system' },
  { label: 'Pipeline', href: '#pipeline' },
  { label: 'Audit', href: '#audit' },
  { label: 'Artifacts', href: '#artifacts' },
];

export function Nav() {
  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <a href="#top" className="font-headline text-2xl font-black tracking-tight text-primary">
          ASTRAEA
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-headline text-sm font-bold uppercase tracking-tight text-neutral-500 transition-colors duration-150 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden max-w-[200px] truncate border border-primary/20 bg-primary/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-primary lg:block">
          Deterministic Decision Infrastructure
        </div>
      </div>
    </motion.nav>
  );
}