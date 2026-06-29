import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { PageHero } from '@/components/shared/PageHero';
import { PageWidth } from '@/components/shared/PageWidth';
import { Sparkles, Target, Heart, Globe2, Zap, ArrowRight } from 'lucide-react';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'sobre', locale, { title: 'Sobre · NeuroLearn' });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);

  const VALUES = [
    { icon: Heart, titleKey: 'so.v1_t', descKey: 'so.v1_d', fam: 'plum' },
    { icon: Zap, titleKey: 'so.v2_t', descKey: 'so.v2_d', fam: 'saffron' },
    { icon: Globe2, titleKey: 'so.v3_t', descKey: 'so.v3_d', fam: 'sage' },
    { icon: Target, titleKey: 'so.v4_t', descKey: 'so.v4_d', fam: 'denim' },
  ];

  const STATS = [
    { value: '4', labelKey: 'so.s1_label', subKey: 'so.s1_sub' },
    { value: '24/7', labelKey: 'so.s2_label', subKey: 'so.s2_sub' },
    { value: '100%', labelKey: 'so.s3_label', subKey: 'so.s3_sub' },
    { value: '0€', labelKey: 'so.s4_label', subKey: 'so.s4_sub' },
  ];

  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <PageHero
        icon={Sparkles} badge={t('so.badge')}
        title={t('so.h1_pre')}
        titleAccent={t('so.h1_accent')}
        subtitle={t('so.hero_desc')}
      />

      {/* Story */}
      <section className="mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20" style={{ maxWidth: '48rem' }}>
        <h2 className="t-h2 mb-6" style={{ color: 'var(--ink)' }}>{t('so.story_title')}</h2>
        <div className="space-y-4 text-lg leading-relaxed" style={{ color: 'var(--ink-2)' }}>
          <p>{t('so.story_p1')}</p>
          <p>{t('so.story_p2')}</p>
          <p>{t('so.story_p3')}</p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20 border-y" style={{ background: 'color-mix(in srgb, var(--paper) 60%, var(--card))', borderColor: 'var(--line)' }}>
        <PageWidth>
          <div className="text-center mb-12">
            <h2 className="t-h2" style={{ color: 'var(--ink)' }}>{t('so.values_title')}</h2>
            <p className="mt-3 max-w-2xl mx-auto" style={{ color: 'var(--ink-2)' }}>{t('so.values_sub')}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {VALUES.map((v, i) => (
              <div key={i} className="group rounded-2xl p-6 hover:-translate-y-1 transition-all" style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--nl-surface-shadow)' }}>
                <div className="inline-flex h-12 w-12 rounded-xl text-white items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(135deg, var(--${v.fam}-base), var(--${v.fam}-deep))` }}>
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="t-h3 mb-2" style={{ color: 'var(--ink)' }}>{t(v.titleKey)}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>{t(v.descKey)}</p>
              </div>
            ))}
          </div>
        </PageWidth>
      </section>

      {/* Stats */}
      <PageWidth py="py-16 sm:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-5xl sm:text-6xl font-bold" style={{ color: 'var(--accent)' }}>{s.value}</div>
              <div className="mt-2 font-semibold" style={{ color: 'var(--ink)' }}>{t(s.labelKey)}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--ink-3)' }}>{t(s.subKey)}</div>
            </div>
          ))}
        </div>
      </PageWidth>

      {/* CTA */}
      <PageWidth className="pb-20">
        <div className="relative overflow-hidden rounded-3xl p-10 sm:p-14 shadow-2xl" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>
          <div className="absolute inset-0 -z-10">
            <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          </div>
          <div className="relative text-center text-white">
            <h2 className="t-h2">{t('so.cta_title')}</h2>
            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">{t('so.cta_desc')}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={'/cursos' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:scale-105 transition-all font-bold rounded-xl shadow-lg" style={{ color: 'var(--accent)' }}>
                {t('common.explore_courses')} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={'/para-empresas' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl backdrop-blur-sm">
                {t('so.cta_b2b')}
              </Link>
            </div>
          </div>
        </div>
      </PageWidth>
    </main>
  );
}
