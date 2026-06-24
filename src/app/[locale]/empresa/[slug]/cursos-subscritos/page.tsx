import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { listOrgSubscriptionsAction } from '../marketplace-actions';
import { CursosSubscritosClient } from './CursosSubscritosClient';

export const metadata = { title: 'Cursos Subscritos · Empresa' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: org } = await sb.from('nl_organizations').select('id, name, slug').eq('slug', slug).maybeSingle();
  if (!org) notFound();
  const { data: member } = await sb.from('nl_org_members').select('role').eq('org_id', org.id).eq('user_id', user.id).maybeSingle();
  if (!member) redirect(`/${locale}/empresa/${slug}`);
  const { data: members } = await sb.from('nl_org_members')
    .select('user_id, nl_profiles!inner(name, avatar_url)').eq('org_id', org.id);
  
  const r = await listOrgSubscriptionsAction(org.id);
  return (
    <>
      <CursosSubscritosClient orgId={org.id} orgSlug={slug} memberRole={member.role}
        members={(members || []).map((m: any) => ({ user_id: m.user_id, name: m.nl_profiles?.name, avatar_url: m.nl_profiles?.avatar_url }))}
        locale={locale} subscriptions={r.ok ? r.subscriptions : []} />
    </>
  );
}
