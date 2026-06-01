import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LessonViewer } from './LessonViewer';

export const metadata = { title: 'Aula' };

export default async function Page({ params }: { params: Promise<{ id: string; mod: string; aula: string; locale: string }> }) {
  const { id, mod, aula, locale } = await params;
  const modIdx = parseInt(mod, 10);
  const aulaIdx = parseInt(aula, 10);
  if (isNaN(modIdx) || isNaN(aulaIdx)) redirect(`/${locale}/learn`);

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?redirect_to=/learn/curso/${id}/aula/${mod}/${aula}`);

  const { data: course } = await sb.from('nl_courses').select('id, title, subtitle, emoji, level, modules, published').eq('id', id).maybeSingle();
  if (!course || !course.published) redirect(`/${locale}/learn`);

  const { data: enrollment } = await sb.from('nl_enrollments_v2').select('id').eq('user_id', user.id).eq('course_id', id).maybeSingle();
  if (!enrollment) redirect(`/${locale}/curso/${id}`);

  return (
    <>

        <LessonViewer
          courseId={id}
          course={{ id: course.id, title: course.title, subtitle: course.subtitle, emoji: course.emoji, level: course.level, modules: course.modules || [] }}
          moduleIndex={modIdx}
          lessonIndex={aulaIdx}
          locale={locale}
        />
      
    </>
  );
}
