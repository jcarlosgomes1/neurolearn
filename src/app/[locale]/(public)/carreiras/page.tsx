import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/shared/PageHero';
import { PageWidth } from '@/components/shared/PageWidth';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Briefcase, Heart, Zap, Globe2, Coffee, ArrowRight, Code, Palette, BarChart3, Users } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'carreiras', locale, { title: 'Carreiras · NeuroLearn' });
}

const VALUES = [
  { icon: Zap, tKey: 'ca.v1_t', dKey: 'ca.v1_d', fam: 'saffron' },
  { icon: Heart, tKey: 'ca.v2_t', dKey: 'ca.v2_d', fam: 'plum' },
  { icon: Globe2, tKey: 'ca.v3_t', dKey: 'ca.v3_d', fam: 'sage' },
  { icon: Coffee, tKey: 'ca.v4_t', dKey: 'ca.v4_d', fam: 'denim' },
];

const ROLES = [
  { icon: Code, title: 'Engineering', area: 'Backend, Frontend, ML', level: 'Mid · Senior', fam: 'denim' },
  { icon: Palette, title: 'Design', area: 'Product Design, UX Research', level: 'Mid', fam: 'plum' },
  { icon: BarChart3, title: 'Growth', area: 'Performance, Content, SEO', level: 'Mid · Senior', fam: 'saffron' },
  { icon: Users, title: 'Customer Success', area: 'B2B Enterprise, B2C', level: 'Junior · Mid', fam: 'sage' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <PageHero
        icon={Briefcase} badge={t('ca.badge')}
        title={t('ca.h1_pre')}
        titleAccent={t('ca.h1_accent')}
        subtitle={t('ca.hero_desc')}
      />

      <PageWidth py="py-20">
        <h2 className="t-h2 text-center mb-12" style={{ color: 'var(--ink)' }}>{t('ca.values_title')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VALUES.map((v, i) => (
            <div key={i} className="rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all" style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--nl-surface-shadow)' }}>
              <div className="inline-flex h-12 w-12 rounded-xl text-white items-center justify-center mb-3 shadow-md" style={{ background: `linear-gradient(135deg, var(--${v.fam}-base), var(--${v.fam}-deep))` }}>
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="t-h3 mb-1" style={{ color: 'var(--ink)' }}>{t(v.tKey)}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>{t(v.dKey)}</p>
            </div>
          ))}
        </div>
      </PageWidth>

      <section className="py-20 border-y" style={{ background: 'color-mix(in srgb, var(--paper) 60%, var(--card))', borderColor: 'var(--line)' }}>
        <PageWidth>
          <h2 className="t-h2 text-center mb-3" style={{ color: 'var(--ink)' }}>{t('ca.roles_title')}</h2>
          <p className="text-center mb-12" style={{ color: 'var(--ink-2)' }}>{t('ca.roles_sub')}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {ROLES.map((r, i) => (
              <Link key={i}
                href={{ pathname: '/contacto', query: { topic: 'careers', subject: `Candidatura · ${r.title}`, from: '/carreiras' } } as any}
                className="group rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-4" style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--nl-surface-shadow)' }}>
                <div className="flex-shrink-0 inline-flex h-14 w-14 rounded-2xl text-white items-center justify-center shadow-md group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(135deg, var(--${r.fam}-base), var(--${r.fam}-deep))` }}>
                  <r.icon className="h-7 w-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold" style={{ color: 'var(--ink)' }}>{r.title}</div>
                  <div className="text-sm" style={{ color: 'var(--ink-2)' }}>{r.area}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>{r.level} · {t('ca.remote')}</div>
                </div>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-all" style={{ color: 'var(--ink-3)' }} />
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href={{ pathname: '/contacto', query: { topic: 'careers', subject: 'Candidatura espontânea', from: '/carreiras' } } as any}
              className="inline-flex items-center gap-2 px-6 py-3 text-white hover:scale-105 transition-all font-bold rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>
              {t('ca.spontaneous_cta')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </PageWidth>
      </section>
    </main>
  );
}
