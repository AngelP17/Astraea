import { Nav } from '@/components/nav';
import { Hero } from '@/components/hero';
import { AuditSection } from '@/components/audit-section';
import { SystemModeSwitch } from '@/components/system-mode-switch';
import { ConsequenceLayer } from '@/components/consequence-layer';
import { SystemArchitecture } from '@/components/system-architecture';
import { SystemMetrics } from '@/components/system-metrics';
import { Footer } from '@/components/footer';

export default function Page() {
  return (
    <main className="overflow-x-hidden w-full max-w-full min-h-screen bg-background text-white selection:bg-amber/30 selection:text-white">
      {/* System grid trace overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 grid-bg opacity-20"
      />
      
      {/* Navigation Rail */}
      <div className="relative z-50">
        <Nav />
      </div>

      {/* Main trace sections */}
      <div className="relative z-10 space-y-0">
        <section id="hero" className="relative">
          <Hero />
        </section>

        <section id="replay" className="relative border-t border-white/5">
          <AuditSection />
        </section>

        <section id="stances" className="relative border-t border-white/5">
          <SystemModeSwitch />
        </section>

        <section id="consequences" className="relative border-t border-white/5">
          <ConsequenceLayer />
        </section>

        <section id="topology" className="relative border-t border-white/5">
          <SystemArchitecture />
        </section>

        <section id="metrics" className="relative border-t border-white/5">
          <SystemMetrics />
        </section>
      </div>

      {/* Footer */}
      <div className="relative z-20 border-t border-white/5 bg-zinc-950">
        <Footer />
      </div>
    </main>
  );
}
