'use client';

import { useEffect } from 'react';
import { logClientErrorAction } from './[locale]/admin/erros/actions';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Fire-and-forget — não bloqueia render do error page
    try {
      logClientErrorAction({
        message: error.message || 'unknown',
        stack: error.stack || null,
        digest: error.digest || null,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        kind: 'react_error_boundary_root',
      }).catch(() => {});
    } catch {}
  }, [error]);

  return (
    <html lang="pt">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
          <div style={{ maxWidth: 480, textAlign: 'center', background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Algo correu mal</h1>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 8 }}>O erro foi registado automaticamente. Pode tentar novamente.</p>
            {error.digest && <code style={{ display: 'inline-block', fontSize: 11, color: '#94a3b8', marginTop: 12 }}>ref: {error.digest}</code>}
            <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => reset()} style={{ padding: '8px 16px', borderRadius: 8, background: '#4f46e5', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Tentar novamente
              </button>
              <a href="/" style={{ padding: '8px 16px', borderRadius: 8, background: '#f1f5f9', color: '#475569', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
                Voltar ao início
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
