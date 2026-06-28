'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useTranslations } from 'next-intl';
import { Layers, Library, HelpCircle, Route, FileText, Video, Sparkles, ArrowRight } from 'lucide-react';

interface CourseRich {
  id: string; title: string; published: boolean; lessons_total: number;
  flashcards: number; glossary: number; faq: number; timeline: number; sources: number; videos: number;
}

function Stat({ icon: Icon, n, color }: { icon: React.ElementType; n: number; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${n > 0 ? color : 'text-slate-300'}`}>
      <Icon className="h-3.5 w-3.5" />{n}
    </span>
  );
}

export function EstudioHub() {
  const t = useTranslations();
  const [courses, setCourses] = useState<CourseRich[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = createClient();
    const { data, error } = await sb.rpc('nl_studio_courses_rich');
    if (error) { setErr(error.message); return; }
    const r = data as { ok?: boolean; error?: string; courses?: CourseRich[] };
    if (!r?.ok) { setErr(r?.error || 'error'); return; }
    setCourses(r.courses || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader emoji="🎬" title={t('studio.hub_title')} description={t('studio.hub_desc')} />

      {err && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {err === 'forbidden' ? 'Sem acesso. Área exclusiva de administradores.' : 'Não foi possível carregar.'}
        </div>
      )}

      {!courses && !err && <div className="text-sm text-slate-400 py-12 text-center">{t('candlist.loading')}</div>}

      {courses && (
        <div className="grid sm:grid-cols-2 gap-4">
          {courses.map((c) => {
            const cardsPct = c.lessons_total > 0 ? Math.round(((c.flashcards > 0 ? 1 : 0)) * 100) : 0;
            return (
              <a key={c.id} href={`/pt/admin/estudio/${c.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 leading-tight truncate">{c.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{c.lessons_total} {t('studio.lessons')}{c.published ? '' : ' · rascunho'}</p>
                  </div>
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:scale-105 transition-transform">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-3 border-t border-slate-100">
                  <Stat icon={Layers} n={c.flashcards} color="text-violet-600" />
                  <Stat icon={Library} n={c.glossary} color="text-emerald-600" />
                  <Stat icon={HelpCircle} n={c.faq} color="text-amber-600" />
                  <Stat icon={Route} n={c.timeline} color="text-blue-600" />
                  <Stat icon={FileText} n={c.sources} color="text-slate-600" />
                  <Stat icon={Video} n={c.videos} color="text-rose-600" />
                  <span className="ml-auto text-xs font-semibold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                    {t('studio.open')} <Sparkles className="h-3.5 w-3.5" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
