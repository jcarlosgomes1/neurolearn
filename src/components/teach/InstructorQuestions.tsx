'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { relTime } from '@/lib/utils/cn';
import { HelpCircle, ArrowRight } from 'lucide-react';

type Q = { id: string; course_id: string; course_title: string; q_title: string | null; body: string | null; upvotes: number; created_at: string; module_index: number | null; lesson_index: number | null };

export function InstructorQuestions() {
  const t = useTranslations();
  const [items, setItems] = useState<Q[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data } = await sb.rpc('nl_instructor_unanswered_questions', { p_limit: 8 });
        setItems((data as Q[]) || []);
      } catch { setItems([]); }
    })();
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-violet-600" />
          {t('teach.unanswered_title')}
        </h2>
        <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <ul className="space-y-2">
        {items.map((q) => (
          <li key={q.id}>
            <Link href={`/curso/${q.course_id}` as any}
              className="group flex items-start justify-between gap-3 p-3 rounded-lg border border-slate-100 hover:bg-violet-50 hover:border-violet-200 transition-colors">
              <div className="min-w-0">
                <div className="font-medium text-slate-900 truncate">{q.q_title || (q.body || '').slice(0, 80)}</div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">{q.course_title} · {relTime(q.created_at)}</div>
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-violet-600 flex-shrink-0 mt-0.5 whitespace-nowrap">
                {t('teach.unanswered_answer')} <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
