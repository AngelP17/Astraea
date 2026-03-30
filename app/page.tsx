import dynamic from 'next/dynamic';
import { Hero } from '@/components/hero';
import { Nav } from '@/components/nav';

const CaseStudy = dynamic(() => import('@/components/case-study').then((mod) => mod.CaseStudy), {
  loading: () => <SectionPlaceholder label="Loading flagship case study" className="min-h-[28rem]" />,
});
const SystemMetrics = dynamic(() => import('@/components/system-metrics').then((mod) => mod.SystemMetrics), {
  loading: () => <SectionPlaceholder label="Loading impact metrics" className="min-h-[22rem]" />,
});
const PipelineDiagram = dynamic(() => import('@/components/pipeline-diagram').then((mod) => mod.PipelineDiagram), {
  loading: () => <SectionPlaceholder label="Loading pipeline architecture" className="min-h-[28rem]" />,
});
const DataFlowDiagram = dynamic(() => import('@/components/data-flow-diagram').then((mod) => mod.DataFlowDiagram), {
  loading: () => <SectionPlaceholder label="Loading data transformation" className="min-h-[28rem]" />,
});
const TimelineView = dynamic(() => import('@/components/timeline-view').then((mod) => mod.TimelineView), {
  loading: () => <SectionPlaceholder label="Loading execution trace" className="min-h-[28rem]" />,
});
const FailureScenario = dynamic(() => import('@/components/failure-scenario').then((mod) => mod.FailureScenario), {
  loading: () => <SectionPlaceholder label="Loading safeguard scenario" className="min-h-[24rem]" />,
});
const SystemModeSwitch = dynamic(() => import('@/components/system-mode-switch').then((mod) => mod.SystemModeSwitch), {
  loading: () => <SectionPlaceholder label="Loading control modes" className="min-h-[24rem]" />,
});
const ScrollNarrative = dynamic(() => import('@/components/scroll-narrative').then((mod) => mod.ScrollNarrative), {
  loading: () => <SectionPlaceholder label="Loading pipeline narrative" className="min-h-[30rem]" />,
});
const AuditSection = dynamic(() => import('@/components/audit-section').then((mod) => mod.AuditSection), {
  loading: () => <SectionPlaceholder label="Loading audit layer" className="min-h-[26rem]" />,
});
const ArtifactsSection = dynamic(() => import('@/components/artifacts-section').then((mod) => mod.ArtifactsSection), {
  loading: () => <SectionPlaceholder label="Loading system modules" className="min-h-[24rem]" />,
});
const Footer = dynamic(() => import('@/components/footer').then((mod) => mod.Footer), {
  loading: () => <SectionPlaceholder label="Loading footer" className="min-h-[14rem]" />,
});

export default function Page() {
  return (
    <main className="relative min-h-screen bg-background text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.24),transparent_44%),radial-gradient(circle_at_18%_24%,rgba(0,240,255,0.08),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(255,208,22,0.06),transparent_24%)]"
      />
      <Nav />
      <section id="system">
        <Hero />
      </section>
      <CaseStudy />
      <SystemMetrics />
      <PipelineDiagram />
      <AuditSection />
      <ArtifactsSection />
      <details className="group border-b border-white/5 bg-background">
        <summary className="mx-auto flex max-w-7xl list-none items-center justify-between gap-6 px-6 py-10 lg:px-10">
          <div className="max-w-3xl">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-indigo">Technical Depth</div>
            <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3.5rem)] font-extrabold tracking-[-0.03em] text-white">
              Open the deeper system views only when you want them.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-text-muted md:text-base">
              The primary path stays focused on product value. The sections below keep the architecture, trace logic,
              safeguard scenarios, and operating modes available for technical diligence without overwhelming the first impression.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/80 transition-colors group-open:border-indigo/30 group-open:bg-indigo/10 group-open:text-indigo">
            <span className="h-2 w-2 rounded-full bg-indigo transition-transform group-open:scale-125" />
            <span className="group-open:hidden">Open Deep Dive</span>
            <span className="hidden group-open:inline">Hide Deep Dive</span>
          </div>
        </summary>
        <div className="border-t border-white/5">
          <DataFlowDiagram />
          <TimelineView />
          <FailureScenario />
          <SystemModeSwitch />
          <ScrollNarrative />
        </div>
      </details>
      <Footer />
    </main>
  );
}

function SectionPlaceholder({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <section className={`border-b border-white/5 bg-background py-24 ${className ?? ''}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.12),transparent_45%),rgba(255,255,255,0.02)] p-8">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo" />
            {label}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="h-32 rounded-[1.5rem] border border-white/8 bg-white/[0.03]" />
            <div className="h-32 rounded-[1.5rem] border border-white/8 bg-white/[0.03]" />
            <div className="h-32 rounded-[1.5rem] border border-white/8 bg-white/[0.03]" />
          </div>
        </div>
      </div>
    </section>
  );
}
