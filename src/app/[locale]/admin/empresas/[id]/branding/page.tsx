import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BrandingClient } from './BrandingClient';

export const dynamic = 'force-dynamic';

export default async function OrgBrandingPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: org } = await sb.from('nl_organizations').select('id, name, slug').eq('id', id).maybeSingle();
  if (!org) notFound();
  const { data: branding } = await sb.rpc('nl_admin_org_branding_get', { p_org_id: id });

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="">
      <Link
        href={{ pathname: '/admin/empresas/[id]', params: { id } } as any}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {org.name}
      </Link>
      <AdminPageHeader
        eyebrow={safeT('admin.branding.eyebrow', 'Empresa · Branding')}
        title={safeT('admin.branding.title', 'Identidade visual')}
        description={safeT('admin.branding.description', 'Logo, cores, domínio próprio e remetente de email para esta empresa.')}
      />
      <BrandingClient orgId={id} orgName={org.name} initial={(branding as any) || {}} savedLabel={safeT('admin.branding.saved', 'Branding guardado')} />
    </div>
  );
}
