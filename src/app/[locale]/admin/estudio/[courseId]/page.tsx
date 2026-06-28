import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StudioWorkspace } from './StudioWorkspace';

export const metadata = { title: 'Estúdio · Curso' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; courseId: string }> }) {
  const { locale, courseId } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect(`/${locale}`);

  const { data: course } = await sb.from('nl_courses').select('id, title').eq('id', courseId).maybeSingle();
  if (!course) notFound();

  return <StudioWorkspace courseId={courseId} courseTitle={course.title} />;
}
