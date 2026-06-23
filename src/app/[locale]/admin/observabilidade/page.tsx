import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { ObservabilidadeClient } from './ObservabilidadeClient';

export const dynamic = 'force-dynamic';

export default async function ObservabilityPage({ searchParams }: { searchParams: Promise<{ since?: string }> }) {
  const sp = await searchParams;
  const hours = parseInt(sp?.since || '24', 10) || 24;
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/observabilidade');
  const { data: isAdmin } = await sb.rpc('nl_is_platform_admin');
  if (!isAdmin) redirect('/');

  const sinceIso = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const [{ data: aiStats }, { data: aiRecent }, { data: kpis }, { data: seo }] = await Promise.all([
    sb.rpc('nl_admin_ai_calls_stats', { p_since: sinceIso }),
    sb.rpc('nl_admin_ai_calls_recent', { p_limit: 50, p_status: null }),
    sb.rpc('nl_admin_kpi_snapshots_recent', { p_days: 30 }),
    sb.rpc('nl_admin_seo_audits_summary'),
  ]);

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  const seoSummary = Array.isArray(seo) && seo.length > 0 ? seo[0] : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="📈"
        eyebrow={safeT('admin.observability.eyebrow', 'Admin · Observabilidade')}
        title={safeT('admin.observability.title', 'Observabilidade da plataforma')}
        description={safeT('admin.observability.description', 'Custos automatizados, KPIs diários e qualidade SEO. Tudo num só sítio.')}
      />
      <ObservabilidadeClient
        hours={hours}
        aiStats={Array.isArray(aiStats) ? aiStats : []}
        aiRecent={Array.isArray(aiRecent) ? aiRecent : []}
        kpis={Array.isArray(kpis) ? kpis : []}
        seoSummary={seoSummary}
      />
    </div>
  );
}
