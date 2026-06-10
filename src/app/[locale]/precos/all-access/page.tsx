import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { Sparkles, Check } from 'lucide-react';

export const metadata = { title: 'All-Access · NeuroLearn' };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: enabledD } = await sb.rpc('nl_monetization_get', { p_key: 'subscription_b2c_enabled' });
  const { data: monthlyD } = await sb.rpc('nl_monetization_get_numeric', { p_key: 'subscription_b2c_monthly_cents', p_default: 1990 });
  const { data: yearlyD } = await sb.rpc('nl_monetization_get_numeric', { p_key: 'subscription_b2c_yearly_cents', p_default: 19900 });
  const enabled = String(enabledD).toLowerCase() === 'true';
  const monthly = Number(monthlyD || 1990);
  const yearly = Number(yearlyD || 19900);
  const yearlyMonthlyEquiv = yearly / 12;
  const savePct = Math.round((1 - yearly/(monthly*12)) * 100);

  const FEATURE_KEYS = ['aa.f1','aa.f2','aa.f3','aa.f4','aa.f5','aa.f6','aa.f7','price.feat_support'];
  const FAQ_KEYS: [string, string][] = [
    ['aa.faq1_q','aa.faq1_a'],
    ['aa.faq2_q','aa.faq2_a'],
    ['aa.faq3_q','aa.faq3_a'],
    ['aa.faq4_q','aa.faq4_a'],
  ];

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <section className="bg-gradient-to-br from-violet-700 via-brand-700 to-indigo-700 text-white">
          <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">All-Access</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-4 tracking-tight">{t('aa.h1')}</h1>
            <p className="text-xl text-brand-100 max-w-2xl mx-auto">{t('aa.sub')}</p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {!enabled ? (
            <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <h2 className="font-bold text-slate-900 text-xl mb-2">{t('aa.soon_title')}</h2>
              <p className="text-sm text-slate-600 mb-4">{t('aa.soon_desc')}</p>
              <Link href={'/contacto' as any} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg">
                {t('aa.join_list')}
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              <PlanCard label={t('price.monthly')} price={monthly} period={t('aa.period_month')} cta={t('aa.cta_monthly')} locale={locale} />
              <PlanCard label={t('price.annual')} price={yearly} period={t('aa.period_year')} perMonth={yearlyMonthlyEquiv} savePct={savePct} cta={t('aa.cta_annual')} featured locale={locale} />
            </div>
          )}

          <section className="mt-12">
            <h2 className="font-bold text-slate-900 text-2xl mb-6 text-center">{t('aa.included_title')}</h2>
            <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {FEATURE_KEYS.map((fk) => (
                <div key={fk} className="flex items-start gap-2 bg-white border border-slate-200 rounded-lg p-3">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{t(fk)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 max-w-2xl mx-auto">
            <h2 className="font-bold text-slate-900 text-2xl mb-6 text-center">{t('aa.faq_title')}</h2>
            <div className="space-y-3">
              {FAQ_KEYS.map(([qk, ak]) => (
                <details key={qk} className="bg-white border border-slate-200 rounded-lg p-4">
                  <summary className="font-semibold text-slate-900 cursor-pointer">{t(qk)}</summary>
                  <p className="text-sm text-slate-600 mt-2">{t(ak)}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

async function PlanCard({ label, price, period, perMonth, savePct, cta, featured, locale }: any) {
  const t = await getTranslations();
  function fmt(c: number) { return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(c/100); }
  return (
    <div className={`bg-white rounded-2xl p-6 ${featured ? 'border-2 border-violet-500 ring-4 ring-violet-100' : 'border border-slate-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-slate-900 text-xl">{label}</h3>
        {savePct > 0 && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">{t('aa.save', { pct: savePct })}</span>}
      </div>
      <div className="mb-4">
        <span className="text-4xl font-bold text-slate-900">{fmt(price)}</span>
        <span className="text-slate-500 ml-1">/{period}</span>
        {perMonth && <div className="text-xs text-slate-500 mt-1">≈ {fmt(perMonth)}/{t('aa.period_month')}</div>}
      </div>
      <button disabled className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-brand-700 hover:opacity-90 text-white font-semibold rounded-lg opacity-60 cursor-not-allowed">
        {cta} {t('aa.soon')}
      </button>
      <p className="text-[10px] text-slate-400 mt-2 text-center">{t('aa.stripe_soon')}</p>
    </div>
  );
}
