'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';

interface Reco {
  course_id: string; kind: string; score: number; reason_key?: string;
  title: string; subtitle?: string; emoji?: string; color?: string;
  price_cents: number; level?: string; category?: string; rating_avg?: number;
}

function fmtPrice(cents: number) {
  if (!cents || cents <= 0) return null;
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function RecommendedForYou() {
  const t = useTranslations();
  const [recos, setRecos] = useState<Reco[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data } = await sb.rpc('nl_my_recommendations', { p_limit: 4 });
        if (data?.ok) setRecos(data.recommendations || []);
      } catch { /* */ } finally { setLoaded(true); }
    })();
  }, []);

  function safeT(key: string | undefined, fb: string): string {
    if (!key) return fb;
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  async function track(courseId: string, kind: string) {
    try {
      const sb = createClient();
      await sb.rpc('nl_recommendation_event', { p_course_id: courseId, p_kind: kind, p_event: 'click' });
    } catch { /* */ }
  }

  if (!loaded || recos.length === 0) return null;

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">✨</span>
        <h2 className="font-semibold text-slate-900">{safeT('reco.section_title', 'Recomendado para ti')}</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {recos.map((r) => {
          const price = fmtPrice(r.price_cents);
          return (
            <Link key={`${r.course_id}_${r.kind}`} href={`/curso/${r.course_id}` as any} onClick={() => track(r.course_id, r.kind)}
              className="group flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 transition-all active:scale-[0.99] overflow-hidden">
              <span className="text-3xl flex-shrink-0">{r.emoji || '📚'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-slate-900 truncate min-w-0">{r.title}</span>
                  {r.kind === 'upsell' && <span className="flex-shrink-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{safeT('reco.badge_upsell', 'Avançar')}</span>}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{safeT(r.reason_key, r.kind === 'upsell' ? 'O próximo passo na tua jornada' : 'Continua a aprender')}</p>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                  {r.rating_avg ? <span className="text-amber-600 flex-shrink-0">★ {Number(r.rating_avg).toFixed(1)}</span> : null}
                  {price ? <span className="font-semibold text-slate-700 flex-shrink-0">{price}</span> : <span className="text-emerald-600 font-semibold flex-shrink-0">{safeT('reco.free', 'Grátis')}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
