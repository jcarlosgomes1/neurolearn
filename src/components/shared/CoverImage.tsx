'use client';

import { useState } from 'react';

interface Props {
  src: string | null | undefined;
  alt: string;
  seed: string;
  category?: string | null;
  emoji?: string;
  className?: string;
  aspectRatio?: string;
  priority?: boolean;
}

const PALETTES = [
  { from: '#4753f0', to: '#8b5cf6' },
  { from: '#0ea5e9', to: '#4753f0' },
  { from: '#8b5cf6', to: '#ec4899' },
  { from: '#10b981', to: '#0ea5e9' },
  { from: '#f59e0b', to: '#ef4444' },
  { from: '#3b82f6', to: '#06b6d4' },
];

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function SVGFallback({ seed, category, emoji, alt, className, aspectRatio = '16/9' }: { seed: string; category?: string | null; emoji?: string; alt: string; className?: string; aspectRatio?: string }) {
  const palette = PALETTES[hashSeed(seed) % PALETTES.length];
  return (
    <div className={`relative w-full overflow-hidden ${className || ''}`} style={{ aspectRatio }}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)` }} aria-label={alt}>
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id={`dots-${seed}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="1600" height="900" fill={`url(#dots-${seed})`} />
          <circle cx="1300" cy="200" r="180" fill="white" fillOpacity="0.1" />
          <circle cx="200" cy="700" r="240" fill="white" fillOpacity="0.08" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
          <span className="text-7xl mb-3 drop-shadow-lg">{emoji || '📖'}</span>
          {category && <span className="text-xs uppercase tracking-widest font-semibold opacity-90 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">{category}</span>}
        </div>
      </div>
    </div>
  );
}

export function CoverImage({ src, alt, seed, category, emoji, className, aspectRatio = '16/9', priority }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <SVGFallback seed={seed} category={category} emoji={emoji} alt={alt} className={className} aspectRatio={aspectRatio} />;
  }

  return (
    <div className={`relative w-full overflow-hidden bg-slate-100 ${className || ''}`} style={{ aspectRatio }}>
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
