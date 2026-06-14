import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Rota "retomar onde parei": resolve a próxima aula incompleta e redireciona.
export default async function ContinuarPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?redirect_to=/learn/curso/${id}/continuar`);

  const { data: course } = await sb.from('nl_courses').select('modules, published').eq('id', id).maybeSingle();
  if (!course || !course.published) redirect(`/${locale}/learn`);

  const { data: enrollment } = await sb.from('nl_enrollments_v2').select('id').eq('user_id', user.id).eq('course_id', id).maybeSingle();
  if (!enrollment) redirect(`/${locale}/curso/${id}`);

  const modules: Array<{ lessons?: unknown[] }> = Array.isArray(course.modules) ? course.modules : [];
  const { data: progress } = await sb.from('nl_lesson_progress')
    .select('module_index, lesson_index, completed')
    .eq('user_id', user.id).eq('course_id', id);

  const done = new Set((progress || []).filter((p) => p.completed).map((p) => `${p.module_index}_${p.lesson_index}`));

  // primeira aula não concluída, em ordem
  let target = { m: 0, l: 0 };
  let found = false;
  for (let m = 0; m < modules.length && !found; m++) {
    const lessons = modules[m]?.lessons || [];
    for (let l = 0; l < lessons.length; l++) {
      if (!done.has(`${m}_${l}`)) { target = { m, l }; found = true; break; }
    }
  }
  // se tudo concluído, volta ao início (revisão)
  redirect(`/${locale}/learn/curso/${id}/aula/${target.m}/${target.l}`);
}
