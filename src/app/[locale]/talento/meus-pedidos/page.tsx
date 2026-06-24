import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { myPlacementsAction } from '../../empresa/[slug]/talent-actions';
import { getTranslations } from 'next-intl/server';
import { Briefcase } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

export const metadata = { title: 'Os Meus Pedidos · Talent' };
export const dynamic = 'force-dynamic';

const STAGE_LABELS: Record<string, { labelKey: string; color: string }> = {
  introduced: { labelKey: 'tal.stage_introduced', color: 'bg-blue-100 text-blue-800' },
  interested: { labelKey: 'tal.stage_interested', color: 'bg-violet-100 text-violet-800' },
  interviewed: { labelKey: 'tal.stage_interviewed', color: 'bg-violet-100 text-violet-800' },
  offered: { labelKey: 'tal.stage_offered', color: 'bg-amber-100 text-amber-800' },
  hired: { labelKey: 'tal.stage_hired', color: 'bg-emerald-100 text-emerald-800' },
  rejected: { labelKey: 'tal.stage_rejected', color: 'bg-rose-100 text-rose-700' },
};

function fmt(cents?: number | null) {
  if (!cents) return '';
  return '€' + (cents / 100).toLocaleString();
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const r = await myPlacementsAction();
  const placements = r.ok ? r.placements : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AppPageHeader
        backHref="/talento"
        backLabel={t('tal.back_profile')}
        title={t('tal.requests_h')}
        description={t('tal.requests_sub')}
      />
      {placements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">{t('tal.requests_empty_h')}</h3>
          <p className="text-sm text-slate-500">{t('tal.requests_empty_p')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {placements.map((p: any) => {
            const stage = STAGE_LABELS[p.pipeline_status] || STAGE_LABELS.introduced;
            return (
              <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <div className="flex items-center gap-3">
                    {p.org_logo ? (
                      <img src={p.org_logo} alt={p.org_name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center font-bold">
                        {p.org_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-slate-900">{p.org_name}</div>
                      {p.job_title && <div className="text-xs text-slate-500">{p.job_title}</div>}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stage.color}`}>{t(stage.labelKey)}</span>
                </div>
                {p.annual_salary_cents && p.pipeline_status === 'hired' && (
                  <div className="text-sm font-semibold text-emerald-700 mt-2">
                    {t('tal.salary_year', { amount: fmt(p.annual_salary_cents) })}
                  </div>
                )}
                <div className="text-xs text-slate-400 mt-2">{new Date(p.created_at).toLocaleDateString(locale)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
