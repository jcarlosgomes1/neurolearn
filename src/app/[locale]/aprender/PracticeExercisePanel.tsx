'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Code2, Loader2, CheckCircle2, XCircle, Clock, Play } from 'lucide-react';

type Check = { type: string; passed: boolean; message: string };
type MySub = { submission: string; auto_score: number | null; auto_passed: boolean | null; status: string; human_score: number | null; human_feedback: string | null };
type Exercise = {
  id: string; kind: 'code' | 'freeform' | 'checklist';
  title_md: string; prompt_md: string; starter_code: string | null; max_score: number; position: number;
  my_submission: MySub | null;
};

export function PracticeExercisePanel({ exercise }: { exercise: Exercise }) {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);
  const my = exercise.my_submission;
  const [code, setCode] = useState(my?.submission ?? exercise.starter_code ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ passed: boolean | null; score: number | null; feedback: Check[]; auto_gradable: boolean } | null>(
    my ? { passed: my.auto_passed, score: my.auto_score, feedback: [], auto_gradable: my.status === 'auto_graded' } : null
  );

  async function submit() {
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('nl_practice_submit', { p_exercise_id: exercise.id, p_submission: code });
      const d = data as { ok?: boolean; evaluation?: any };
      if (error || !d?.ok) throw error || new Error('fail');
      const ev = d.evaluation;
      setResult({ passed: ev.passed, score: ev.score, feedback: ev.feedback || [], auto_gradable: ev.auto_gradable });
      if (ev.passed) toast.success(t('practice.passed'));
      else if (!ev.auto_gradable) toast.success(t('practice.pending_review'));
    } catch { toast.error(t('practice.error')); }
    finally { setSubmitting(false); }
  }

  const isMono = exercise.kind === 'code';
  const passed = result?.passed === true;
  const failed = result?.passed === false && result?.auto_gradable;
  const pending = result != null && !result.auto_gradable && result.passed == null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 flex items-center gap-2 text-white">
        <Code2 className="h-4 w-4" />
        <span className="text-sm font-semibold">{t('practice.title')}</span>
        {passed && <CheckCircle2 className="h-4 w-4 ml-auto" />}
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h4 className="font-bold text-slate-900">{exercise.title_md}</h4>
          <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{exercise.prompt_md}</p>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">{t('practice.your_solution')}</label>
          <textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('practice.placeholder')}
            rows={isMono ? 8 : 5} spellCheck={!isMono}
            className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 outline-none resize-y ${isMono ? 'font-mono bg-slate-50' : ''}`} />
        </div>

        {result && (
          <div className={`rounded-xl p-3 ${passed ? 'bg-emerald-50 border border-emerald-200' : failed ? 'bg-rose-50 border border-rose-200' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              {passed ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> <span className="text-emerald-800">{t('practice.passed')}</span></>
                : failed ? <><XCircle className="h-4 w-4 text-rose-600" /> <span className="text-rose-800">{t('practice.failed')}</span></>
                : <><Clock className="h-4 w-4 text-amber-600" /> <span className="text-amber-800">{t('practice.pending_review')}</span></>}
              {result.score != null && <span className="ml-auto text-xs font-bold">{t('practice.score')}: {result.score}/{exercise.max_score}</span>}
            </div>
            {result.feedback.length > 0 && (
              <ul className="mt-2 space-y-1">
                {result.feedback.map((c, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                    {c.passed ? <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" /> : <XCircle className="h-3 w-3 text-rose-400 flex-shrink-0" />}
                    {c.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button onClick={submit} disabled={submitting || !code.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-violet-700">
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('practice.submitting')}</> : <><Play className="h-4 w-4" /> {my ? t('practice.resubmit') : t('practice.submit')}</>}
        </button>
      </div>
    </div>
  );
}
