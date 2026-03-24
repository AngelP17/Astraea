import { ArtifactsSection } from '@/components/artifacts-section';
import { AuditSection } from '@/components/audit-section';
import { CursorGlow } from '@/components/cursor-glow';
import { Footer } from '@/components/footer';
import { Hero } from '@/components/hero';
import { Nav } from '@/components/nav';
import { ScrollNarrative } from '@/components/scroll-narrative';
import { SystemSideRail } from '@/components/system-side-rail';

export default function Page() {
  return (
    <main id="system" className="relative min-h-screen bg-background text-white">
      <CursorGlow />
      <Nav />
      <SystemSideRail />
      <Hero />
      <ScrollNarrative />
      <AuditSection />
      <ArtifactsSection />
      <Footer />
    </main>
  );
}