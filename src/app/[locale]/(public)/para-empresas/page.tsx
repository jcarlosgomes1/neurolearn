import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { PageHero } from '@/components/shared/PageHero';
import { PageWidth } from '@/components/shared/PageWidth';
import { Building2, Users, Shield, BarChart3, Headphones, Upload, Briefcase, Crown, Check, ArrowRight, Zap } from 'lucide-react';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'para-empresas', locale, { title: 'Para empresas · NeuroLearn' });
}

const FEATURES = [
  { icon: Upload, tKey: 'pe.feat.ingest_t', dKey: 'pe.feat.ingest_d', fam: 'denim' },
  { icon: Shield, tKey: 'pe.feat.whitelabel_t', dKey: 'pe.feat.whitelabel_d', fam: 'plum' },
  { icon: Users, tKey: 'pe.feat.multitenant_t', dKey: 'pe.feat.multitenant_d', fam: 'sage' },
  { icon: BarChart3, tKey: 'pe.feat.analytics_t', dKey: 'pe.feat.analytics_d', fam: 'saffron' },
  { icon: Briefcase, tKey: 'pe.feat.talent_t', dKey: 'pe.feat.talent_d', fam: 'terra' },
  { icon: Headphones, tKey: 'pe.feat.am_t', dKey: 'pe.feat.am_d', fam: 'teal' },
];

const STEPS = [
  { num: '1', tKey: 'pe.step1_t', dKey: 'pe.step1_d' },
  { num: '2', tKey: 'pe.step2_t', dKey: 'pe.step2_d' },
  { num: '3', tKey: 'pe.step3_t', dKey: 'pe.step3_d' },
];

const TIERS = [
  { name: 'Starter', price: '€8', periodKey: 'pe.period_seat', fKeys: ['pe.f.seats_50','pe.f.mkt_standard','pe.f.support_email','pe.f.sso_google_ms'] },
  { name: 'Pro', price: '€15', periodKey: 'pe.period_seat', fKeys: ['pe.f.seats_500','pe.f.whitelabel_full','pe.f.scim','pe.f.courses_from_docs','pe.f.analytics_adv'], popular: true },
  { name: 'Enterprise', priceKey: 'pe.price_custom', periodKey: 'pe.period_contact', fKeys: ['pe.f.seats_unlimited','pe.f.am_dedicated','pe.f.sla','pe.f.gdpr_audited','pe.f.api_dedicated','pe.f.hris'] },
] as Array<{ name: string; price?: string; priceKey?: string; periodKey: string; fKeys: string[]; popular?: boolean }>;

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <PageHero
        icon={Building2 as any}
        badge={t('pe.badge')}
        title={t('pe.h1_pre')}
        titleAccent={t('pe.h1_accent')}
        subtitle={t('pe.hero_desc')}
      >
        <Link href={{ pathname: '/contacto', query: { topic: 'sales', subject: 'Demo B2B', from: '/para-empresas' } } as any}
          className="inline-flex items-center gap-2 px-6 py-3 text-white hover:scale-105 transition-all font-bold rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>
          {t('pe.cta_demo')} <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href={'/precos' as any} className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl" style={{ border: '1px solid var(--line)', color: 'var(--ink)', background: 'var(--card)' }}>
          {t('pe.cta_pricing')}
        </Link>
      </PageHero>

      <section className="py-8 border-b" style={{ background: 'color-mix(in srgb, var(--paper) 60%, var(--card))', borderColor: 'var(--line)' }}>
        <PageWidth className="text-center">
          <p className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--ink-3)' }}>{t('pe.trusted')}</p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 font-bold text-lg" style={{ color: 'var(--ink-2)', opacity: 0.7 }}>
            <span>● Healthcare Group</span><span>● TechCorp</span><span>● FinanceHub</span><span>● RetailChain</span><span>● ConsultingFirm</span>
          </div>
        </PageWidth>
      </section>

      <PageWidth py="py-20">
        <div className="text-center mb-12">
          <h2 className="t-h2" style={{ color: 'var(--ink)' }}>{t('pe.features_title')}</h2>
          <p className="mt-3 max-w-2xl mx-auto" style={{ color: 'var(--ink-2)' }}>{t('pe.features_sub')}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="group rounded-2xl p-6 hover:-translate-y-1 transition-all" style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--nl-surface-shadow)' }}>
              <div className="inline-flex h-12 w-12 rounded-xl text-white items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(135deg, var(--${f.fam}-base), var(--${f.fam}-deep))` }}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="t-h3 mb-1.5" style={{ color: 'var(--ink)' }}>{t(f.tKey)}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>{t(f.dKey)}</p>
            </div>
          ))}
        </div>
      </PageWidth>

      <section className="py-20 border-y" style={{ background: 'color-mix(in srgb, var(--paper) 60%, var(--card))', borderColor: 'var(--line)' }}>
        <PageWidth>
          <h2 className="t-h2 text-center mb-12" style={{ color: 'var(--ink)' }}>{t('pe.steps_title')}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.num} className="relative rounded-2xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--nl-surface-shadow)' }}>
                <div className="absolute -top-4 -left-4 h-12 w-12 rounded-2xl text-white text-xl font-bold flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>{s.num}</div>
                <h3 className="t-h3 mt-3 mb-2" style={{ color: 'var(--ink)' }}>{t(s.tKey)}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>{t(s.dKey)}</p>
              </div>
            ))}
          </div>
        </PageWidth>
      </section>

      <PageWidth py="py-20">
        <div className="text-center mb-12">
          <h2 className="t-h2" style={{ color: 'var(--ink)' }}>{t('pe.pricing_title')}</h2>
          <p className="mt-3" style={{ color: 'var(--ink-2)' }}>{t('pe.pricing_sub')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {TIERS.map((tier, i) => (
            <div key={i} className="relative rounded-3xl p-6 sm:p-8" style={tier.popular
              ? { background: 'var(--card)', border: '2px solid var(--accent)', boxShadow: 'var(--nl-surface-shadow)', transform: 'scale(1.05)' }
              : { background: 'var(--card)', border: '1px solid var(--line)' }}>
              {tier.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-white text-xs font-bold rounded-full shadow" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>{t('pe.popular')}</div>}
              <div className="inline-flex h-10 w-10 rounded-xl text-white items-center justify-center mb-4" style={{ background: tier.popular ? 'linear-gradient(135deg, var(--accent), var(--accent-bright))' : 'linear-gradient(135deg, var(--denim-base), var(--denim-deep))' }}>
                {tier.popular ? <Crown className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
              </div>
              <h3 className="t-h3" style={{ color: 'var(--ink)' }}>{tier.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold" style={{ color: 'var(--ink)' }}>{tier.priceKey ? t(tier.priceKey) : tier.price}</span>
                <span className="text-sm" style={{ color: 'var(--ink-3)' }}>{t(tier.periodKey)}</span>
              </div>
              <ul className="mt-6 space-y-2.5">
                {tier.fKeys.map((fk, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-sm" style={{ color: 'var(--ink-2)' }}>
                    <Check className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--sage-deep)' }} /> {t(fk)}
                  </li>
                ))}
              </ul>
              <Link href={{ pathname: '/contacto', query: { topic: 'sales', subject: `Plano ${tier.name}`, from: '/para-empresas' } } as any}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all hover:brightness-110"
                style={tier.popular
                  ? { background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))', color: '#fff' }
                  : { background: 'var(--accent-tint)', color: 'var(--accent)' }}>
                {tier.name === 'Enterprise' ? t('pe.period_contact') : t('pe.cta_start')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </PageWidth>
    </main>
  );
}
