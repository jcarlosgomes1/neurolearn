'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Info, X, Compass, Layers, Target } from 'lucide-react';

type Tip = {
  route: string; lang: string; title: string | null;
  what_it_does: string | null; strategy_fit: string | null;
  architecture_note: string | null; updated_at: string | null;
};

const LOCALES = ['pt', 'en', 'es', 'fr'];

function candidates(path: string): string[] {
  const parts = path.split('/').filter(Boolean);
  if (parts[0] && LOCALES.includes(parts[0])) parts.shift();
  const norm = parts.map((seg) =>
    (/^\d+$/.test(seg) || /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(seg)) ? '[id]' : seg
  );
  const out: string[] = ['/' + norm.join('/')];
  if (norm[norm.length - 1] === '[id]') out.push('/' + norm.slice(0, -1).join('/'));
  if (norm.length > 2) out.push('/' + norm.slice(0, 2).join('/'));
  return Array.from(new Set(out));
}

export function PageTips() {
  const pathname = usePathname();
  const [tip, setTip] = useState<Tip | null>(null);
  const [open, setOpen] = useState(false);

  const lang = (pathname.split('/').filter(Boolean)[0] || 'pt');

  const fetchTip = useCallback(async () => {
    setTip(null); setOpen(false);
    try {
      const sb = createClient();
      for (const route of candidates(pathname)) {
        const { data } = await sb.rpc('nl_admin_page_tip', { p_route: route, p_lang: LOCALES.includes(lang) ? lang : 'pt' });
        if (data) { setTip(data as Tip); return; }
      }
    } catch { /* noop */ }
  }, [pathname, lang]);

  useEffect(() => { fetchTip(); }, [fetchTip]);

  if (!tip) return null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Sobre esta página"
        className="fixed z-40 bottom-20 sm:bottom-6 right-4 sm:right-6 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 backdrop-blur border border-slate-200 shadow-lg text-slate-600 hover:text-violet-700 hover:border-violet-300 transition-all text-xs font-medium"
      >
        <Info className="h-4 w-4" /> <span className="hidden sm:inline">Sobre esta página</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-right-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 mb-0.5">Sobre esta página</div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{tip.title || 'Esta página'}</h3>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 -mr-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {tip.what_it_does && (
                <Section icon={Compass} color="text-blue-600 bg-blue-50" label="O que é">
                  {tip.what_it_does}
                </Section>
              )}
              {tip.strategy_fit && (
                <Section icon={Target} color="text-emerald-600 bg-emerald-50" label="Como serve a estratégia">
                  {tip.strategy_fit}
                </Section>
              )}
              {tip.architecture_note && (
                <Section icon={Layers} color="text-fuchsia-600 bg-fuchsia-50" label="Arquitetura">
                  {tip.architecture_note}
                </Section>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ icon: Icon, color, label, children }: { icon: any; color: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{label}</div>
        <p className="text-sm text-slate-700 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
