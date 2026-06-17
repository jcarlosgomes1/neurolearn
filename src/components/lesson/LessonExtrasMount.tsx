'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { FileQuestion } from 'lucide-react';

// Lazy load: componentes pesados só montam quando o utilizador abre o painel
const LessonNotesPanel = dynamic(
  () => import('./LessonNotesPanel').then((m) => ({ default: m.LessonNotesPanel })),
  { ssr: false }
);
const LessonQuestions = dynamic(
  () => import('./LessonQuestions').then((m) => ({ default: m.LessonQuestions })),
  { ssr: false }
);
const QuizPlayer = dynamic(
  () => import('@/components/quiz/QuizPlayer').then((m) => ({ default: m.QuizPlayer })),
  { ssr: false }
);

interface LessonExtrasMountProps {
  courseId: string;
  courseTitle: string;
  moduleIndex: number;
  lessonIndex: number;
  lessonId?: string;
  lessonTitle: string;
  lessonContent?: string;
  quiz?: any; // se a lição é um quiz
}

export function LessonExtrasMount({
  courseId, courseTitle, moduleIndex, lessonIndex,
  lessonId, lessonTitle, lessonContent, quiz,
}: LessonExtrasMountProps) {
  const [showQuiz, setShowQuiz] = useState(false);

  const hasQuiz = useMemo(() => {
    if (!quiz) return false;
    if (typeof quiz === 'object' && quiz !== null) {
      if (Array.isArray(quiz.questions) && quiz.questions.length > 0) return true;
      if (Array.isArray(quiz) && quiz.length > 0) return true;
    }
    return false;
  }, [quiz]);

  return (
    <>
      {/* Floating buttons stack — bottom right */}
      <div className="fixed right-4 bottom-20 md:bottom-6 z-30 flex flex-col gap-2 items-end pointer-events-none">
        {hasQuiz && !showQuiz && (
          <button
            onClick={() => setShowQuiz(true)}
            className="pointer-events-auto bg-gradient-to-br from-amber-500 to-orange-600 text-white px-4 py-2.5 rounded-full shadow-xl hover:scale-[1.04] active:scale-[0.98] transition-transform flex items-center gap-2 font-semibold text-sm">
            <FileQuestion className="h-4 w-4" /> Fazer quiz
          </button>
        )}
      </div>

      {/* Painéis colapsados (cada um gere o próprio toggle) */}
      <LessonNotesPanel
        courseId={courseId}
        moduleIndex={moduleIndex}
        lessonIndex={lessonIndex}
        collapsed={true}
      />
      <LessonQuestions
        courseId={courseId}
        moduleIndex={moduleIndex}
        lessonIndex={lessonIndex}
        collapsed={true}
      />

      {/* Quiz overlay quando aberto */}
      {hasQuiz && showQuiz && (
        <div className="fixed inset-0 z-40 bg-slate-900/70 backdrop-blur-sm overflow-y-auto p-4 flex items-start sm:items-center justify-center" onClick={() => setShowQuiz(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl my-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-100 p-4 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileQuestion className="h-4 w-4 text-amber-600" /> Quiz
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{lessonTitle}</p>
              </div>
              <button onClick={() => setShowQuiz(false)} className="p-1.5 hover:bg-white rounded-lg text-slate-500">
                ✕
              </button>
            </div>
            <div className="p-5">
              <QuizPlayer
                quiz={quiz}
                courseId={courseId}
                courseTitle={courseTitle}
                lessonId={lessonId || `${courseId}-${moduleIndex}-${lessonIndex}`}
                lessonTitle={lessonTitle}
                onComplete={() => {
                  setTimeout(() => setShowQuiz(false), 1500);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
