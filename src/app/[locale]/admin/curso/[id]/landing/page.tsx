import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { notFound, redirect } from 'next/navigation';
import { LandingEditorClient } from '../../../cursos/[id]/landing/LandingEditorClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect(`/${locale}`);

  let result: any;
  try {
    const { data } = await sb.rpc('nl_admin_course_landing_get', { p_course_id: id });
    result = data;
  } catch { notFound(); }
  if (!result?.course) notFound();

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        eyebrow={safeT('admin.course_landing.eyebrow', 'Curso · Landing page')}
        title={safeT('admin.course_landing.title', 'Landing page do curso')}
        description={safeT('admin.course_landing.description', 'Personaliza hero, bullets, testemunhos e FAQ.')}
      />
      <LandingEditorClient courseId={id} courseTitle={result.course.title} initial={result.landing || {}} />
    </div>
  );
}
