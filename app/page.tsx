import { Hero } from '@/components/hero';
import { Nav } from '@/components/nav';
import { BentoSection } from '@/components/bento-section';
import { MarqueeSection } from '@/components/marquee-section';
import { PinnedSection } from '@/components/pinned-section';
import { Footer } from '@/components/footer';

export default function Page() {
  return (
    <main className="overflow-x-hidden w-full max-w-full">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.18),transparent_44%),radial-gradient(circle_at_18%_24%,rgba(161,161,170,0.06),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(217,119,6,0.05),transparent_24%)]"
      />
      <Nav />
      <section id="system">
        <Hero />
      </section>
      <BentoSection />
      <MarqueeSection />
      <PinnedSection />
      <Footer />
    </main>
  );
}
