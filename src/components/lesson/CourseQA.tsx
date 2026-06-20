'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, CornerDownLeft, BookOpen } from 'lucide-react';

interface Citation { tag: string; title: string }

export function CourseQA({ courseId }: { courseId: string }) {
  const t = useTranslations('qa');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [err, setErr] = useState(false);

  async function ask() {
    const question = q.trim();
    if (!question || loading) return;
    setLoading(true); setErr(false); setAnswer(null); setCitations([]);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_course_qa', { p_course_id: courseId, p_question: question });
      if (error) throw error;
      const r = data as { ok?: boolean; answer?: string; citations?: Citation[] };
      if (!r?.ok) throw new Error('failed');
      setAnswer(r.answer || '');
      setCitations(Array.isArray(r.citations) ? r.citations.filter((c) => c.title) : []);
    } catch { setErr(true); } finally { setLoading(false); }
  }

  return (
    <section className="rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
      <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-brand-500" /> {t('title')}
      </h2>
      <p className="text-xs text-slate-500 mb-3">{t('hint')}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') ask(); }}
          placeholder={t('placeholder')} className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm" />
        <button onClick={ask} disabled={loading || !q.trim()}
          className="rounded-xl bg-brand-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 inline-flex items-center justify-center gap-1.5 shrink-0">
          {loading ? <Sparkles className="h-4 w-4 animate-pulse" /> : <CornerDownLeft className="h-4 w-4" />}
          {loading ? t('thinking') : t('ask')}
        </button>
      </div>
      {err && <p className="text-sm text-rose-600 mt-3">{t('error')}</p>}
      {answer && (
        <div className="mt-4 rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{answer}</p>
          {citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5 flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {t('sources')}</p>
              <ul className="flex flex-wrap gap-1.5">
                {citations.map((c, i) => (
                  <li key={i} className="text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">{c.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
