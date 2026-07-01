'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function TopLoader() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }

  function start() {
    clearTimers();
    setVisible(true);
    setProgress(8);
    [18, 32, 47, 61, 74, 86].forEach((p, i) => {
      timers.current.push(setTimeout(() => setProgress(p), 130 * (i + 1)));
    });
  }

  // Inicia ao clicar num link interno (navegacao cliente).
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || a.target === '_blank' || a.hasAttribute('download')) return;
      try {
        const url = new URL(a.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      } catch {
        return;
      }
      start();
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Conclui quando a rota muda.
  useEffect(() => {
    clearTimers();
    if (!visible) return;
    setProgress(100);
    const t1 = setTimeout(() => setVisible(false), 280);
    const t2 = setTimeout(() => setProgress(0), 560);
    timers.current.push(t1, t2);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5">
      <div
        className="h-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-500"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transition: 'width 0.2s ease-out, opacity 0.3s ease',
          boxShadow: '0 0 8px rgba(217,119,87,0.55), 0 0 4px rgba(217,119,87,0.45)',
        }}
      />
    </div>
  );
}
