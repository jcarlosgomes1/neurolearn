'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Link } from '@/i18n/routing';

export function GlobalErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Logar para servidor (Supabase rpc returns PromiseLike, use IIFE try/catch)
    (async () => {
      try {
        const sb = createClient();
        await sb.rpc('nl_log_app_error', {
          p_data: {
            message: error.message,
            stack: error.stack,
            url: typeof window !== 'undefined' ? window.location.href : '',
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            source: 'client',
            level: 'error',
            metadata: { digest: error.digest },
          },
        });
      } catch {
        // silent — não queremos que o error reporter ele próprio quebre a UI
      }
    })();

    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-rose-100 text-rose-600 mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Algo correu mal</h1>
        <p className="text-sm text-slate-600 mb-1">Já registámos o erro e a nossa equipa foi notificada.</p>
        {error.digest && <p className="text-xs text-slate-400 font-mono mb-4">Ref: {error.digest}</p>}
        <div className="flex flex-wrap gap-2 justify-center">
          <button onClick={reset} className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg">
            <RefreshCw className="h-4 w-4" /> Tentar de novo
          </button>
          <Link href={'/' as any} className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">
            Voltar à home
          </Link>
        </div>
      </div>
    </div>
  );
}
