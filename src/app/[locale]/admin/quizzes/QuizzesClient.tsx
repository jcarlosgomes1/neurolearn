'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, Loader2, Pencil } from 'lucide-react';

type Attempt = {
  id: string; course_id: string | null; module_index: number | null; lesson_index: number | null;
  quiz_kind: string | null; question: string | null; answer_md: string | null;
  ai_score: number | null; ai_max_score: number | null; ai_feedback_md: string | null;
  human_validated: boolean; status: string | null; created_at: string | null;
};

export function QuizzesClient({ initial }: { initial: Attempt[] }) {
  const sb = createClient();
  const [rows, setRows] = useState<Attempt[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [score, setScore] = useState('');
  const [fb, setFb] = useState('');

  async function approve(a: Attempt) {
    setBusy(a.id); setErr(null);
    const { error } = await sb.rpc('nl_quiz_attempt_validate', { p_id: a.id, p_decision: 'approve' });
    if (error) { setErr(error.message); setBusy(null); return; }
    setRows((r) => r.map((x) => (x.id === a.id ? { ...x, human_validated: true } : x)));
    setBusy(null);
  }
  async function override(a: Attempt) {
    setBusy(a.id); setErr(null);
    const { error } = await sb.rpc('nl_quiz_attempt_validate', { p_id: a.id, p_decision: 'override', p_human_score: score === '' ? null : Number(score), p_human_feedback_md: fb || null });
    if (error) { setErr(error.message); setBusy(null); return; }
    setRows((r) => r.map((x) => (x.id === a.id ? { ...x, human_validated: true } : x)));
    setEditing(null); setScore(''); setFb(''); setBusy(null);
  }

  const pending = rows.filter((r) => !r.human_validated);
  const done = rows.filter((r) => r.human_validated);

  const Card = ({ a }: { a: Attempt }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 uppercase text-slate-500">{a.quiz_kind}</span>
        <span>{a.course_id} · M{a.module_index}·L{a.lesson_index}</span>
        {a.human_validated ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">validado</span> : null}
      </div>
      {a.question ? <p className="mt-2 text-sm font-medium text-slate-900">{a.question}</p> : null}
      {a.answer_md ? <p className="mt-1 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{a.answer_md}</p> : null}
      <div className="mt-2 text-sm text-slate-600">
        IA: <span className="font-semibold">{a.ai_score ?? '-'}/{a.ai_max_score ?? '-'}</span>
        {a.ai_feedback_md ? <span className="text-slate-500"> — {a.ai_feedback_md}</span> : null}
      </div>
      {!a.human_validated ? (
        <div className="mt-3">
          {editing === a.id ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input value={score} onChange={(e) => setScore(e.target.value)} placeholder="Pontuacao" type="number" className="w-28 rounded-xl border border-slate-200 px-3 py-1.5 text-sm" />
                <input value={fb} onChange={(e) => setFb(e.target.value)} placeholder="Feedback" className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => override(a)} disabled={busy === a.id} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Guardar</button>
                <button onClick={() => setEditing(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs">Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => approve(a)} disabled={busy === a.id} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 disabled:opacity-50">
                {busy === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Aprovar IA
              </button>
              <button onClick={() => { setEditing(a.id); setScore(String(a.ai_score ?? '')); setFb(''); }} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
                <Pencil className="h-3.5 w-3.5" /> Ajustar
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-6">
      {err ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</div> : null}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Pendentes ({pending.length})</h2>
        <div className="space-y-3">
          {pending.map((a) => <Card key={a.id} a={a} />)}
          {pending.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Nada pendente.</div> : null}
        </div>
      </div>
      {done.length > 0 ? (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Validados ({done.length})</h2>
          <div className="space-y-3">{done.slice(0, 20).map((a) => <Card key={a.id} a={a} />)}</div>
        </div>
      ) : null}
    </div>
  );
}
