'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, XCircle, AlertCircle, Loader2, Trophy, RotateCcw } from 'lucide-react';

interface Question {
  id?: string;
  question: string;
  type: 'single' | 'multiple' | 'true_false' | 'text';
  options?: string[];
  correct_answer: any; // string | string[] | boolean
  explanation?: string;
  points?: number;
}

interface QuizData {
  title: string;
  description?: string;
  questions: Question[];
  pass_percentage?: number;
}

export function QuizPlayer({ 
  quiz, courseId, courseTitle, lessonId, lessonTitle, onComplete 
}: { 
  quiz: QuizData; courseId: string; courseTitle: string;
  lessonId: string; lessonTitle: string;
  onComplete?: (result: any) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [pending, startTransition] = useTransition();

  const q = quiz.questions[currentIdx];
  const passPct = quiz.pass_percentage || 70;

  function setAnswer(value: any) {
    setAnswers((a) => ({ ...a, [currentIdx]: value }));
  }

  function next() { if (currentIdx < quiz.questions.length - 1) setCurrentIdx(currentIdx + 1); }
  function prev() { if (currentIdx > 0) setCurrentIdx(currentIdx - 1); }

  function submit() {
    const answersArr = quiz.questions.map((qq, idx) => ({
      question: qq.question,
      type: qq.type,
      user_answer: answers[idx] ?? null,
      correct_answer: qq.correct_answer,
      explanation: qq.explanation,
    }));
    startTransition(async () => {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_quiz_submit', {
        p_course_id: courseId, p_course_title: courseTitle,
        p_lesson_id: lessonId, p_lesson_title: lessonTitle,
        p_quiz_type: 'lesson_quiz', p_answers: answersArr, p_total: quiz.questions.length,
      });
      if (!error && (data as any)?.ok) {
        setResult(data);
        setSubmitted(true);
        onComplete?.(data);
      }
    });
  }

  function retry() {
    setCurrentIdx(0); setAnswers({}); setSubmitted(false); setResult(null);
  }

  if (submitted && result) {
    const passed = result.passed;
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        {passed ? (
          <Trophy className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        ) : (
          <AlertCircle className="h-16 w-16 text-rose-500 mx-auto mb-4" />
        )}
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {passed ? 'Aprovado!' : 'Não passaste desta vez'}
        </h2>
        <p className="text-slate-600 mb-4">
          {result.score} / {result.total} respostas correctas ({result.percentage}%)
        </p>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-6 ${passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
          {passed ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <span className="font-semibold">Mínimo: {passPct}%</span>
        </div>

        {/* Review answers */}
        <div className="text-left mt-6 space-y-3">
          <h3 className="font-semibold text-slate-900">Revisão de respostas</h3>
          {quiz.questions.map((qq, idx) => {
            const userAns = answers[idx];
            const correct = JSON.stringify(userAns) === JSON.stringify(qq.correct_answer);
            return (
              <div key={idx} className={`p-4 rounded-lg border ${correct ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                <div className="flex items-start gap-2 mb-2">
                  {correct ? <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 text-sm">{idx + 1}. {qq.question}</div>
                    <div className="text-xs text-slate-600 mt-1">
                      A tua resposta: <strong>{JSON.stringify(userAns) || 'sem resposta'}</strong>
                    </div>
                    {!correct && (
                      <div className="text-xs text-emerald-700 mt-1">
                        Correcta: <strong>{JSON.stringify(qq.correct_answer)}</strong>
                      </div>
                    )}
                    {qq.explanation && (
                      <div className="text-xs text-slate-700 mt-2 italic">{qq.explanation}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={retry} className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg">
          <RotateCcw className="h-4 w-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  if (!q) return <div className="p-8 text-center text-slate-500">Sem perguntas neste quiz.</div>;

  const userAns = answers[currentIdx];
  const allAnswered = quiz.questions.every((_, idx) => answers[idx] !== undefined);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900 text-lg">{quiz.title}</h2>
        <span className="text-xs text-slate-500">Pergunta {currentIdx + 1} de {quiz.questions.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all"
          style={{ width: `${((currentIdx + 1) / quiz.questions.length) * 100}%` }} />
      </div>

      <h3 className="font-semibold text-slate-900 text-base mb-4">{q.question}</h3>

      <div className="space-y-2 mb-6">
        {q.type === 'true_false' && [true, false].map((v) => (
          <label key={String(v)} className={`block p-3 border-2 rounded-lg cursor-pointer ${userAns === v ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
            <input type="radio" checked={userAns === v} onChange={() => setAnswer(v)} className="hidden" />
            <span className="text-sm font-medium">{v ? 'Verdadeiro' : 'Falso'}</span>
          </label>
        ))}

        {q.type === 'single' && q.options?.map((opt, oIdx) => (
          <label key={oIdx} className={`block p-3 border-2 rounded-lg cursor-pointer ${userAns === opt ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
            <input type="radio" checked={userAns === opt} onChange={() => setAnswer(opt)} className="hidden" />
            <span className="text-sm">{opt}</span>
          </label>
        ))}

        {q.type === 'multiple' && q.options?.map((opt, oIdx) => {
          const checked = Array.isArray(userAns) && userAns.includes(opt);
          return (
            <label key={oIdx} className={`block p-3 border-2 rounded-lg cursor-pointer ${checked ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <input type="checkbox" checked={checked} onChange={(e) => {
                const arr = Array.isArray(userAns) ? userAns : [];
                setAnswer(e.target.checked ? [...arr, opt] : arr.filter((x) => x !== opt));
              }} className="mr-2" />
              <span className="text-sm">{opt}</span>
            </label>
          );
        })}

        {q.type === 'text' && (
          <input type="text" value={userAns || ''} onChange={(e) => setAnswer(e.target.value)}
            className="w-full px-3 py-2 border-2 border-slate-200 focus:border-brand-500 rounded-lg" placeholder="A tua resposta…" />
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button onClick={prev} disabled={currentIdx === 0} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm disabled:opacity-30">← Anterior</button>
        {currentIdx < quiz.questions.length - 1 ? (
          <button onClick={next} disabled={userAns === undefined}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">Seguinte →</button>
        ) : (
          <button onClick={submit} disabled={!allAnswered || pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Submeter
          </button>
        )}
      </div>
    </div>
  );
}
