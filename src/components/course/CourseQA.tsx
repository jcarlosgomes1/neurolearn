'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageCircleQuestion, Plus, X, Loader2, Pin, CheckCircle, Award } from 'lucide-react';

export function CourseQA({ courseId, currentUserId }: { courseId: string; currentUserId?: string }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const sb = createClient();

  async function reload() {
    const { data } = await sb.rpc('nl_course_questions_list', { p_course_id: courseId, p_module: null, p_lesson: null });
    if ((data as any)?.ok) setQuestions((data as any).questions || []);
  }
  useEffect(() => { reload(); }, [courseId]);

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MessageCircleQuestion className="h-5 w-5" /> Perguntas & Respostas
          <span className="text-xs text-slate-500 font-normal">({questions.length})</span>
        </h2>
        {currentUserId && !showForm && (
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg">
            <Plus className="h-3 w-3" /> Perguntar
          </button>
        )}
      </div>
      {showForm && <QuestionForm courseId={courseId} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); reload(); }} />}
      {questions.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">Sem perguntas ainda. Sê o/a primeiro/a!</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {questions.map((q) => (
            <div key={q.id} className="py-3">
              <button onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)} className="w-full text-left">
                <div className="flex items-start gap-2">
                  {q.pinned_by_instructor && <Pin className="h-3 w-3 text-amber-500 flex-shrink-0 mt-1" />}
                  {q.resolved && <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-1" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm">{q.title}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{q.author_name}</span>
                      <span>·</span>
                      <span>{q.answers_count} resposta{q.answers_count === 1 ? '' : 's'}</span>
                      <span>·</span>
                      <span>{new Date(q.created_at).toLocaleDateString('pt-PT')}</span>
                    </div>
                  </div>
                </div>
              </button>
              {expandedQ === q.id && <QuestionThread questionId={q.id} questionBody={q.body} courseId={courseId} currentUserId={currentUserId} onChanged={reload} />}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function QuestionForm({ courseId, onClose, onSaved }: any) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();
  const sb = createClient();
  function submit() {
    if (!title.trim()) return;
    startTransition(async () => {
      await sb.rpc('nl_course_question_ask', { p_course_id: courseId, p_title: title, p_body: body || null });
      onSaved();
    });
  }
  return (
    <div className="mb-4 p-4 bg-slate-50 rounded-xl space-y-2">
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A tua pergunta…"
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Mais contexto (opcional)…"
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
        <button onClick={submit} disabled={pending || !title.trim()} className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm">
          {pending && <Loader2 className="h-3 w-3 animate-spin" />} Publicar
        </button>
      </div>
    </div>
  );
}

function QuestionThread({ questionId, questionBody, currentUserId, onChanged }: any) {
  const [answers, setAnswers] = useState<any[]>([]);
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();
  const sb = createClient();
  async function reload() {
    const { data } = await sb.rpc('nl_course_question_answers', { p_question_id: questionId });
    if ((data as any)?.ok) setAnswers((data as any).answers || []);
  }
  useEffect(() => { reload(); }, [questionId]);
  function answer() {
    if (!body.trim()) return;
    startTransition(async () => {
      await sb.rpc('nl_course_answer', { p_question_id: questionId, p_body: body });
      setBody(''); reload(); onChanged?.();
    });
  }
  return (
    <div className="mt-3 ml-5 pl-3 border-l-2 border-slate-100 space-y-2">
      {questionBody && <p className="text-sm text-slate-600 whitespace-pre-wrap">{questionBody}</p>}
      {answers.map((a) => (
        <div key={a.id} className={`p-2.5 rounded-lg ${a.is_instructor_answer ? 'bg-brand-50 border border-brand-100' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-700">{a.author_name}</span>
            {a.is_instructor_answer && <span className="px-1.5 py-0.5 bg-brand-600 text-white text-[9px] font-bold rounded inline-flex items-center gap-0.5"><Award className="h-2.5 w-2.5" /> INSTRUCTOR</span>}
            {a.marked_as_solution && <span className="text-emerald-600 inline-flex items-center gap-0.5 text-[10px]"><CheckCircle className="h-3 w-3" /> Solução</span>}
            <span className="text-[10px] text-slate-400">{new Date(a.created_at).toLocaleDateString('pt-PT')}</span>
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{a.body}</p>
        </div>
      ))}
      {currentUserId && (
        <div className="flex gap-1">
          <input type="text" value={body} onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && answer()}
            placeholder="Responder…"
            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm" />
          <button onClick={answer} disabled={pending || !body.trim()} className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs disabled:opacity-50">
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Enviar'}
          </button>
        </div>
      )}
    </div>
  );
}
