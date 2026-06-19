'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus, X, GraduationCap, MessageCircle, StickyNote } from 'lucide-react';

const LessonNotesPanel = dynamic(
  () => import('./LessonNotesPanel').then((m) => ({ default: m.LessonNotesPanel })),
  { ssr: false }
);
const LessonQuestions = dynamic(
  () => import('./LessonQuestions').then((m) => ({ default: m.LessonQuestions })),
  { ssr: false }
);

// Um único botão flutuante que agrupa as acções da aula (Tutor, Perguntas, Notas),
// em vez de vários botões soltos a sobreporem-se à barra inferior em mobile.
// O Tutor reaproveita o painel/coluna do LessonViewer via evento (em ecrã >=2xl é coluna fixa).
export function LessonActionDock({ courseId, moduleIndex, lessonIndex }: { courseId: string; moduleIndex: number; lessonIndex: number }) {
  const [expanded, setExpanded] = useState(false);
  const [which, setWhich] = useState<'notes' | 'questions' | null>(null);

  const openTutor = () => { setExpanded(false); window.dispatchEvent(new Event('nl-open-tutor')); };
  const pick = (w: 'notes' | 'questions') => { setExpanded(false); setWhich(w); };

  const pill = 'inline-flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full bg-white text-slate-700 shadow-lg border border-slate-200 text-sm font-semibold hover:scale-105 transition-transform';
  const dot = 'w-7 h-7 rounded-full text-white flex items-center justify-center';

  return (
    <>
      {which === 'notes' && (
        <LessonNotesPanel courseId={courseId} moduleIndex={moduleIndex} lessonIndex={lessonIndex} collapsed={false} controlled onClose={() => setWhich(null)} />
      )}
      {which === 'questions' && (
        <LessonQuestions courseId={courseId} moduleIndex={moduleIndex} lessonIndex={lessonIndex} collapsed={false} controlled onClose={() => setWhich(null)} />
      )}

      <div className="fixed right-4 bottom-20 md:bottom-6 z-40 flex flex-col items-end gap-2">
        {expanded && (
          <div className="flex flex-col items-end gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button onClick={openTutor} className={pill}>
              Tutor <span className={`${dot} bg-gradient-to-br from-brand-500 to-purple-500`}><GraduationCap className="h-4 w-4" /></span>
            </button>
            <button onClick={() => pick('questions')} className={pill}>
              Perguntas <span className={`${dot} bg-gradient-to-br from-violet-500 to-indigo-600`}><MessageCircle className="h-4 w-4" /></span>
            </button>
            <button onClick={() => pick('notes')} className={pill}>
              Notas <span className={`${dot} bg-gradient-to-br from-amber-400 to-orange-500`}><StickyNote className="h-4 w-4" /></span>
            </button>
          </div>
        )}
        <button onClick={() => setExpanded((v) => !v)} aria-label="Ações da aula"
          className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-white shadow-lg active:scale-95 transition-transform flex items-center justify-center">
          {expanded ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>
    </>
  );
}
