import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/shared/PageHero';
import { PageWidth } from '@/components/shared/PageWidth';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Compass, Briefcase, Award, Brain, Sparkles, ArrowRight, Target, MessageCircle } from 'lucide-react';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'para-estudantes', locale, { title: 'Para estudantes · NeuroLearn' });
}

const FEATURES = [
  { icon: Compass, tKey: 'ps.feat.guided_t', dKey: 'ps.feat.guided_d', fam: 'denim' },
  { icon: Brain, tKey: 'ps.feat.tutor_t', dKey: 'ps.feat.tutor_d', fam: 'plum' },
  { icon: Award, tKey: 'ps.feat.certs_t', dKey: 'ps.feat.certs_d', fam: 'saffron' },
  { icon: Briefcase, tKey: 'ps.feat.jobs_t', dKey: 'ps.feat.jobs_d', fam: 'sage' },
  { icon: Target, tKey: 'ps.feat.projects_t', dKey: 'ps.feat.projects_d', fam: 'terra' },
  { icon: MessageCircle, tKey: 'ps.feat.community_t', dKey: 'ps.feat.community_d', fam: 'teal' },
];

const PATHS = [
  { tKey: 'ps.path.beginner_t', dKey: 'ps.path.beginner_d', icon: '🌱', fam: 'sage' },
  { tKey: 'ps.path.transition_t', dKey: 'ps.path.transition_d', icon: '🔄', fam: 'denim' },
  { tKey: 'ps.path.expert_t', dKey: 'ps.path.expert_d', icon: '🎯', fam: 'terra' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <PageHero
        icon={Compass}
        badge={t('ps.badge')}
        title={t('ps.h1_pre')}
        titleAccent={t('ps.h1_accent')}
        subtitle={t('ps.hero_desc')}
      >
        <Link href={'/register' as any} className="inline-flex items-center gap-2 px-6 py-3 text-white hover:scale-105 transition-all font-bold rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>
          {t('ps.cta_start')} <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href={'/cursos' as any} className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl" style={{ border: '1px solid var(--line)', color: 'var(--ink)', background: 'var(--card)' }}>
          {t('ps.cta_catalog')}
        </Link>
      </PageHero>

      <PageWidth py="py-20">
        <div className="text-center mb-12">
          <h2 className="t-h2" style={{ color: 'var(--ink)' }}>{t('ps.features_title')}</h2>
          <p className="mt-3 max-w-2xl mx-auto" style={{ color: 'var(--ink-2)' }}>{t('ps.features_sub')}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="group rounded-2xl p-6 transition-all hover:-translate-y-1" style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--nl-surface-shadow)' }}>
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
          <h2 className="t-h2 text-center mb-12" style={{ color: 'var(--ink)' }}>{t('ps.paths_title')}</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {PATHS.map((p, i) => (
              <div key={i} className="rounded-2xl p-6 transition-all hover:-translate-y-1" style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--nl-surface-shadow)' }}>
                <div className="text-4xl mb-3">{p.icon}</div>
                <h3 className="t-h3" style={{ color: `var(--${p.fam}-deep)` }}>{t(p.tKey)}</h3>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--ink-2)' }}>{t(p.dKey)}</p>
              </div>
            ))}
          </div>
        </PageWidth>
      </section>

      <PageWidth py="py-20">
        <div className="relative overflow-hidden rounded-3xl p-10 sm:p-14 shadow-2xl text-center text-white" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>
          <Sparkles className="h-8 w-8 mx-auto mb-4 opacity-70" />
          <h2 className="t-h2">{t('ps.cta_title')}</h2>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">{t('ps.cta_desc')}</p>
          <Link href={'/register' as any} className="inline-flex items-center gap-2 px-8 py-3.5 mt-8 bg-white hover:scale-105 transition-all font-bold rounded-xl shadow-lg" style={{ color: 'var(--accent)' }}>
            {t('ps.cta_create')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PageWidth>
    </main>
  );
}
