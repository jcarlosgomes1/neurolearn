'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';
import { MessageCircleQuestion, X, Loader2, Globe, CornerDownRight, CheckCircle2, Pin, Flag } from 'lucide-react';

interface Question {
  id: string;
  title: string;
  body: string | null;
  lang: string | null;
  author_name: string | null;
  upvotes: number | null;
  pinned_by_instructor: boolean | null;
  created_at: string | null;
}
interface Answer {
  id: string;
  body: string;
  lang: string | null;
  author_name: string | null;
  is_instructor_answer: boolean | null;
  marked_as_solution: boolean | null;
  created_at: string | null;
}

export function LessonQuestions({ courseId, moduleIndex, lessonIndex, collapsed = true }: {
  courseId: string; moduleIndex: number; lessonIndex: number; collapsed?: boolean;
}) {
  const locale = useLocale();
  const sb = createClient();
  const [open, setOpen] = useState(!collapsed);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [translated, setTranslated] = useState(false);
  const [tmap, setTmap] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);
  const [reported, setReported] = useState<Record<string, boolean>>({});
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sb.rpc('nl_is_feature_enabled', { p_key: 'qa' }).then(({ data }) => setEnabled(data !== false));
    sb.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.rpc('nl_course_questions_list', { p_course_id: courseId, p_module: moduleIndex, p_lesson: lessonIndex });
    setQuestions((((data as any)?.questions) || []) as Question[]);
    setLoading(false);
  }, [courseId, moduleIndex, lessonIndex]);

  useEffect(() => { if (open && questions.length === 0) load(); }, [open]);

  async function loadAnswers(qid: string) {
    if (answers[qid]) { setExpanded(expanded === qid ? null : qid); return; }
    const { data } = await sb.rpc('nl_course_question_answers', { p_question_id: qid });
    setAnswers((m) => ({ ...m, [qid]: ((((data as any)?.answers) || []) as Answer[]) }));
    setExpanded(qid);
  }

  async function ask() {
    if (!title.trim()) return;
    setBusy(true);
    const { data } = await sb.rpc('nl_course_question_ask', { p_course_id: courseId, p_title: title.trim(), p_body: body.trim() || null, p_module: moduleIndex, p_lesson: lessonIndex });
    setBusy(false);
    if ((data as any)?.ok) { setTitle(''); setBody(''); load(); }
  }

  async function answer(qid: string) {
    if (!answerText.trim()) return;
    setBusy(true);
    const { data } = await sb.rpc('nl_course_answer', { p_question_id: qid, p_body: answerText.trim() });
    setBusy(false);
    if ((data as any)?.ok) { setAnswerText(''); setAnswers((m) => { const c = { ...m }; delete c[qid]; return c; }); await loadAnswers(qid); }
  }

  async function report(kind: 'question' | 'answer', id: string) {
    const key = kind + id;
    if (reported[key]) return;
    setReported((m) => ({ ...m, [key]: true }));
    await sb.rpc('nl_qa_report', { p_kind: kind, p_id: id });
  }

  async function toggleTranslate() {
    if (translated) { setTranslated(false); return; }
    const items: { id: string; text: string; source_lang: string }[] = [];
    for (const q of questions) {
      if ((q.lang || 'pt') !== locale) {
        items.push({ id: 'q:' + q.id + ':t', text: q.title, source_lang: q.lang || 'pt' });
        if (q.body) items.push({ id: 'q:' + q.id + ':b', text: q.body, source_lang: q.lang || 'pt' });
      }
    }
    for (const list of Object.values(answers)) {
      for (const a of list) {
        if ((a.lang || 'pt') !== locale) items.push({ id: 'a:' + a.id, text: a.body, source_lang: a.lang || 'pt' });
      }
    }
    if (items.length === 0) { setTranslated(true); return; }
    setTranslating(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/qa-translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({ items, target_lang: locale }),
      });
      const data = await resp.json();
      setTmap(data?.translations || {});
      setTranslated(true);
    } catch { /* fail-open */ } finally { setTranslating(false); }
  }

  if (enabled === false) return null;

  const qTitle = (q: Question) => (translated && tmap['q:' + q.id + ':t']) || q.title;
  const qBody = (q: Question) => (translated && tmap['q:' + q.id + ':b']) || q.body;
  const aBody = (a: Answer) => (translated && tmap['a:' + a.id]) || a.body;

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} className="fixed right-4 bottom-36 md:bottom-20 z-30 bg-gradient-to-br from-violet-500 to-indigo-600 text-white px-4 py-2.5 rounded-full shadow-xl hover:scale-[1.04] active:scale-[0.98] transition-transform flex items-center gap-2 font-semibold text-sm">
          <MessageCircleQuestion className="h-4 w-4" /> Perguntas
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50">
              <h2 className="font-bold text-slate-900 flex items-center gap-2"><MessageCircleQuestion className="h-5 w-5 text-violet-600" /> Perguntas e Respostas</h2>
              <div className="flex items-center gap-1">
                <button onClick={toggleTranslate} disabled={translating} title="Traduzir" className={`p-1.5 rounded-lg ${translated ? 'bg-violet-600 text-white' : 'hover:bg-white text-slate-500'}`}>
                  {translating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white rounded-lg text-slate-500"><X className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>
              ) : questions.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-10">Ainda não há perguntas nesta aula. Sê o primeiro!</p>
              ) : questions.map((q) => (
                <div key={q.id} className="rounded-xl border border-slate-200 bg-white">
                  <button onClick={() => loadAnswers(q.id)} className="w-full text-left p-3">
                    <div className="flex items-start gap-2">
                      {q.pinned_by_instructor ? <Pin className="h-3.5 w-3.5 text-violet-500 mt-1 shrink-0" /> : null}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-sm leading-snug">{qTitle(q)}</p>
                        {qBody(q) ? <p className="text-xs text-slate-600 mt-1 line-clamp-3 whitespace-pre-wrap">{qBody(q)}</p> : null}
                        <p className="text-[11px] text-slate-400 mt-1.5">{q.author_name || 'Aluno'}{q.lang && q.lang !== locale ? ' · ' + q.lang.toUpperCase() : ''}</p>
                      </div>
                    </div>
                  </button>
                  {expanded === q.id && (
                    <div className="border-t border-slate-100 p-3 space-y-2 bg-slate-50/60">
                      <div className="flex justify-end">
                        <button onClick={() => report('question', q.id)} disabled={!!reported['question' + q.id]} className="text-[11px] text-slate-400 hover:text-rose-500 disabled:text-rose-400 flex items-center gap-1">
                          <Flag className="h-3 w-3" /> {reported['question' + q.id] ? 'Reportado' : 'Reportar'}
                        </button>
                      </div>
                      {(answers[q.id] || []).map((a) => (
                        <div key={a.id} className="flex gap-2">
                          <CornerDownRight className="h-3.5 w-3.5 text-slate-300 mt-1 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{aBody(a)}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                              {a.is_instructor_answer ? <span className="text-violet-600 font-semibold">Instrutor</span> : (a.author_name || 'Aluno')}
                              {a.marked_as_solution ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : null}
                              <button onClick={() => report('answer', a.id)} disabled={!!reported['answer' + a.id]} className="ml-1 text-slate-300 hover:text-rose-500 disabled:text-rose-400" title="Reportar"><Flag className="h-3 w-3" /></button>
                            </p>
                          </div>
                        </div>
                      ))}
                      {(answers[q.id] || []).length === 0 ? <p className="text-xs text-slate-400">Sem respostas ainda.</p> : null}
                      {uid ? (
                        <div className="flex gap-2 pt-1">
                          <input value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Responder…" className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-violet-400" />
                          <button onClick={() => answer(q.id)} disabled={busy} className="rounded-lg bg-slate-900 text-white text-xs font-semibold px-3 disabled:opacity-50">Enviar</button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {uid ? (
              <div className="border-t border-slate-100 p-3 space-y-2 bg-white">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A tua pergunta…" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
                <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Detalhes (opcional)" rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none outline-none focus:border-violet-400" />
                <button onClick={ask} disabled={busy || !title.trim()} className="w-full rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-semibold py-2 disabled:opacity-50 flex items-center justify-center gap-2">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Publicar pergunta
                </button>
              </div>
            ) : (
              <div className="border-t border-slate-100 p-3 text-center text-xs text-slate-400">Inicia sessão para perguntar ou responder.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
