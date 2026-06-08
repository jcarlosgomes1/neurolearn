import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { MarketplaceClient } from './MarketplaceClient';

export const dynamic = 'force-dynamic';

export default async function OrgMarketplacePage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: org } = await sb.from('nl_organizations').select('id, name, slug').eq('id', id).maybeSingle();
  if (!org) notFound();
  const { data: courses } = await sb.rpc('nl_admin_org_marketplace_list', { p_org_id: id });
  const { data: catalog } = await sb.from('nl_courses').select('id, title, cover_url, level').eq('status', 'published').order('title');

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={{ pathname: '/admin/empresas/[id]', params: { id } } as any}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {org.name}
      </Link>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <ShoppingBag className="h-3.5 w-3.5" /> {safeT('admin.marketplace.eyebrow', 'Empresa · Marketplace')}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{safeT('admin.marketplace.title', 'Catálogo de cursos para colaboradores')}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-3xl leading-relaxed">
          {safeT('admin.marketplace.description', 'Compra seats de cursos do marketplace para esta empresa. Os colaboradores podem inscrever-se enquanto houver lugares.')}
        </p>
      </header>
      <MarketplaceClient orgId={id} initial={Array.isArray(courses) ? courses : []} catalog={Array.isArray(catalog) ? catalog : []} />
    </div>
  );
}
