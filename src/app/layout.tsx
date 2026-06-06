import '@/app/globals.css';
import type { Metadata } from 'next';

// Root layout MUST be minimal — no params, no async work.
// The real locale-aware layout is in src/app/[locale]/layout.tsx.

export const metadata: Metadata = {
  metadataBase: new URL('https://neurolearn-rosy.vercel.app'),
  title: {
    default: 'NeuroLearn',
    template: '%s · NeuroLearn',
  },
  openGraph: {
    type: 'website',
    siteName: 'NeuroLearn',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
