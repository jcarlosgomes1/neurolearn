import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { ArrowLeft, Settings2 } from 'lucide-react';
import { OrgFeaturesClient } from './OrgFeaturesClient';

export const dynamic = 'force-dynamic';

export default async function OrgFeaturesPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={{ pathname: '/admin/empresas/[id]', params: { id } } as any}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {org.name}
      </Link>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-violet-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Settings2 className="h-3.5 w-3.5" /> {safeT('admin.org_features.eyebrow', 'Empresa · Funcionalidades')}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{safeT('admin.org_features.title', 'Configuração de funcionalidades')}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          {safeT('admin.org_features.description', 'Ativa ou desativa funcionalidades específicas para esta empresa e define limites do plano.')}
        </p>
      </header>
      <OrgFeaturesClient
        orgId={id}
        orgName={org.name}
        orgPlan={org.plan || 'trial'}
        initial={(features as any) || {}}
      />
    </div>
  );
}
