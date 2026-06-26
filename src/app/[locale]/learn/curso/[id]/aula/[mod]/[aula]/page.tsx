import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { LessonViewer } from './LessonViewer';
import { LessonErrorBoundary } from '@/components/shared/LessonErrorBoundary';
import { LessonExtrasMount } from '@/components/lesson/LessonExtrasMount';
import { LessonResourcesList } from '@/components/lesson/LessonResourcesList';

export const metadata = { title: 'Aula' };

export default async function Page({ params }: { params: Promise<{ id: string; mod: string; aula: string; locale: string }> }) {
  const { id, mod, aula, locale } = await params;
  const modIdx = parseInt(mod, 10);
  const aulaIdx = parseInt(aula, 10);
  if (isNaN(modIdx) || isNaN(aulaIdx)) redirect(`/${locale}/learn`);

  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?redirect_to=/learn/curso/${id}/aula/${mod}/${aula}`);

  const { data: course } = await sb.from('nl_courses')
    .select('id, title, subtitle, emoji, level, modules, published, progression')
    .eq('id', id).maybeSingle();
  if (!course || !course.published) redirect(`/${locale}/learn`);

  const { data: enrollment } = await sb.from('nl_enrollments_v2')
    .select('id').eq('user_id', user.id).eq('course_id', id).maybeSingle();
  if (!enrollment) redirect(`/${locale}/curso/${id}`);

  // i18n: servir título/subtítulo/módulos na língua escolhida (fallback à origem)
  try {
    const { data: i18n } = await sb.rpc('nl_course_i18n', { p_id: id, p_lang: locale });
    if (i18n) {
      if (i18n.title) course.title = i18n.title;
      if (i18n.subtitle) course.subtitle = i18n.subtitle;
      if (Array.isArray(i18n.modules)) course.modules = i18n.modules;
    }
  } catch {
    // fallback: conteúdo de origem
  }

  const modules = Array.isArray(course.modules) ? course.modules : [];

  // Progressão sequencial (gating): impede aceder por URL a aulas ainda trancadas.
  const { data: progRows } = await sb.from('nl_lesson_progress')
    .select('module_index, lesson_index, completed')
    .eq('user_id', user.id).eq('course_id', id);
  const done = new Set((progRows || []).filter((r) => r.completed).map((r) => `${r.module_index}_${r.lesson_index}`));
  const { data: progSetting } = await sb.from('nl_agent_settings')
    .select('value').eq('key', 'course_progression').maybeSingle();
  const globalMode = progSetting?.value === 'free' ? 'free' : 'sequential';
  const effectiveMode = course.progression && course.progression !== 'inherit' ? course.progression : globalMode;
  if (effectiveMode === 'sequential') {
    const linear: Array<{ m: number; l: number }> = [];
    modules.forEach((mm: any, mi: number) => (Array.isArray(mm?.lessons) ? mm.lessons : []).forEach((_: any, li: number) => linear.push({ m: mi, l: li })));
    const isDone = (p: { m: number; l: number }) => done.has(`${p.m}_${p.l}`);
    const reqPos = linear.findIndex((p) => p.m === modIdx && p.l === aulaIdx);
    const unlocked = reqPos < 0 || done.has(`${modIdx}_${aulaIdx}`) || linear.slice(0, reqPos).every(isDone);
    if (!unlocked) {
      const firstIncomplete = linear.find((p) => !isDone(p));
      if (firstIncomplete) redirect(`/${locale}/learn/curso/${id}/aula/${firstIncomplete.m}/${firstIncomplete.l}`);
    }
  }

  // Extrair dados da lição actual para os panels extras
  const lessonRaw = modules?.[modIdx]?.lessons?.[aulaIdx] || {};
  const lessonTitle: string = lessonRaw?.title || `Aula ${aulaIdx + 1}`;
  const lessonContent: string = [
    lessonRaw?.content?.p?.join('\n\n'),
    Array.isArray(lessonRaw?.content?.kp) ? lessonRaw.content.kp.join('\n') : null,
    lessonRaw?.content?.tip,
  ].filter(Boolean).join('\n\n');
  const quiz = lessonRaw?.quiz || lessonRaw?.content?.quiz || null;

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <LessonErrorBoundary locale={locale}>
      <LessonViewer
        courseId={id}
        course={{
          id: course.id,
          title: course.title,
          subtitle: course.subtitle,
          emoji: course.emoji,
          level: course.level,
          modules: modules,
        }}
        moduleIndex={modIdx}
        lessonIndex={aulaIdx}
        locale={locale}
        progressionMode={effectiveMode}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <LessonResourcesList
          courseId={id}
          moduleIndex={modIdx}
          lessonIndex={aulaIdx}
          titleLabel={safeT('lesson.resources.title', 'Recursos da lição')}
          emptyLabel={safeT('lesson.resources.empty', 'Sem recursos para esta lição.')}
        />
      </div>
      <LessonExtrasMount
        courseId={id}
        courseTitle={course.title}
        moduleIndex={modIdx}
        lessonIndex={aulaIdx}
        lessonId={lessonRaw?.id}
        lessonTitle={lessonTitle}
        lessonContent={lessonContent}
        quiz={quiz}
      />
    </LessonErrorBoundary>
  );
}
