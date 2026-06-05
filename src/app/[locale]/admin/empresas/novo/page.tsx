import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NovaEmpresaWizard } from './NovaEmpresaWizard';

export const metadata = { title: 'Criar Empresa · Admin' };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect(`/${locale}`);
  
  return <NovaEmpresaWizard locale={locale} />;
}
