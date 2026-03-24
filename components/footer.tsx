export function Footer() {
  return (
    <footer className="bg-black px-6 py-10 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-white/5 pt-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-headline text-xl font-black tracking-tight text-primary">ASTRAEA</div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
            EVENT PROCESSED → DECISION DELIVERED
          </div>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500">
          Deterministic decision infrastructure for event-driven systems
        </div>
      </div>
    </footer>
  );
}