'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Star, Loader2, MessageSquarePlus, CheckCircle2 } from 'lucide-react';

type Question = { id: string; i18n_key: string; qtype: 'rating' | 'nps' | 'text'; sort_order: number };

export function CourseFeedbackPanel({ courseId, courseTitle }: { courseId: string; courseTitle?: string }) {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, { rating?: number; nps?: number; comment?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.rpc('nl_feedback_questions_for', { p_scope: 'course' });
        if (Array.isArray(data)) setQuestions(data as Question[]);
      } catch { /* noop */ }
      finally { setLoading(false); }
    })();
  }, [supabase]);

  async function submit() {
    setSubmitting(true);
    try {
      for (const q of questions) {
        const a = answers[q.id];
        if (!a) continue;
        await supabase.rpc('nl_course_feedback_submit', {
          p_course_id: courseId, p_question_id: q.id,
          p_rating: a.rating ?? null, p_nps: a.nps ?? null, p_comment: a.comment ?? null,
        });
      }
      setDone(true);
      toast.success(t('feedback.thanks'));
    } catch { toast.error(t('feedback.error')); }
    finally { setSubmitting(false); }
  }

  if (loading || questions.length === 0) return null;

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        <span className="text-sm font-medium text-emerald-800">{t('feedback.thanks')}</span>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50/50 text-brand-700 text-sm font-medium hover:bg-brand-50 transition">
        <MessageSquarePlus className="h-4 w-4" /> {t('feedback.title')}{courseTitle ? ` · ${courseTitle}` : ''}
      </button>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="font-bold text-slate-900">{t('feedback.title')}</h3>
        <p className="text-xs text-slate-500">{t('feedback.subtitle')}</p>
      </div>

      {questions.map((q) => (
        <div key={q.id} className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">{t(q.i18n_key)}</label>

          {q.qtype === 'rating' && (
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setAnswers((a) => ({ ...a, [q.id]: { ...a[q.id], rating: n } }))}
                  className="p-1">
                  <Star className={`h-6 w-6 transition ${(answers[q.id]?.rating || 0) >= n ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300'}`} />
                </button>
              ))}
            </div>
          )}

          {q.qtype === 'nps' && (
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                <button key={n} onClick={() => setAnswers((a) => ({ ...a, [q.id]: { ...a[q.id], nps: n } }))}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${(answers[q.id]?.nps) === n ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-brand-100'}`}>
                  {n}
                </button>
              ))}
            </div>
          )}

          {q.qtype === 'text' && (
            <textarea value={answers[q.id]?.comment || ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: { ...a[q.id], comment: e.target.value } }))}
              placeholder={t('feedback.comment_ph')} rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 outline-none resize-none" />
          )}
        </div>
      ))}

      <button onClick={submit} disabled={submitting}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium disabled:opacity-50">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {t('feedback.submit')}
      </button>
    </div>
  );
}
