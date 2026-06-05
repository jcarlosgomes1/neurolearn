'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Trophy, RotateCw, Loader2 } from 'lucide-react';

interface Question {
  question: string; type?: 'single'|'multi'|'text';
  options?: string[]; correct?: number | number[]; explanation?: string;
}
interface Quiz { questions: Question[]; passing_score?: number; }

export function QuizPlayer({ courseId, courseTitle, lessonId, lessonTitle, quiz }: {
  courseId: string; courseTitle: string;
  lessonId: string; lessonTitle: string;
  quiz: Quiz;
}) {
  const [answers, setAnswers] = useState<any[]>(new Array(quiz.questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [pending, startTransition] = useTransition();
  const sb = createClient();

  function setAnswer(qIdx: number, val: any) {
    setAnswers((a) => { const n = [...a]; n[qIdx] = val; return n; });
  }

  function submit() {
    startTransition(async () => {
      const { data: { session } } = await sb.auth.getSession();
      try {
        const res = await fetch('https://obpezocujzdaznrdgwoo.supabase.co/functions/v1/submit-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
          body: JSON.stringify({ course_id: courseId, course_title: courseTitle, lesson_id: lessonId, lesson_title: lessonTitle, quiz_type: 'lesson', answers, quiz }),
        });
        const data = await res.json();
        // Fallback local scoring se edge não validar
        let score = data?.score; let total = data?.total ?? quiz.questions.length; let passed = data?.passed;
        if (typeof score !== 'number') {
          score = 0;
          quiz.questions.forEach((q, i) => {
            if (Array.isArray(q.correct)) {
              if (Array.isArray(answers[i]) && q.correct.length === answers[i].length && q.correct.every((c) => answers[i].includes(c))) score++;
            } else if (q.correct === answers[i]) score++;
          });
          const pct = (score / total) * 100;
          passed = pct >= (quiz.passing_score || 70);
        }
        setResult({ score, total, passed, percentage: Math.round((score/total)*100), feedback: data?.feedback });
        setSubmitted(true);
      } catch (e: any) {
        setResult({ error: e?.message || 'submit failed' });
        setSubmitted(true);
      }
    });
  }

  function retake() {
    setAnswers(new Array(quiz.questions.length).fill(null));
    setSubmitted(false);
    setResult(null);
  }

  if (submitted && result) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="text-center mb-6">
          {result.passed ? (
            <><Trophy className="h-16 w-16 text-amber-500 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-slate-900">Parabéns!</h3></>
          ) : (
            <><RotateCw className="h-16 w-16 text-slate-400 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-slate-900">Quase lá!</h3></>
          )}
          <p className="text-4xl font-bold mt-3" style={{ color: result.passed ? '#10b981' : '#f59e0b' }}>
            {result.score}/{result.total} <span className="text-lg text-slate-500">({result.percentage}%)</span>
          </p>
        </div>
        <div className="space-y-3">
          {quiz.questions.map((q, i) => {
            const correct = Array.isArray(q.correct) ? (Array.isArray(answers[i]) && q.correct.length === answers[i].length && q.correct.every((c: number) => answers[i].includes(c))) : (answers[i] === q.correct);
            return (
              <div key={i} className={`p-3 rounded-lg border-2 ${correct ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                <div className="flex items-start gap-2">
                  {correct ? <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" /> : <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />}
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">{q.question}</p>
                    {!correct && q.options && q.correct !== undefined && (
                      <p className="text-xs text-emerald-700 mt-1">
                        Resposta correta: {Array.isArray(q.correct) ? q.correct.map((c: number) => q.options![c]).join(', ') : q.options[q.correct as number]}
                      </p>
                    )}
                    {q.explanation && <p className="text-xs text-slate-600 mt-1 italic">{q.explanation}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {!result.passed && (
          <button onClick={retake} className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg">
            <RotateCw className="h-4 w-4" /> Tentar novamente
          </button>
        )}
      </div>
    );
  }

  const answered = answers.filter((a) => a !== null && a !== undefined && (Array.isArray(a) ? a.length > 0 : true)).length;
  const canSubmit = answered === quiz.questions.length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">Quiz · {quiz.questions.length} pergunta{quiz.questions.length === 1 ? '' : 's'}</h3>
        <span className="text-xs text-slate-500">{answered}/{quiz.questions.length} respondidas</span>
      </div>
      <div className="space-y-4 mb-4">
        {quiz.questions.map((q, i) => (
          <div key={i} className="bg-slate-50 p-4 rounded-xl">
            <p className="font-medium text-slate-900 mb-2 text-sm">{i + 1}. {q.question}</p>
            {q.type === 'text' ? (
              <input type="text" value={answers[i] || ''} onChange={(e) => setAnswer(i, e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Resposta…" />
            ) : (
              <div className="space-y-1.5">
                {(q.options || []).map((opt, oIdx) => {
                  const isMulti = q.type === 'multi' || Array.isArray(q.correct);
                  const selected = isMulti ? (Array.isArray(answers[i]) && answers[i].includes(oIdx)) : answers[i] === oIdx;
                  return (
                    <label key={oIdx} className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer border-2 ${selected ? 'border-brand-500 bg-brand-50' : 'border-transparent bg-white hover:border-slate-200'}`}>
                      <input type={isMulti ? 'checkbox' : 'radio'} checked={selected}
                        onChange={() => {
                          if (isMulti) {
                            const curr = Array.isArray(answers[i]) ? answers[i] : [];
                            setAnswer(i, selected ? curr.filter((x: number) => x !== oIdx) : [...curr, oIdx]);
                          } else setAnswer(i, oIdx);
                        }} />
                      <span className="text-sm text-slate-700">{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={submit} disabled={!canSubmit || pending}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg disabled:opacity-50">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {canSubmit ? 'Submeter quiz' : `Responde a todas (${quiz.questions.length - answered} restantes)`}
      </button>
    </div>
  );
}
