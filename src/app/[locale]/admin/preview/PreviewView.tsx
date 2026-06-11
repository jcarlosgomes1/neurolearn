'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';

interface Course { id: string; title: string; instructor_id: string | null; is_published: boolean | null; created_at: string }

export function PreviewView() {
  const t = useTranslations('prev');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    async function load() {
      const sb = createClient();
      const { data } = await sb.from('nl_courses').select('id, title, instructor_id, is_published, created_at').order('created_at', { ascending: false }).limit(100);
      setCourses((data as Course[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = courses.filter(c => filter === 'all' ? true : filter === 'published' ? c.is_published : !c.is_published);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader backHref="/admin" emoji="👁️" title={t('title')} description={t('subtitle')} />

      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
        {t('warning')}
      </div>

      <div className="mt-6 flex gap-2 flex-wrap">
        {(['all', 'published', 'draft'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs font-medium px-3 py-1.5 rounded-md ${filter === f ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'}`}>
            {f === 'all' ? t('f.all') : f === 'published' ? t('f.pub') : t('f.draft')} {f === 'all' ? courses.length : f === 'published' ? courses.filter(c => c.is_published).length : courses.filter(c => !c.is_published).length}
          </button>
        ))}
      </div>

      <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-slate-400">{t('loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">{t('empty')}</div>
        ) : filtered.map(c => (
          <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900 truncate">{c.title}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${c.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {c.is_published ? t('st.pub') : t('st.draft')}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">{c.id}</div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href={`/cursos/${c.id}` as any} target="_blank" className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium px-3 py-2 rounded-md whitespace-nowrap">
                {t('as_public')}
              </Link>
              <Link href={`/learn/curso/${c.id}` as any} target="_blank" className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 font-medium px-3 py-2 rounded-md whitespace-nowrap">
                {t('as_enrolled')}
              </Link>
              <Link href={`/teach/curso/${c.id}/editar` as any} target="_blank" className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium px-3 py-2 rounded-md whitespace-nowrap">
                {t('as_instr')}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-900 mb-3">{t('explainer')}</h2>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex gap-3"><span className="text-lg flex-shrink-0">👀</span><div><strong>{t('e1.title')}</strong>: {t('e1.desc')}</div></li>
          <li className="flex gap-3"><span className="text-lg flex-shrink-0">📚</span><div><strong>{t('e2.title')}</strong>: {t('e2.desc')}</div></li>
          <li className="flex gap-3"><span className="text-lg flex-shrink-0">✏</span><div><strong>{t('e3.title')}</strong>: {t('e3.desc')}</div></li>
        </ul>
      </div>
    </div>
  );
}
