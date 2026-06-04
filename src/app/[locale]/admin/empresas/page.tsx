import { redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Companies' };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/admin/empresas`);
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect(`/${locale}`);

  const { data: orgs } = await sb.from('nl_organizations')
    .select('id, name, slug, plan, seats_purchased, seats_used, country_code, created_at, archived, trial_ends_at, logo_url')
    .eq('archived', false)
    .order('created_at', { ascending: false });

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('admin.companies.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('admin.companies.subtitle')}</p>
      </div>

      {(!orgs || orgs.length === 0) ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-3">🏢</div>
          <p className="text-slate-600">{t('admin.companies.empty')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wider">{t('admin.companies.col.name')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wider">{t('admin.companies.col.plan')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wider">{t('admin.companies.col.seats')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wider">{t('admin.companies.col.created')}</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => {
                  const isTrialing = o.plan === 'trial' && o.trial_ends_at && new Date(o.trial_ends_at) > new Date();
                  const planBadge = o.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                                    o.plan === 'growth' ? 'bg-blue-100 text-blue-700' :
                                    o.plan === 'starter' ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-amber-100 text-amber-700';
                  return (
                    <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/empresa/${o.slug}` as any} className="flex items-center gap-3 group">
                          {o.logo_url ? (
                            <img src={o.logo_url} alt={o.name} className="h-9 w-9 rounded-lg object-cover" />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm">
                              {o.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-slate-900 group-hover:text-brand-700">{o.name}</div>
                            <div className="text-xs text-slate-400">/{o.slug} · {o.country_code || '—'}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${planBadge}`}>
                          {o.plan}
                        </span>
                        {isTrialing && <span className="ml-2 text-[10px] text-amber-600 uppercase tracking-wider">trial</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {o.seats_used} / {o.seats_purchased || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(o.created_at).toLocaleDateString(locale)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
