import { ArtifactsSection } from '@/components/artifacts-section';
import { AuditSection } from '@/components/audit-section';
import { CursorGlow } from '@/components/cursor-glow';
import { DataFlowDiagram } from '@/components/data-flow-diagram';
import { FailureScenario } from '@/components/failure-scenario';
import { Footer } from '@/components/footer';
import { Hero } from '@/components/hero';
import { Nav } from '@/components/nav';
import { PipelineDiagram } from '@/components/pipeline-diagram';
import { ScrollNarrative } from '@/components/scroll-narrative';
import { SystemMetrics } from '@/components/system-metrics';
import { SystemModeSwitch } from '@/components/system-mode-switch';
import { SystemSideRail } from '@/components/system-side-rail';
import { TimelineView } from '@/components/timeline-view';

export default function Page() {
  return (
    <main id="system" className="relative min-h-screen bg-background text-white">
      <CursorGlow />
      <Nav />
      <SystemSideRail />
      <Hero />
      <SystemMetrics />
      <PipelineDiagram />
      <DataFlowDiagram />
      <TimelineView />
      <FailureScenario />
      <SystemModeSwitch />
      <ScrollNarrative />
      <AuditSection />
      <ArtifactsSection />
      <Footer />
    </main>
  );
}