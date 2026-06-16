import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { redirect } from 'next/navigation';
import { CourseTermsClient } from './CourseTermsClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/course-terms');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/');

  return (
    <div>
      <AdminPageHeader
        emoji="📋"
        eyebrow="Pessoas · Contratação"
        title="Termos por curso"
        description="Escolhe quais cláusulas se aplicam a cada curso e adiciona cláusulas específicas. As cláusulas base aplicam-se sempre."
        iconGradient="from-violet-500 to-indigo-600"
        related={[{ href: '/admin/instructor-terms', label: 'Biblioteca de cláusulas', emoji: '📜' }]}
      />
      <CourseTermsClient />
    </div>
  );
}
