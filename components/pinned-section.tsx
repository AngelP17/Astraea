'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger);

const galleryItems = [
  { title: 'Event Ingestion', desc: 'Raw telemetry is locked to a deterministic schema.', img: 'https://picsum.photos/seed/ingest/800/600' },
  { title: 'Feature Extraction', desc: 'Threshold deltas and ratios become interpretable signals.', img: 'https://picsum.photos/seed/features/800/600' },
  { title: 'Anomaly Scoring', desc: 'Confidence and uncertainty are exposed as first-class outputs.', img: 'https://picsum.photos/seed/anomaly/800/600' },
  { title: 'Decision Dispatch', desc: 'Recommendations become concrete action bundles.', img: 'https://picsum.photos/seed/decision/800/600' },
];

export function PinnedSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current || !titleRef.current || !galleryRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        pin: titleRef.current,
        pinSpacing: false,
      });

      const items = galleryRef.current!.querySelectorAll('.gallery-item');
      items.forEach((item) => {
        gsap.fromTo(
          item,
          { scale: 0.85, opacity: 0.3, filter: 'brightness(0.4)' },
          {
            scale: 1,
            opacity: 1,
            filter: 'brightness(1)',
            scrollTrigger: {
              trigger: item,
              start: 'top 80%',
              end: 'top 40%',
              scrub: true,
            },
          }
        );
        gsap.to(item, {
          scale: 0.9,
          opacity: 0.2,
          filter: 'brightness(0.3)',
          scrollTrigger: {
            trigger: item,
            start: 'bottom 60%',
            end: 'bottom 20%',
            scrub: true,
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative min-h-[200dvh]">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div ref={titleRef} className="flex flex-col justify-center pt-32 lg:pt-0 lg:h-screen">
            <h2 className="font-display text-display-lg font-extrabold tracking-[-0.02em] text-white">
              Trace every decision from signal to action
            </h2>
            <p className="mt-5 max-w-md text-body-lg text-text-muted">
              Scroll through the pipeline stages. Each node exposes input, output, hash fragment, and rationale.
            </p>
          </div>

          <div ref={galleryRef} className="space-y-24 pb-32 pt-32 lg:pt-[50dvh]">
            {galleryItems.map((item) => (
              <div key={item.title} className="gallery-item group relative overflow-hidden rounded-2xl border border-white/6">
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="h-full w-full object-cover grayscale-[30%] contrast-125 transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                  <h3 className="font-display text-xl font-bold uppercase tracking-tight text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
