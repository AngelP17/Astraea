'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, X } from '@phosphor-icons/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const links = [
  { label: 'Overview', href: '#system' },
  { label: 'Walkthrough', href: '#walkthrough' },
  { label: 'Pipeline', href: '#pipeline' },
  { label: 'Audit', href: '#audit' },
];

export function Nav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const sections = links.map(l => l.href.slice(1));
    const observers: IntersectionObserver[] = [];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: '-40% 0px -40% 0px' }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
          isScrolled
            ? 'bg-background/80 backdrop-blur-xl border-b border-white/6 py-3'
            : 'bg-transparent py-4'
        )}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex items-center justify-between">
            <a href="#top" className="font-display text-lg font-bold tracking-tight text-white">
              ASTRAEA
            </a>

            <div className="hidden items-center gap-8 md:flex">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="group relative font-mono text-xs font-medium uppercase tracking-[0.15em] text-neutral-400 transition-colors duration-150 hover:text-white"
                >
                  {link.label}
                  <span
                    className={cn(
                      'absolute -bottom-1 left-0 h-px bg-amber transition-all duration-200',
                      activeSection === link.href.slice(1) ? 'w-full' : 'w-0 group-hover:w-full'
                    )}
                  />
                </a>
              ))}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <a
                href="#top"
                className="font-mono text-xs uppercase tracking-[0.1em] text-neutral-400 transition-colors hover:text-white"
              >
                Live Demo
              </a>
              <Link
                href="/engine"
                className="rounded border border-amber bg-amber/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-amber transition-colors hover:bg-amber/20"
              >
                Open Engine
              </Link>
            </div>

            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 text-neutral-400 transition-colors hover:text-white md:hidden"
              aria-label="Open menu"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-surface border-l border-white/10 p-6 md:hidden"
            >
              <div className="flex justify-end mb-8">
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 text-neutral-400 transition-colors hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-6">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'block font-mono text-sm uppercase tracking-[0.15em] transition-colors',
                      activeSection === link.href.slice(1)
                        ? 'text-amber'
                        : 'text-neutral-400 hover:text-white'
                    )}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="pt-6 border-t border-white/10 space-y-3">
                  <a
                    href="#top"
                    className="block font-mono text-sm uppercase tracking-[0.15em] text-neutral-400 hover:text-white"
                  >
                    Live Demo
                  </a>
                  <Link
                    href="/engine"
                    onClick={() => setIsMobileOpen(false)}
                    className="block rounded border border-amber bg-amber/10 px-4 py-3 font-mono text-xs uppercase tracking-[0.1em] text-amber text-center hover:bg-amber/20"
                  >
                    Open Engine
                  </Link>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
