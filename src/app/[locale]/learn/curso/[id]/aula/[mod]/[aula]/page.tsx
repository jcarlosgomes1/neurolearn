import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LessonViewer } from './LessonViewer';
import { LessonExtrasMount } from '@/components/lesson/LessonExtrasMount';

export const metadata = { title: 'Aula' };

export default async function Page({ params }: { params: Promise<{ id: string; mod: string; aula: string; locale: string }> }) {
  const { id, mod, aula, locale } = await params;
  const modIdx = parseInt(mod, 10);
  const aulaIdx = parseInt(aula, 10);
  if (isNaN(modIdx) || isNaN(aulaIdx)) redirect(`/${locale}/learn`);

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?redirect_to=/learn/curso/${id}/aula/${mod}/${aula}`);

  const { data: course } = await sb.from('nl_courses')
    .select('id, title, subtitle, emoji, level, modules, published')
    .eq('id', id).maybeSingle();
  if (!course || !course.published) redirect(`/${locale}/learn`);

  const { data: enrollment } = await sb.from('nl_enrollments_v2')
    .select('id').eq('user_id', user.id).eq('course_id', id).maybeSingle();
  if (!enrollment) redirect(`/${locale}/curso/${id}`);

  // Extrair dados da lição actual para os panels extras
  const modules = Array.isArray(course.modules) ? course.modules : [];
  const lessonRaw = modules?.[modIdx]?.lessons?.[aulaIdx] || {};
  const lessonTitle: string = lessonRaw?.title || `Aula ${aulaIdx + 1}`;
  const lessonContent: string = [
    lessonRaw?.content?.p?.join('\n\n'),
    Array.isArray(lessonRaw?.content?.kp) ? lessonRaw.content.kp.join('\n') : null,
    lessonRaw?.content?.tip,
  ].filter(Boolean).join('\n\n');
  // Quiz pode estar em lessonRaw.quiz ou lessonRaw.content.quiz
  const quiz = lessonRaw?.quiz || lessonRaw?.content?.quiz || null;

  return (
    <>
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
      />
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
    </>
  );
}
