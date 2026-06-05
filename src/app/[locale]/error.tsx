'use client';

import { useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Tentar reportar erro ao backend (silencioso)
    try {
      fetch('/api/telemetry/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: error.message, 
          stack: error.stack, 
          digest: error.digest,
          url: window.location.pathname,
        }),
      }).catch(() => {});
    } catch {}
  }, [error]);
  
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 mb-4">
          <AlertTriangle className="h-8 w-8 text-rose-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Algo correu mal</h1>
        <p className="text-sm text-slate-500 mt-2">
          Pedimos desculpa. Tenta novamente ou volta à página inicial.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-slate-400 mt-3">ID: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 mt-6 justify-center">
          <button onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm">
            <RefreshCw className="h-4 w-4" /> Tentar de novo
          </button>
          <Link href={`/` as any}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm">
            <Home className="h-4 w-4" /> Início
          </Link>
        </div>
      </div>
    </div>
  );
}
