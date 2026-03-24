'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { modules } from '@/lib/data';

export function ArtifactsSection() {
  return (
    <section id="artifacts" className="border-b border-white/5 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="font-mono text-xs uppercase tracking-[0.28em] text-primary">SYSTEM MODULES</div>
            <h2 className="mt-4 font-headline text-4xl font-black uppercase leading-none tracking-[-0.04em] md:text-6xl">
              Not portfolio cards. Deployed artifacts.
            </h2>
          </div>
          <a
            href="https://github.com/AngelP17/Astraea"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-tertiary transition-colors duration-150 hover:text-white"
          >
            Open Repository
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {modules.map((module, index) => (
            <motion.article
              key={module.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              className="group border border-white/5 bg-surface-low p-8 transition-colors duration-150 hover:bg-surface-high"
            >
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">{module.status}</div>
                <div className="h-2 w-2 rounded-full bg-primary/70 transition-transform duration-150 group-hover:scale-125" />
              </div>
              <h3 className="mt-5 font-headline text-3xl font-black uppercase tracking-tight">{module.name}</h3>
              <p className="mt-5 text-base leading-7 text-neutral-400">{module.description}</p>
              <div className="mt-8 flex flex-wrap gap-2">
                {module.tags.map((tag) => (
                  <span key={tag} className="border border-white/5 bg-black/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-300">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}