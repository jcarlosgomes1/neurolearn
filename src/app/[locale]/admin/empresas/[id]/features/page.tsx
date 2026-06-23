import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { OrgFeaturesClient } from './OrgFeaturesClient';

export const dynamic = 'force-dynamic';

export default async function OrgFeaturesPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: org } = await sb.from('nl_organizations').select('id, slug, name, plan').eq('id', id).maybeSingle();
  if (!org) notFound();
  const { data: features } = await sb.rpc('nl_admin_org_features_get', { p_org_id: id });

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <a href={`/${locale}/admin/empresas/${id}`}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {org.name}
      </a>
      <AdminPageHeader
        eyebrow={safeT('admin.org_features.eyebrow', 'Empresa · Funcionalidades')}
        title={safeT('admin.org_features.title', 'Configuração de funcionalidades')}
        description={safeT('admin.org_features.description', 'Ativa ou desativa funcionalidades específicas para esta empresa e define limites do plano.')}
      />
      <OrgFeaturesClient
        orgId={id}
        orgName={org.name}
        orgPlan={org.plan || 'trial'}
        initial={(features as any) || {}}
      />
    </div>
  );
}
