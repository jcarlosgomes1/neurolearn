import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOrgDetailsAction } from '../../actions';
import { getTranslations } from 'next-intl/server';
import { IntelligenceClient } from './IntelligenceClient';

export const metadata = { title: 'Inteligência · Empresa · Admin' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect(`/${locale}`);

  const r = await getOrgDetailsAction(id);
  if (!r.ok) notFound();
  const t = await getTranslations();

  return (
    <div>
      <AdminPageHeader
        backHref={`/admin/empresas/${id}`}
        backLabel="Voltar"
        title={`${r.org.name} · ${t('org_intel.title')}`}
        description={`/empresa/${r.org.slug}`}
      />
      <IntelligenceClient orgId={id} />
    </div>
  );
}
