'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from '@/i18n/routing';

export function GlobalErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App error:', error);
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
        // silenciar — não bloqueia UI
      }
    })();
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 relative overflow-hidden">
      {/* decorativo: blob de cor subtil */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-br from-[var(--accent-tint)] to-[var(--saffron-soft)] rounded-full blur-3xl opacity-40" />
      </div>

      <div className="max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-rose-500 to-rose-600 text-white mb-5 shadow-xl shadow-rose-200">
          <AlertTriangle className="h-10 w-10" strokeWidth={2.2} />
        </div>

        <h1 className="text-3xl font-bold text-[var(--ink)] mb-2 tracking-tight">Algo correu mal</h1>
        <p className="text-sm text-[var(--ink-2)] mb-2 max-w-sm mx-auto leading-relaxed">
          Encontrámos um problema ao carregar esta página. Já registámos o erro automaticamente para investigarmos.
        </p>

        {error.digest && (
          <p className="text-[11px] text-[var(--ink-3)] font-mono mb-5 inline-block bg-[var(--paper)] border border-[var(--line)] rounded px-2 py-1">
            Ref: {error.digest}
          </p>
        )}

        <div className="flex flex-wrap gap-2 justify-center mt-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[var(--ink)] hover:opacity-90 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
            <RefreshCw className="h-4 w-4" /> Tentar de novo
          </button>
          <Link
            href={'/' as any}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[var(--card)] border border-[var(--line)] hover:bg-[var(--paper)] active:scale-[0.98] text-[var(--ink-2)] text-sm font-semibold rounded-xl transition-all">
            <Home className="h-4 w-4" /> Voltar à home
          </Link>
        </div>
      </div>
    </div>
  );
}
