import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { listInquiriesForOrgAction } from '../corporate-actions';
import { PedidosOrgClient } from './PedidosOrgClient';

export const metadata = { title: 'Pedidos · Empresa' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/empresa/${slug}/pedidos`);
  const { data: org } = await sb.from('nl_organizations').select('id, name, slug').eq('slug', slug).maybeSingle();
  if (!org) notFound();
  const { data: member } = await sb.from('nl_org_members').select('role').eq('org_id', org.id).eq('user_id', user.id).maybeSingle();
  if (!member) redirect(`/${locale}/empresa/${slug}`);
  
  const r = await listInquiriesForOrgAction(org.id);
  return (
    <>
      <PedidosOrgClient orgId={org.id} orgName={org.name} orgSlug={slug} memberRole={member.role}
        locale={locale} inquiries={r.ok ? r.inquiries : []} />
    </>
  );
}
