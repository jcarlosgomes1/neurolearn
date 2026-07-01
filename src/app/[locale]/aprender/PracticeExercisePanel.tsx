'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Code2, Loader2, CheckCircle2, XCircle, Clock, Play, Terminal } from 'lucide-react';
import { runCode, runWithTests } from '@/lib/codeRunner';

type Check = { type: string; passed: boolean; message: string };
type MySub = { submission: string; auto_score: number | null; auto_passed: boolean | null; status: string; human_score: number | null; human_feedback: string | null };
type Exercise = {
  id: string; kind: 'code' | 'freeform' | 'checklist';
  title_md: string; prompt_md: string; starter_code: string | null; max_score: number; position: number;
  language?: string | null; tests?: string | null;
  my_submission: MySub | null;
};

export function PracticeExercisePanel({ exercise }: { exercise: Exercise }) {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);
  const my = exercise.my_submission;
  const isCode = exercise.kind === 'code';
  const lang = (exercise.language || 'python').toLowerCase();
  const [code, setCode] = useState(my?.submission ?? exercise.starter_code ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<{ text: string; error?: string } | null>(null);
  const [result, setResult] = useState<{ passed: boolean | null; score: number | null; feedback: Check[]; auto_gradable: boolean; overall?: string } | null>(
    my ? { passed: my.auto_passed, score: my.auto_score, feedback: [], auto_gradable: my.status === 'auto_graded' } : null
  );

  async function runOnly() {
    if (!code.trim()) return;
    setRunning(true); setOutput(null);
    try {
      const r = await runCode(lang, code);
      setOutput({ text: r.output || '', error: r.error });
    } catch (e) {
      setOutput({ text: '', error: e instanceof Error ? e.message : String(e) });
    } finally { setRunning(false); }
  }

  async function submit() {
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      if (isCode) {
        // execução real no browser (sandbox) + registo do resultado
        const r = await runWithTests(lang, code, exercise.tests ?? null);
        setOutput({ text: r.output || '', error: r.error });
        const { data, error } = await supabase.rpc('nl_practice_submit_run', {
          p_exercise_id: exercise.id, p_submission: code, p_passed: r.passed,
          p_detail: { output: (r.output || '').slice(0, 4000), error: r.error || null },
        });
        const d = data as { ok?: boolean; score?: number };
        if (error || !d?.ok) throw error || new Error('fail');
        setResult({ passed: r.passed, score: d.score ?? (r.passed ? exercise.max_score : 0), feedback: [], auto_gradable: true });
        if (r.passed) toast.success(t('practice.passed')); else toast.error(t('practice.failed'));
      } else {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const res = await fetch(`${SUPABASE_URL}/functions/v1/grade-practice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ exercise_id: exercise.id, submission: code }),
        });
        const d = await res.json().catch(() => ({})) as { ok?: boolean; evaluation?: { passed: boolean | null; score: number | null; feedback?: Check[]; auto_gradable: boolean; overall?: string } };
        if (!d?.ok || !d.evaluation) throw new Error('fail');
        const ev = d.evaluation;
        setResult({ passed: ev.passed, score: ev.score, feedback: ev.feedback || [], auto_gradable: ev.auto_gradable, overall: ev.overall });
        if (ev.passed) toast.success(t('practice.passed'));
        else if (!ev.auto_gradable) toast.success(t('practice.pending_review'));
      }
    } catch { toast.error(t('practice.error')); }
    finally { setSubmitting(false); }
  }

  const passed = result?.passed === true;
  const failed = result?.passed === false && result?.auto_gradable;
  const pending = result != null && !result.auto_gradable && result.passed == null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-brand-600 to-brand-600 px-5 py-3 flex items-center gap-2 text-white">
        <Code2 className="h-4 w-4" />
        <span className="text-sm font-semibold">{t('practice.title')}</span>
        {isCode && <span className="text-[10px] uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded font-mono">{lang}</span>}
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
            rows={isCode ? 10 : 5} spellCheck={!isCode}
            className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 outline-none resize-y ${isCode ? 'font-mono bg-slate-900 text-slate-100' : ''}`} />
        </div>

        {isCode && output && (
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <div className="bg-slate-100 px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <Terminal className="h-3.5 w-3.5" /> {t('practice.output')}
            </div>
            <pre className="bg-slate-900 text-slate-100 text-xs p-3 overflow-x-auto whitespace-pre-wrap max-h-60">{output.text || (output.error ? '' : '—')}
{output.error && <span className="text-rose-400">{output.error}</span>}</pre>
          </div>
        )}

        {result && (
          <div className={`rounded-xl p-3 ${passed ? 'bg-emerald-50 border border-emerald-200' : failed ? 'bg-rose-50 border border-rose-200' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              {passed ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> <span className="text-emerald-800">{t('practice.passed')}</span></>
                : failed ? <><XCircle className="h-4 w-4 text-rose-600" /> <span className="text-rose-800">{t('practice.failed')}</span></>
                : <><Clock className="h-4 w-4 text-amber-600" /> <span className="text-amber-800">{t('practice.pending_review')}</span></>}
              {result.score != null && <span className="ml-auto text-xs font-bold">{t('practice.score')}: {result.score}/{exercise.max_score}</span>}
            </div>
            {result.overall && <p className="mt-2 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{result.overall}</p>}
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

        <div className="flex flex-wrap gap-2">
          {isCode && (
            <button onClick={runOnly} disabled={running || submitting || !code.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium disabled:opacity-50 hover:bg-slate-900">
              {running ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('practice.running')}</> : <><Terminal className="h-4 w-4" /> {t('practice.run')}</>}
            </button>
          )}
          <button onClick={submit} disabled={submitting || running || !code.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-brand-700">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('practice.submitting')}</> : <><Play className="h-4 w-4" /> {my ? t('practice.resubmit') : t('practice.submit')}</>}
          </button>
        </div>
        {isCode && <p className="text-[11px] text-slate-400">{t('practice.sandbox_note')}</p>}
      </div>
    </div>
  );
}
