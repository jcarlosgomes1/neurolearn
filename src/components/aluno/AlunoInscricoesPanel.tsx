'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Loader2, BookOpen, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { EmptyState } from '@/components/primitives/EmptyState';

interface E { course_id: string; emoji: string | null; title: string | null; progress_pct: number | null; completed_at: string | null }

/** Aba Inscrições do workspace do aluno: cursos em que está inscrito, ligam ao workspace do curso. Reutiliza nl_admin_user_detail. */
export function AlunoInscricoesPanel({ userId }: { userId: string }) {
  const t = useTranslations();
  const [items, setItems] = useState<E[] | null>(null);

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_admin_user_detail', { p_user_id: userId });
      const d = data as { enrollments?: E[] } | null;
      setItems(d?.enrollments || []);
    } catch { setItems([]); }
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  if (items === null) return <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (items.length === 0) return <div className="rounded-2xl border border-slate-200 bg-white"><EmptyState icon={BookOpen} title={t('alun_ws.enroll.empty_title')} hint={t('alun_ws.enroll.empty_hint')} /></div>;

  return (
    <div className="space-y-2">
      {items.map((e) => (
        <div key={e.course_id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white">
          <span className="text-xl flex-shrink-0">{e.emoji || '📘'}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">{e.title || e.course_id}</div>
            <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full" style={{ width: `${Math.min(100, e.progress_pct || 0)}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {e.completed_at ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <span className="text-xs text-slate-500 w-10 text-right">{Math.min(100, e.progress_pct || 0)}%</span>}
            <Link href={`/admin/curso/${e.course_id}/editar` as any} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1">{t('alun_ws.enroll.open')}<ArrowUpRight className="h-3 w-3" /></Link>
          </div>
        </div>
      ))}
    </div>
  );
}
