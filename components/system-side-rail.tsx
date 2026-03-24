'use client';

import { Github, Linkedin, Workflow } from 'lucide-react';
import { motion } from 'framer-motion';

const items = [
  { icon: Github, label: 'GitHub', href: 'https://github.com/AngelP17' },
  { icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  { icon: Workflow, label: 'Astraea Repo', href: 'https://github.com/AngelP17/Astraea' },
];

export function SystemSideRail() {
  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="fixed left-6 top-1/2 z-40 hidden w-16 -translate-y-1/2 flex-col items-center gap-6 border border-white/10 bg-black/50 py-8 shadow-panel backdrop-blur-md xl:flex"
    >
      <div className="mb-8 rotate-90 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500">
        SYSTEM LINKS
      </div>

      {items.map(({ icon: Icon, label, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className="group relative p-2 text-neutral-500 transition-all duration-150 hover:bg-white/5 hover:text-primary"
        >
          <Icon className="h-5 w-5" />
          <span className="pointer-events-none absolute left-full top-1/2 ml-4 -translate-y-1/2 whitespace-nowrap border border-white/10 bg-black px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            {label}
          </span>
        </a>
      ))}
    </motion.aside>
  );
}