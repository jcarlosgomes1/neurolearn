'use client';

import { useEffect, useState } from 'react';
import { Eye, X } from 'lucide-react';

const LABELS: Record<string, string> = { aluno: 'aluno', instrutor: 'instrutor' };

/**
 * Banner fixo mostrado quando o cookie nl_peek esta activo. A leitura aqui e
 * apenas cosmetica; o gate de seguranca real e server-side (getPeekMode).
 */
export function PeekBanner() {
  const [as, setAs] = useState<string | null>(null);

  useEffect(() => {
    const m = typeof document !== 'undefined'
      ? document.cookie.match(/(?:^|;\s*)nl_peek=([^;]+)/)
      : null;
    setAs(m ? decodeURIComponent(m[1]) : null);
  }, []);

  if (as !== 'aluno' && as !== 'instrutor') return null;

  return (
    <div className="sticky top-0 z-[60] flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-medium text-white shadow-md">
      <Eye className="h-4 w-4 shrink-0" />
      <span>Modo espreitar — a ver como {LABELS[as]}. So leitura.</span>
      <a
        href="/api/peek/stop"
        className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 transition-colors hover:bg-white/30"
      >
        <X className="h-3.5 w-3.5" /> Sair
      </a>
    </div>
  );
}
