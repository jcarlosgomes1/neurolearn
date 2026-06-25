import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { instructorB2BEarningsAction } from '../../empresa/[slug]/marketplace-actions';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, Building2 } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

export const metadata = { title: 'B2B Earnings · Teach' };
export const dynamic = 'force-dynamic';

function fmt(cents: number, locale: string, currency = 'EUR') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: ins } = await sb.from('nl_instructors').select('id, status').eq('id', user.id).maybeSingle();
  if (!ins || ins.status !== 'approved') redirect(`/${locale}`);
  
  const r = await instructorB2BEarningsAction();
  const subs = r.ok ? r.subscriptions : [];
  const total = r.ok ? r.total_b2b_earnings_cents : 0;
  const active = r.ok ? r.active_subscriptions : 0;
  
  return (
    <div className="px-4 sm:px-6 py-6 ">
      <Link href={'/teach' as any} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> {t('btn.back')}
      </Link>
      <AppPageHeader title={t('tea.b2b_h1')} />
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider">{t('tea.b2b_total')}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(total, locale)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider">{t('tea.b2b_active')}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{active}</div>
        </div>
      </div>
      
      {subs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">{t('tea.b2b_empty_h')}</h3>
          <p className="text-sm text-slate-500">{t('tea.b2b_empty_p')}</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase">{t('tea.b2b_col_course')}</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase">{t('tea.b2b_col_company')}</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase">{t('tea.b2b_col_model')}</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs uppercase">{t('tea.b2b_col_earning')}</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase">{t('tea.b2b_col_status')}</th>
            </tr></thead>
            <tbody>{subs.map((s: any) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{s.course_title}</td>
                <td className="px-4 py-3 text-slate-600">{s.org_name}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{s.pricing_model}</td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmt(s.instructor_payout_cents, locale, s.currency)}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{s.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
