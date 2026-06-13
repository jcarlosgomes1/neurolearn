'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Sparkles, ArrowRight } from 'lucide-react';

type Reco = { course_id: string; title: string; subtitle: string | null; cover_url: string | null; emoji: string | null; level: string | null; similarity: number; score: number };

export function RecommendationsPanel() {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);
  const [recos, setRecos] = useState<Reco[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.rpc('nl_reco_courses_for_me');
        const d = data as { ok?: boolean; personalized?: boolean; recommendations?: Reco[] };
        if (d?.ok && d.personalized && Array.isArray(d.recommendations)) setRecos(d.recommendations);
      } catch { /* noop */ }
      finally { setLoading(false); }
    })();
  }, [supabase]);

  if (loading || recos.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-violet-600" />
        <h2 className="text-lg font-bold text-slate-900">{t('reco.ui.title')}</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">{t('reco.ui.subtitle')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {recos.map((r) => (
          <Link key={r.course_id} href={`/curso/${r.course_id}` as any}
            className="group bg-white rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-lg transition-all duration-300 overflow-hidden hover:-translate-y-1">
            <div className="h-24 bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-4xl relative">
              {r.cover_url ? <img src={r.cover_url} alt="" className="w-full h-full object-cover" /> : <span>{r.emoji || '📚'}</span>}
              <span className="absolute top-2 right-2 text-[10px] font-bold bg-white/90 text-violet-700 px-2 py-0.5 rounded-full">
                {Math.round(r.similarity * 100)}% {t('reco.ui.match')}
              </span>
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 group-hover:text-violet-700">{r.title}</h3>
              {r.subtitle && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{r.subtitle}</p>}
              <div className="flex items-center gap-1 text-xs text-violet-600 font-medium mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {t('reco.ui.explore')} <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
