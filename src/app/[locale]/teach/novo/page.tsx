import { CreateCourseForm } from './CreateCourseForm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';

export const metadata = { title: 'Criar curso — NeuroLearn' };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login', locale });
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user!.id).single();
  const role = profile?.role;
  if (!role || !['admin', 'super_admin', 'instructor'].includes(role)) {
    redirect({ href: '/teach', locale });
  }
  return (
    <>

        <CreateCourseForm />
      
    </>
  );
}
