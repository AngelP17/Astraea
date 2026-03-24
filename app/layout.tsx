import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Astraea | Deterministic Decision Infrastructure',
  description:
    'Astraea is a deterministic decision engine for event-driven systems with explainability, replay, and auditability built into the core.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-white antialiased font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}