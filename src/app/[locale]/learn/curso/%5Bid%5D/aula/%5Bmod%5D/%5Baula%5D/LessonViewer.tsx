'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { toast } from 'sonner';
import { LessonTutor } from '@/components/lesson/LessonTutor';
import { LessonNotesPanel } from '@/components/lesson/LessonNotesPanel';
import { MermaidRender } from '@/components/shared/MermaidRender';
import { CoverImage } from '@/components/shared/CoverImage';
import { VideoEmbed } from '@/components/shared/VideoEmbed';
import { ReviewSystem } from '@/components/course/ReviewSystem';

interface Lesson {
  id?: string;
  title: string;
  type?: string;
  duration_minutes?: number;
  video_url?: string | null;
  stream_url?: string | null;
  content?: {
    p?: string[];
    kp?: string[];
    code?: string | null;
    tip?: string | null;
    q?: { q: string; o: string[]; c: number; e?: string } | null;
    hero_image_url?: string | null;
    diagram?: string | null;
  };
}

interface Module { id?: string; title: string; description?: string; lessons: Lesson[] }
interface Course { id: string; title: string; subtitle: string | null; emoji: string | null; level: string | null; modules: Module[] }

export function LessonViewer({ courseId, course, moduleIndex, lessonIndex, locale }: { courseId: string; course: Course; moduleIndex: number; lessonIndex: number; locale: string }) {
  const t = useTranslations('lesson_viewer');
  const router = useRouter();
  const [tutorOpen, setTutorOpen] = useState(false);
  const [quizPick, setQuizPick] = useState<number | null>(null);
  const [quizReveal, setQuizReveal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState<boolean | null>(null);

  const TYPE_META: Record<string, { emoji: string; label: string; color: string }> = {
    video: { emoji: '🎬', label: t('type.video'), color: 'text-rose-700 bg-rose-50' },
    exercise: { emoji: '✍️', label: t('type.exercise'), color: 'text-purple-700 bg-purple-50' },
    reading: { emoji: '📖', label: t('type.reading'), color: 'text-brand-700 bg-brand-50' },
    live: { emoji: '🔴', label: t('type.live'), color: 'text-emerald-700 bg-emerald-50' },
  };

  const mod = course.modules[moduleIndex];
  const lesson = mod?.lessons[lessonIndex];

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
        <p className="text-slate-700 font-medium">{t('not_found')}</p>
        <Link href={'/learn' as any} className="btn-primary mt-6 inline-flex">{t('my_courses')}</Link>
      </div>
    );
  }

  const prevLesson = lessonIndex > 0
    ? { modIdx: moduleIndex, lesIdx: lessonIndex - 1, title: mod.lessons[lessonIndex - 1].title }
    : moduleIndex > 0
      ? { modIdx: moduleIndex - 1, lesIdx: course.modules[moduleIndex - 1].lessons.length - 1, title: course.modules[moduleIndex - 1].lessons.slice(-1)[0]?.title || t('fallback_prev_title') }
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
      toast.success(t('completed_toast'));
      if (nextLesson) setTimeout(() => router.push(`/learn/curso/${courseId}/aula/${nextLesson.modIdx}/${nextLesson.lesIdx}` as any), 800);
      else { toast.success(t('course_done')); setTimeout(() => router.push('/learn' as any), 1500); }
    } catch (e: any) { toast.error(e.message); } finally { setCompleting(false); }
  }

  const c = lesson.content || {};
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const overallIdx = course.modules.slice(0, moduleIndex).reduce((s, m) => s + m.lessons.length, 0) + lessonIndex + 1;
  const progressPct = Math.round((overallIdx / totalLessons) * 100);
  const typeMeta = TYPE_META[lesson.type || 'reading'] || TYPE_META.reading;
  const isLive = !!lesson.stream_url;
  const hasVideo = !!(lesson.video_url || lesson.stream_url);

  const tutorContext = {
    course_id: courseId,
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
  };

  return (
    <>
      <div className="sticky top-16 z-20 bg-white/85 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3">
          <Link href={'/learn' as any} className="text-xs text-slate-500 hover:text-slate-900 flex-shrink-0">{t('my_courses')}</Link>
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-xs text-slate-500 tabular-nums flex-shrink-0">{overallIdx}/{totalLessons}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex gap-6 lg:gap-8">
          <div className="flex-1 min-w-0 max-w-3xl mx-auto lg:mx-0">
            <header className="mb-6">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider flex items-center gap-2 flex-wrap">
                <span>{course.emoji} {course.title}</span>
                <span>›</span>
                <span className="text-slate-500">{mod.title}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mt-2 leading-[1.15] tracking-tight text-balance">{lesson.title}</h1>
              <div className="mt-4 flex items-center gap-2 flex-wrap text-sm">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeMeta.color}`}>{typeMeta.emoji} {typeMeta.label}</span>
                {lesson.duration_minutes && <span className="text-slate-500">⏱ {t('minutes', { n: lesson.duration_minutes })}</span>}
                {completed && <span className="text-emerald-600 font-medium">{t('completed')}</span>}
                {isLive && <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-medium animate-pulse">{t('live_badge')}</span>}
              </div>
            </header>

            {hasVideo ? (
              <div className="mb-8">
                <VideoEmbed url={(lesson.stream_url || lesson.video_url)!} title={lesson.title} />
                {isLive && <p className="mt-2 text-xs text-slate-500 text-center">{t('live_note')}</p>}
              </div>
            ) : c.hero_image_url ? (
              <div className="mb-8 rounded-2xl overflow-hidden shadow-sm">
                <CoverImage
                  src={c.hero_image_url}
                  alt={lesson.title}
                  seed={`${courseId}-${moduleIndex}-${lessonIndex}`}
                  emoji={typeMeta.emoji}
                  category={typeMeta.label}
                  aspectRatio="21/9"
                  priority
                />
              </div>
            ) : null}

            {!c.p?.length && !hasVideo ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-slate-700 font-medium">{t('empty_title')}</p>
                <p className="text-sm text-slate-500 mt-1">{t('empty_sub')}</p>
              </div>
            ) : (
              <article className="space-y-10">
                {c.p && c.p.length > 0 && (
                  <div className="prose prose-slate prose-lg max-w-none">
                    {c.p.map((p, i) => (
                      <p key={i} className="text-slate-700 leading-[1.8] text-[1.0625rem]">{p}</p>
                    ))}
                  </div>
                )}

                {c.diagram && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                      <span className="w-6 h-px bg-slate-300" /> {t('diagram_label')} <span className="flex-1 h-px bg-slate-100" />
                    </h3>
                    <MermaidRender code={c.diagram} />
                  </section>
                )}

                {c.kp && c.kp.length > 0 && (
                  <section className="bg-gradient-to-br from-brand-50 to-purple-50 border border-brand-100 rounded-2xl p-6 sm:p-7">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-brand-700 mb-4 flex items-center gap-2">
                      {t('key_points')}
                    </h3>
                    <ul className="space-y-3">
                      {c.kp.map((k, i) => (
                        <li key={i} className="flex gap-3 text-slate-800 leading-relaxed">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                          <span>{k}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {c.code && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                      <span className="w-6 h-px bg-slate-300" /> {t('code_label')} <span className="flex-1 h-px bg-slate-100" />
                    </h3>
                    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg">
                      <div className="bg-slate-800 px-4 py-2 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <pre className="text-slate-100 p-4 sm:p-5 text-xs sm:text-sm overflow-x-auto"><code>{c.code}</code></pre>
                    </div>
                  </section>
                )}

                {c.tip && (
                  <section className="border-l-4 border-amber-400 bg-amber-50/50 pl-5 pr-4 py-4 rounded-r-lg">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-amber-800 mb-1">{t('tip_label')}</h3>
                    <p className="text-slate-700 italic">{c.tip}</p>
                  </section>
                )}

                {c.q?.q && c.q.o && (
                  <section className="bg-white border-2 border-purple-200 rounded-2xl p-6 sm:p-7">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-purple-700">{t('quiz_header')}</span>
                    </div>
                    <p className="text-lg font-semibold text-slate-900 mb-5">{c.q.q}</p>
                    <div className="space-y-2.5">
                      {c.q.o.map((opt, i) => {
                        const isPicked = quizPick === i;
                        const isCorrect = quizReveal && i === c.q!.c;
                        const isWrongPick = quizReveal && isPicked && i !== c.q!.c;
                        return (
                          <button key={i} disabled={quizReveal} onClick={() => setQuizPick(i)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm border-2 transition-all ${
                              isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
                              isWrongPick ? 'bg-rose-50 border-rose-300 text-rose-900' :
                              isPicked ? 'bg-purple-50 border-purple-400 text-purple-900' :
                              'bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50/30'}`}>
                            <span className="inline-flex w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold items-center justify-center mr-3">{String.fromCharCode(65 + i)}</span>
                            {isCorrect && '✓ '}{isWrongPick && '✗ '}{opt}
                          </button>
                        );
                      })}
                    </div>
                    {!quizReveal ? (
                      <button onClick={() => setQuizReveal(true)} disabled={quizPick === null} className="mt-5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow">{t('quiz_confirm')}</button>
                    ) : c.q.e && (
                      <div className="mt-5 bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('quiz_explanation')}</p>
                        <p className="text-sm text-slate-700">{c.q.e}</p>
                      </div>
                    )}
                  </section>
                )}
              </article>
            )}

            <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              {prevLesson ? (
                <Link href={`/learn/curso/${courseId}/aula/${prevLesson.modIdx}/${prevLesson.lesIdx}` as any} className="group flex items-center gap-2 max-w-[45%]">
                  <span className="text-slate-400 group-hover:text-brand-600 transition-colors text-lg flex-shrink-0">←</span>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{t('previous')}</div>
                    <div className="text-sm text-slate-700 group-hover:text-brand-700 truncate font-medium">{prevLesson.title}</div>
                  </div>
                </Link>
              ) : <div />}

              <button onClick={markComplete} disabled={completing} className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm ${completed ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'} disabled:opacity-50`}>
                {completing ? '...' : completed ? t('completed') : nextLesson ? t('complete_next') : t('complete_course')}
              </button>

              {nextLesson ? (
                <Link href={`/learn/curso/${courseId}/aula/${nextLesson.modIdx}/${nextLesson.lesIdx}` as any} className="group flex items-center gap-2 max-w-[45%] text-right">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{t('next')}</div>
                    <div className="text-sm text-slate-700 group-hover:text-brand-700 truncate font-medium">{nextLesson.title}</div>
                  </div>
                  <span className="text-slate-400 group-hover:text-brand-600 transition-colors text-lg flex-shrink-0">→</span>
                </Link>
              ) : <div />}
            </div>

            {!nextLesson && <ReviewSystem courseId={courseId} courseTitle={course.title} />}
          </div>

          <aside className="hidden lg:flex w-[360px] xl:w-[400px] flex-shrink-0 sticky top-28 self-start h-[calc(100vh-8rem)]">
            <div className="w-full rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white">
              <LessonTutor context={tutorContext} />
            </div>
          </aside>
        </div>
      </div>

      <button onClick={() => setTutorOpen(true)} aria-label={t('open_tutor_aria')}
        className="lg:hidden fixed bottom-5 right-5 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-white text-2xl shadow-lg active:scale-95 transition-transform">
        🧠
      </button>
      {tutorOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm flex items-end" onClick={() => setTutorOpen(false)}>
          <div className="bg-white w-full rounded-t-2xl shadow-2xl h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <LessonTutor context={tutorContext} onClose={() => setTutorOpen(false)} />
          </div>
        </div>
      )}

      {/* Notes + Highlights panel (floating button bottom-left) */}
      <LessonNotesPanel courseId={courseId} moduleIndex={moduleIndex} lessonIndex={lessonIndex} />
    </>
  );
}
