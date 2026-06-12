'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Sparkles, User2, Clock } from 'lucide-react';

export function EvaluationsClient({ items }: { items: any[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [edits, setEdits] = useState<Record<string, { score?: number; feedback?: string }>>({});

  async function decide(id: string, decision: 'validated' | 'rejected') {
    setBusy(true);
    try {
      const sb = createClient();
      const e = edits[id] || {};
      assertNotPeekClient();
      const { error } = await sb.rpc('nl_quiz_attempt_validate', {
        p_id: id, p_decision: decision,
        p_human_score: e.score ?? null,
        p_human_feedback_md: e.feedback || null,
      });
      if (error) throw error;
      toast.success(decision === 'validated' ? t('tea.eval_validated') : t('tea.eval_rejected'));
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || t('tea.error'));
    } finally { setBusy(false); }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white items-center justify-center shadow-md mb-3">
          <CheckCircle className="h-7 w-7" />
        </div>
        <h2 className="font-bold text-slate-900 text-lg">{t('tea.eval_empty_h')}</h2>
        <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">{t('tea.eval_empty_p')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((it) => (
        <article key={it.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
          <header className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs">
              <User2 className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium text-slate-700">{it.student_name || it.student_email}</span>
              <span className="text-slate-400">·</span>
              <span className="font-mono text-slate-500">{it.course_id}</span>
              <span className="text-slate-400">·</span>
              <span className="uppercase tracking-wider text-[10px] font-bold text-slate-500">{it.quiz_kind}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Clock className="h-3 w-3" /> {new Date(it.created_at).toLocaleString(locale)}
            </div>
          </header>
          <div className="p-5 space-y-4">
            {it.question && (
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{t('tea.eval_question')}</div>
                <p className="text-sm text-slate-800 leading-relaxed">{it.question}</p>
              </div>
            )}
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{t('tea.eval_answer')}</div>
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-200">{it.answer_md}</div>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-violet-700 mb-2">
                <Sparkles className="h-3 w-3" /> {t('tea.eval_auto')} · {it.ai_score != null ? `${Math.round(Number(it.ai_score))}/100` : '—'}
              </div>
              {it.ai_feedback_md && (
                <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{it.ai_feedback_md}</div>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 block">{t('tea.eval_score_label')}</label>
                <input
                  type="number" min="0" max="100" step="1"
                  value={edits[it.id]?.score ?? ''}
                  onChange={(e) => setEdits((p) => ({ ...p, [it.id]: { ...p[it.id], score: e.target.value === '' ? undefined : Number(e.target.value) } }))}
                  placeholder={it.ai_score != null ? t('tea.eval_suggested', { n: Math.round(Number(it.ai_score)) }) : t('tea.eval_score_ph')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 outline-none" />
              </div>
              <div className="text-[11px] text-slate-500 self-end pb-2">
                {t('tea.eval_blank_hint')}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 block">{t('tea.eval_feedback_label')}</label>
              <textarea
                value={edits[it.id]?.feedback ?? ''}
                onChange={(e) => setEdits((p) => ({ ...p, [it.id]: { ...p[it.id], feedback: e.target.value } }))}
                rows={3}
                placeholder={t('tea.eval_feedback_ph')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 outline-none resize-y" />
            </div>
          </div>
          <footer className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2">
            <button
              onClick={() => decide(it.id, 'rejected')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 rounded-lg disabled:opacity-50">
              <XCircle className="h-4 w-4" /> {t('tea.eval_reject_btn')}
            </button>
            <button
              onClick={() => decide(it.id, 'validated')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50">
              <CheckCircle className="h-4 w-4" /> {t('tea.eval_validate_btn')}
            </button>
          </footer>
        </article>
      ))}
    </div>
  );
}
