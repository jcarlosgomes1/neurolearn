'use client';

import { useEffect } from 'react';
import { logClientErrorAction } from './admin/erros/actions';

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      logClientErrorAction({
        message: error.message || 'unknown',
        stack: error.stack || null,
        digest: error.digest || null,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        kind: 'react_error_boundary_locale',
      }).catch(() => {});
    } catch {}
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="text-5xl mb-3">⚠️</div>
        <h1 className="text-xl font-bold text-slate-900">Algo correu mal</h1>
        <p className="text-sm text-slate-500 mt-2">O erro foi registado automaticamente. Tenta de novo ou volta ao início.</p>
        {error.digest && <code className="block text-xs text-slate-400 mt-3">ref: {error.digest}</code>}
        <div className="mt-6 flex gap-2 justify-center flex-wrap">
          <button onClick={() => reset()} className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">
            Tentar novamente
          </button>
          <a href="/" className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium">
            Início
          </a>
        </div>
      </div>
    </div>
  );
}
