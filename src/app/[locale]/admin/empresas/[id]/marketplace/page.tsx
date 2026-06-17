import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { MarketplaceClient } from './MarketplaceClient';

export const dynamic = 'force-dynamic';

export default async function OrgMarketplacePage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: org } = await sb.from('nl_organizations').select('id, name, slug').eq('id', id).maybeSingle();
  if (!org) notFound();
  const { data: courses } = await sb.rpc('nl_admin_org_marketplace_list', { p_org_id: id });
  const { data: catalog } = await sb.from('nl_courses').select('id, title, cover_url:hero_image_url, level').eq('published', true).order('title');

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="">
      <a href={`/${locale}/admin/empresas/${id}`}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {org.name}
      </a>
      <AdminPageHeader
        eyebrow={safeT('admin.marketplace.eyebrow', 'Empresa · Marketplace')}
        title={safeT('admin.marketplace.title', 'Catálogo de cursos para colaboradores')}
        description={safeT('admin.marketplace.description', 'Compra seats de cursos do marketplace para esta empresa. Os colaboradores podem inscrever-se enquanto houver lugares.')}
      />
      <MarketplaceClient orgId={id} initial={Array.isArray(courses) ? courses : []} catalog={Array.isArray(catalog) ? catalog : []} />
    </div>
  );
}
