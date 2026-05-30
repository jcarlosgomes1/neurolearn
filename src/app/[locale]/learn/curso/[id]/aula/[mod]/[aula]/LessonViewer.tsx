'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { toast } from 'sonner';
import { LessonTutor } from '@/components/lesson/LessonTutor';
import { MermaidRender } from '@/components/shared/MermaidRender';

interface Lesson {
  id?: string;
  title: string;
  type?: string;
  duration_minutes?: number;
  content?: {
    p?: string[];
    kp?: string[];
    code?: string | null;
    tip?: string | null;
    q?: { q: string; o: string[]; c: number; e?: string } | null;
    hero_image_url?: string | null;
    hero_image_query?: string | null;
    diagram?: string | null;
  };
}

interface Module { id?: string; title: string; description?: string; lessons: Lesson[] }

interface Course { id: string; title: string; subtitle: string | null; emoji: string | null; level: string | null; modules: Module[] }

export function LessonViewer({ courseId, course, moduleIndex, lessonIndex, locale }: { courseId: string; course: Course; moduleIndex: number; lessonIndex: number; locale: string }) {
  const router = useRouter();
  const [tutorOpen, setTutorOpen] = useState(false);
  const [quizPick, setQuizPick] = useState<number | null>(null);
  const [quizReveal, setQuizReveal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState<boolean | null>(null);

  const mod = course.modules[moduleIndex];
  const lesson = mod?.lessons[lessonIndex];

  // Carregar estado de conclusão
  useEffect(() => {
    callAgentOps<{ lesson_progress: Array<{ module_index: number; lesson_index: number; completed: boolean }> }>('my_progress', { course_id: courseId })
      .then((r) => {
        const found = r.lesson_progress?.find((lp) => lp.module_index === moduleIndex && lp.lesson_index === lessonIndex);
        setCompleted(found?.completed || false);
      })
      .catch(() => setCompleted(false));
    setQuizPick(null);
    setQuizReveal(false);
  }, [courseId, moduleIndex, lessonIndex]);

  if (!mod || !lesson) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-700 font-medium">Aula não encontrada.</p>
        <Link href={'/learn' as any} className="btn-primary mt-6 inline-flex">← Os meus cursos</Link>
      </div>
    );
  }

  // Navegação
  const prevLesson = lessonIndex > 0
    ? { modIdx: moduleIndex, lesIdx: lessonIndex - 1, title: mod.lessons[lessonIndex - 1].title }
    : moduleIndex > 0
      ? { modIdx: moduleIndex - 1, lesIdx: course.modules[moduleIndex - 1].lessons.length - 1, title: course.modules[moduleIndex - 1].lessons.slice(-1)[0]?.title || 'Anterior' }
      : null;
  const nextLesson = lessonIndex < mod.lessons.length - 1
    ? { modIdx: moduleIndex, lesIdx: lessonIndex + 1, title: mod.lessons[lessonIndex + 1].title }
    : moduleIndex < course.modules.length - 1 && course.modules[moduleIndex + 1].lessons.length > 0
      ? { modIdx: moduleIndex + 1, lesIdx: 0, title: course.modules[moduleIndex + 1].lessons[0].title }
      : null;

  async function markComplete() {
    if (completing) return;
    setCompleting(true);
    try {
      await callAgentOps('mark_lesson_complete', { course_id: courseId, module_index: moduleIndex, lesson_index: lessonIndex, lesson_id: lesson.id, completed: true });
      setCompleted(true);
      toast.success('Aula concluída! 🎉');
      if (nextLesson) {
        setTimeout(() => router.push(`/learn/curso/${courseId}/aula/${nextLesson.modIdx}/${nextLesson.lesIdx}` as any), 800);
      } else {
        toast.success('Parabéns, terminaste o curso!');
        setTimeout(() => router.push('/learn' as any), 1500);
      }
    } catch (e: any) { toast.error(e.message); } finally { setCompleting(false); }
  }

  const c = lesson.content || {};
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const overallIdx = course.modules.slice(0, moduleIndex).reduce((s, m) => s + m.lessons.length, 0) + lessonIndex + 1;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex gap-6">
          {/* COLUNA PRINCIPAL */}
          <div className="flex-1 min-w-0 max-w-3xl mx-auto lg:mx-0">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <Link href={`/learn` as any} className="text-sm text-brand-600 hover:underline">← Os meus cursos</Link>
              <div className="text-xs text-slate-500 tabular-nums">{overallIdx} / {totalLessons}</div>
            </div>

            <div className="mb-6">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">{course.emoji} {course.title} · {mod.title}</div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 leading-tight">{lesson.title}</h1>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span>{lesson.type === 'video' ? '🎬 Vídeo' : lesson.type === 'exercise' ? '✍️ Exercício' : '📖 Leitura'}</span>
                {lesson.duration_minutes && <><span>·</span><span>{lesson.duration_minutes} min</span></>}
                {completed && <><span>·</span><span className="text-emerald-600 font-medium">✓ Concluída</span></>}
              </div>
            </div>

            {c.hero_image_url && (
              <div className="mb-6 rounded-xl overflow-hidden aspect-[21/9] bg-slate-100">
                <img src={c.hero_image_url} alt={lesson.title} className="w-full h-full object-cover" loading="eager" />
              </div>
            )}
            {!c.p?.length ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
                <div className="text-3xl mb-2">📝</div>
                <p className="text-sm text-slate-500">Esta aula ainda não tem conteúdo gerado. O instrutor está a preparar.</p>
              </div>
            ) : (
              <article className="bg-white rounded-xl border border-slate-200 p-5 sm:p-8 space-y-6">
                <div className="prose prose-slate max-w-none">
                  {c.p.map((p, i) => (
                    <p key={i} className="text-slate-700 leading-relaxed">{p}</p>
                  ))}
                </div>

                {c.diagram && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Esquema visual</h3>
                    <MermaidRender code={c.diagram} />
                  </div>
                )}

                {c.kp && c.kp.length > 0 && (
                  <div className="bg-brand-50 border border-brand-100 rounded-lg p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-2">Pontos-chave</h3>
                    <ul className="space-y-1.5">
                      {c.kp.map((k, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700"><span className="text-brand-500 flex-shrink-0">✓</span>{k}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {c.code && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Exemplo</h3>
                    <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs sm:text-sm overflow-x-auto"><code>{c.code}</code></pre>
                  </div>
                )}

                {c.tip && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">💡 Dica do instrutor</h3>
                    <p className="text-sm text-amber-900">{c.tip}</p>
                  </div>
                )}

                {c.q?.q && c.q.o && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-purple-700 mb-3">Verifica o que aprendeste</h3>
                    <p className="text-sm font-medium text-slate-900 mb-3">{c.q.q}</p>
                    <div className="space-y-2">
                      {c.q.o.map((opt, i) => {
                        const isPicked = quizPick === i;
                        const isCorrect = quizReveal && i === c.q!.c;
                        const isWrongPick = quizReveal && isPicked && i !== c.q!.c;
                        return (
                          <button key={i} disabled={quizReveal} onClick={() => setQuizPick(i)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm border transition-all ${
                              isCorrect ? 'bg-emerald-100 border-emerald-300 text-emerald-900' :
                              isWrongPick ? 'bg-rose-100 border-rose-300 text-rose-900' :
                              isPicked ? 'bg-purple-100 border-purple-400 text-purple-900' :
                              'bg-white border-slate-200 hover:border-purple-300'}`}>
                            {isCorrect && '✓ '}{isWrongPick && '✗ '}{opt}
                          </button>
                        );
                      })}
                    </div>
                    {!quizReveal ? (
                      <button onClick={() => setQuizReveal(true)} disabled={quizPick === null} className="mt-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg">Confirmar resposta</button>
                    ) : (
                      c.q.e && <p className="mt-3 text-xs text-slate-600 italic">💡 {c.q.e}</p>
                    )}
                  </div>
                )}
              </article>
            )}

            {/* Action bar */}
            <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
              {prevLesson ? (
                <Link href={`/learn/curso/${courseId}/aula/${prevLesson.modIdx}/${prevLesson.lesIdx}` as any} className="bg-white border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-lg text-sm text-slate-700 max-w-[45%] truncate">← {prevLesson.title}</Link>
              ) : <div />}

              <button onClick={markComplete} disabled={completing} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${completed ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} disabled:opacity-50`}>
                {completing ? '...' : completed ? '✓ Concluída' : nextLesson ? 'Concluir e seguir' : 'Concluir curso'}
              </button>

              {nextLesson ? (
                <Link href={`/learn/curso/${courseId}/aula/${nextLesson.modIdx}/${nextLesson.lesIdx}` as any} className="bg-white border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-lg text-sm text-slate-700 max-w-[45%] truncate">{nextLesson.title} →</Link>
              ) : <div />}
            </div>
          </div>

          {/* TUTOR DESKTOP */}
          <aside className="hidden lg:flex w-[360px] xl:w-[400px] flex-shrink-0 sticky top-20 self-start h-[calc(100vh-6rem)]">
            <div className="w-full rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <LessonTutor context={{
                course_title: course.title,
                course_level: course.level || undefined,
                module_title: mod.title,
                lesson_title: lesson.title,
                lesson_type: lesson.type,
                paragraphs: c.p,
                key_points: c.kp,
                code: c.code,
                tip: c.tip,
                language: locale,
              }} />
            </div>
          </aside>
        </div>
      </div>

      {/* TUTOR MOBILE: FAB + bottom sheet */}
      <button onClick={() => setTutorOpen(true)} aria-label="Abrir tutor AI"
        className="lg:hidden fixed bottom-5 right-5 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-white text-2xl shadow-lg active:scale-95 transition-transform">
        🧠
      </button>
      {tutorOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm flex items-end" onClick={() => setTutorOpen(false)}>
          <div className="bg-white w-full rounded-t-2xl shadow-2xl h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <LessonTutor context={{
              course_title: course.title,
              course_level: course.level || undefined,
              module_title: mod.title,
              lesson_title: lesson.title,
              lesson_type: lesson.type,
              paragraphs: c.p,
              key_points: c.kp,
              code: c.code,
              tip: c.tip,
              language: locale,
            }} onClose={() => setTutorOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
