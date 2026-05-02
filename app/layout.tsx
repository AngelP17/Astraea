import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'Astraea | Deterministic Decision Infrastructure',
  description:
    'Astraea is a deterministic decision engine for event-driven systems with explainability, replay, and auditability built into the core.',
  icons: {
    icon: '/favicon/icon.svg',
    shortcut: '/favicon/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`bg-background text-white antialiased ${GeistSans.variable} ${GeistMono.variable} font-body`}>
        {children}
      </body>
    </html>
  );
}
