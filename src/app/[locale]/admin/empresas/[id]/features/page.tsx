import { createClient } from '@/lib/supabase/server';
import { redirect, Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { FeaturesClient } from './FeaturesClient';
import { ArrowLeft, Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrgFeaturesPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const sb = await createClient();

  const { data: org } = await sb.from('nl_organizations').select('id, name, slug, plan').eq('id', id).maybeSingle();
  if (!org) notFound();

  const { data: features } = await sb.rpc('nl_admin_org_features_get', { p_org_id: id });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={{ pathname: '/admin/empresas/[id]', params: { id } } as any}
        className="group inline-flex items-center gap-1.5 mb-6 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Voltar a {org.name}
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Building2 className="h-3.5 w-3.5" /> {org.plan || 'Plan'}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{org.name} · Funcionalidades</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
          Configura que módulos esta organização pode usar. Aplicam-se ao workspace e ao acesso dos seus admins.
        </p>
      </div>

      <FeaturesClient orgId={id} initial={(features as any) || {}} />
    </div>
  );
}
