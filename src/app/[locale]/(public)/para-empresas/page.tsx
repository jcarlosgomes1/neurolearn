import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Building2, Users, Shield, Sparkles, BarChart3, Headphones, Upload, Briefcase, Crown, Check, ArrowRight, Zap } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Para empresas · NeuroLearn' }; }

const FEATURES = [
  { icon: Upload, tKey: 'pe.feat.ingest_t', dKey: 'pe.feat.ingest_d', cls: 'from-violet-500 to-indigo-600' },
  { icon: Shield, tKey: 'pe.feat.whitelabel_t', dKey: 'pe.feat.whitelabel_d', cls: 'from-fuchsia-500 to-pink-600' },
  { icon: Users, tKey: 'pe.feat.multitenant_t', dKey: 'pe.feat.multitenant_d', cls: 'from-emerald-500 to-teal-600' },
  { icon: BarChart3, tKey: 'pe.feat.analytics_t', dKey: 'pe.feat.analytics_d', cls: 'from-amber-500 to-orange-600' },
  { icon: Briefcase, tKey: 'pe.feat.talent_t', dKey: 'pe.feat.talent_d', cls: 'from-rose-500 to-red-600' },
  { icon: Headphones, tKey: 'pe.feat.am_t', dKey: 'pe.feat.am_d', cls: 'from-blue-500 to-cyan-600' },
];

const STEPS = [
  { num: '1', tKey: 'pe.step1_t', dKey: 'pe.step1_d' },
  { num: '2', tKey: 'pe.step2_t', dKey: 'pe.step2_d' },
  { num: '3', tKey: 'pe.step3_t', dKey: 'pe.step3_d' },
];

const TIERS = [
  { name: 'Starter', price: '€8', periodKey: 'pe.period_seat', fKeys: ['pe.f.seats_50','pe.f.mkt_standard','pe.f.support_email','pe.f.sso_google_ms'], cls: 'from-slate-500 to-slate-700' },
  { name: 'Pro', price: '€15', periodKey: 'pe.period_seat', fKeys: ['pe.f.seats_500','pe.f.whitelabel_full','pe.f.scim','pe.f.courses_from_docs','pe.f.analytics_adv'], cls: 'from-violet-500 to-indigo-600', popular: true },
  { name: 'Enterprise', priceKey: 'pe.price_custom', periodKey: 'pe.period_contact', fKeys: ['pe.f.seats_unlimited','pe.f.am_dedicated','pe.f.sla','pe.f.gdpr_audited','pe.f.api_dedicated','pe.f.hris'], cls: 'from-amber-500 to-orange-600' },
] as Array<{ name: string; price?: string; priceKey?: string; periodKey: string; fKeys: string[]; cls: string; popular?: boolean }>;

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  return (
      <main className="bg-white min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-900 to-indigo-900 text-white">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-violet-200 mb-6 backdrop-blur-sm">
                <Building2 className="h-3.5 w-3.5" /> {t('pe.badge')}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                {t('pe.h1_pre')}<span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">{t('pe.h1_accent')}</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed">
                {t('pe.hero_desc')}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={{ pathname: '/contacto', query: { topic: 'sales', subject: 'Demo B2B', from: '/para-empresas' } } as any}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-violet-700 hover:bg-violet-50 hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
                  {t('pe.cta_demo')} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={'/precos' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl backdrop-blur-sm">
                  {t('pe.cta_pricing')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-8 border-b border-slate-200/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-3">{t('pe.trusted')}</p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-60 text-slate-700 font-bold text-lg">
              <span>● Healthcare Group</span><span>● TechCorp</span><span>● FinanceHub</span><span>● RetailChain</span><span>● ConsultingFirm</span>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">{t('pe.features_title')}</h2>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto">{t('pe.features_sub')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:-translate-y-1 hover:shadow-xl transition-all">
                <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${f.cls} text-white items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5">{t(f.tKey)}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t(f.dKey)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-20 border-y border-slate-200/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center mb-12">{t('pe.steps_title')}</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {STEPS.map((s) => (
                <div key={s.num} className="relative bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="absolute -top-4 -left-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-xl font-bold flex items-center justify-center shadow-lg">{s.num}</div>
                  <h3 className="font-bold text-slate-900 mt-3 mb-2">{t(s.tKey)}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{t(s.dKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">{t('pe.pricing_title')}</h2>
            <p className="mt-3 text-slate-600">{t('pe.pricing_sub')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {TIERS.map((tier, i) => (
              <div key={i} className={`relative bg-white rounded-3xl border-2 ${tier.popular ? 'border-violet-500 shadow-2xl scale-105' : 'border-slate-200'} p-6 sm:p-8`}>
                {tier.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow">{t('pe.popular')}</div>}
                <div className={`inline-flex h-10 w-10 rounded-xl bg-gradient-to-br ${tier.cls} text-white items-center justify-center mb-4`}>
                  {tier.popular ? <Crown className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                </div>
                <h3 className="font-bold text-xl text-slate-900">{tier.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">{tier.priceKey ? t(tier.priceKey) : tier.price}</span>
                  <span className="text-sm text-slate-500">{t(tier.periodKey)}</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {tier.fKeys.map((fk, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" /> {t(fk)}
                    </li>
                  ))}
                </ul>
                <Link href={{ pathname: '/contacto', query: { topic: 'sales', subject: `Plano ${tier.name}`, from: '/para-empresas' } } as any}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold ${tier.popular ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:shadow-lg' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'} transition-all`}>
                  {tier.name === 'Enterprise' ? t('pe.period_contact') : t('pe.cta_start')} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>

      </main>
  );
}
