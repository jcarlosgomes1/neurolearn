'use client';

import { useEffect, useRef, useState } from 'react';

// Revelação ao scroll. O estado escondido/transição vive em CSS (.nl-reveal),
// injetado pelo layout consoante a direção de design ativa (data-motion).
// Quando o movimento está desligado, o CSS força visível e nós nem observamos.
export function Reveal({
  children, delay = 0, className,
}: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const motionOff = typeof document !== 'undefined' && document.documentElement.dataset.motion === 'off';
    const reduce = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (motionOff || reduce) { setShown(true); return; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { setShown(true); io.disconnect(); break; }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`nl-reveal${className ? ' ' + className : ''}`}
      data-shown={shown ? 'true' : 'false'}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
