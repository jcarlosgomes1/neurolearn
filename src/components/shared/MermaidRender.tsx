'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

export function MermaidRender({ code, className = '' }: { code: string; className?: string }) {
  const t = useTranslations('mer');
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const codeStr = typeof code === 'string' ? code : (((code as any) && (code as any).content) ? String((code as any).content) : '');

  useEffect(() => {
    let cancelled = false;
    setErr(null);
    setRendered(false);
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          fontFamily: 'inherit',
          themeVariables: {
            primaryColor: '#dbe5ff',
            primaryTextColor: '#0f172a',
            primaryBorderColor: '#4753f0',
            lineColor: '#94a3b8',
            secondaryColor: '#f1f5f9',
            tertiaryColor: '#f8fafc',
          },
          flowchart: { curve: 'basis', padding: 16 },
          securityLevel: 'strict',
        });
        const id = 'mermaid-' + Math.random().toString(36).slice(2, 10);
        const { svg } = await mermaid.render(id, codeStr);
        if (cancelled) return;
        if (ref.current) {
          ref.current.innerHTML = svg;
          setRendered(true);
        }
      } catch (e: any) {
        if (cancelled) return;
        console.error('Mermaid render failed:', e);
        setErr(e?.message || t('err_render'));
      }
    })();
    return () => { cancelled = true; };
  }, [codeStr, t]);

  if (err) {
    return (
      <div className={`bg-slate-50 border border-slate-200 rounded-lg p-4 ${className}`}>
        <p className="text-xs text-slate-500 mb-2">{t('err_explain')}</p>
        <pre className="text-xs bg-white p-3 rounded border border-slate-100 overflow-x-auto"><code>{codeStr}</code></pre>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 sm:p-6 flex justify-center ${className}`} style={{ minHeight: rendered ? undefined : '200px' }}>
      <div ref={ref} className="mermaid-render max-w-full overflow-x-auto" />
      {!rendered && !err && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="inline-block w-4 h-4 border-2 border-slate-200 border-t-brand-500 rounded-full animate-spin" />
          {t('preparing')}
        </div>
      )}
    </div>
  );
}
