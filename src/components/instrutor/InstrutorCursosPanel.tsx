'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Loader2, BookOpen } from 'lucide-react';
import { EmptyState } from '@/components/primitives/EmptyState';

interface C { id: string; title: string; emoji: string | null; published: boolean; archived: boolean; enrollments_count: number | null; rating_avg: number | null }

/** Aba Cursos do workspace do instrutor: cursos deste instrutor, ligam ao workspace do curso. */
export function InstrutorCursosPanel({ instructorId }: { instructorId: string }) {
  const t = useTranslations();
  const [items, setItems] = useState<C[] | null>(null);

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data } = await sb.from('nl_courses').select('id,title,emoji,published,archived,enrollments_count,rating_avg').eq('instructor_id', instructorId).order('created_at', { ascending: false });
      setItems((data as C[]) || []);
    } catch { setItems([]); }
  }, [instructorId]);
  useEffect(() => { load(); }, [load]);

  if (items === null) return <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (items.length === 0) return <div className="rounded-2xl border border-slate-200 bg-white"><EmptyState icon={BookOpen} title={t('instr_ws.courses.empty_title')} hint={t('instr_ws.courses.empty_hint')} /></div>;

  return (
    <div className="space-y-2">
      {items.map((c) => (
        <Link key={c.id} href={`/admin/curso/${c.id}/editar` as any} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">{c.emoji || '📘'}</span>
            <div className="min-w-0">
              <div className="font-medium text-slate-900 truncate">{c.title}</div>
              <div className="text-xs text-slate-500">{t('instr_ws.courses.enrollments', { n: c.enrollments_count || 0 })}{c.archived ? ' · ' + t('instr_ws.courses.archived') : c.published ? ' · ' + t('instr_ws.courses.published') : ' · ' + t('instr_ws.courses.draft')}</div>
            </div>
          </div>
          {c.rating_avg ? <span className="text-sm text-amber-600 flex-shrink-0 ml-3">★ {Number(c.rating_avg).toFixed(1)}</span> : null}
        </Link>
      ))}
    </div>
  );
}
