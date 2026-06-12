'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Clock, PenLine, Star } from 'lucide-react';

interface Question { id: string; prompt_md: string; guidance_md: string | null; max_score: number; position: number }
interface Attempt { id: string; question: string; answer_md: string; status: string; human_validated: boolean; score: number | null; feedback_md: string | null; submitted_at: string }

export function LessonOpenQuiz({ courseId, moduleIndex, lessonIndex }: { courseId: string; moduleIndex: number; lessonIndex: number }) {
  const t = useTranslations('lesson_quiz');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const [{ data: q }, { data: a }] = await Promise.all([
        sb.rpc('nl_lesson_quizzes_for_student', { p_course_id: courseId, p_module_index: moduleIndex, p_lesson_index: lessonIndex }),
        sb.rpc('nl_quiz_my_attempts', { p_course_id: courseId, p_module_index: moduleIndex, p_lesson_index: lessonIndex }),
      ]);
      setQuestions(((q as { questions?: Question[] })?.questions) || []);
      setAttempts(((a as { attempts?: Attempt[] })?.attempts) || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [courseId, moduleIndex, lessonIndex]);

  useEffect(() => { load(); }, [load]);

  if (loading) return null;
  if (questions.length === 0) return null;

  const attemptFor = (prompt: string) => attempts.find((x) => x.question === prompt);

  async function submit(q: Question) {
    const answer = (drafts[q.id] || '').trim();
    if (!answer) { toast.error(t('empty_answer')); return; }
    setSubmitting(q.id);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { error } = await sb.rpc('nl_quiz_attempt_submit', {
        p_course_id: courseId, p_question: q.prompt_md, p_answer_md: answer,
        p_module_index: moduleIndex, p_lesson_index: lessonIndex, p_quiz_kind: 'lesson',
      });
      if (error) throw error;
      toast.success(t('submitted'));
      setDrafts((d) => ({ ...d, [q.id]: '' }));
      await load();
    } catch { toast.error(t('error')); }
    finally { setSubmitting(null); }
  }

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600"><PenLine className="w-4 h-4" /></span>
        <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-700">{t('title')}</h3>
      </div>
      <p className="text-sm text-slate-500">{t('intro')}</p>
      {questions.map((q) => {
        const at = attemptFor(q.prompt_md);
        return (
          <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-base font-semibold text-slate-900">{q.prompt_md}</p>
            {q.guidance_md && <p className="mt-1 text-xs text-slate-400">{t('guidance')}: {q.guidance_md}</p>}
            <p className="mt-1 text-[11px] text-slate-400">{q.max_score} {t('points')}</p>

            {at ? (
              <div className="mt-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">{t('your_submitted_answer')}</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{at.answer_md}</p>
                </div>
                {at.human_validated ? (
                  <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-800">{t('score')}: {at.score ?? '—'} / {q.max_score}</span>
                    </div>
                    {at.feedback_md && <p className="text-sm text-emerald-900/80 whitespace-pre-wrap">{at.feedback_md}</p>}
                  </div>
                ) : (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1.5">
                    <Clock className="w-3.5 h-3.5" />{t('evaluating')}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3">
                <textarea value={drafts[q.id] || ''} onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                  rows={4} placeholder={t('answer_ph')}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-y" />
                <button onClick={() => submit(q)} disabled={submitting === q.id}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-sm font-medium px-4 py-2 disabled:opacity-50 hover:bg-slate-800">
                  {submitting === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {submitting === q.id ? t('submitting') : t('submit')}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
