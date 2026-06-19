import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/shared/PageHero';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Compass, Briefcase, Award, Brain, Zap, Sparkles, ArrowRight, Target, BookMarked, MessageCircle } from 'lucide-react';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'para-estudantes', locale, { title: 'Para estudantes · NeuroLearn' });
}

const FEATURES = [
  { icon: Compass, tKey: 'ps.feat.guided_t', dKey: 'ps.feat.guided_d', cls: 'from-blue-500 to-cyan-600' },
  { icon: Brain, tKey: 'ps.feat.tutor_t', dKey: 'ps.feat.tutor_d', cls: 'from-violet-500 to-indigo-600' },
  { icon: Award, tKey: 'ps.feat.certs_t', dKey: 'ps.feat.certs_d', cls: 'from-amber-500 to-orange-600' },
  { icon: Briefcase, tKey: 'ps.feat.jobs_t', dKey: 'ps.feat.jobs_d', cls: 'from-emerald-500 to-teal-600' },
  { icon: Target, tKey: 'ps.feat.projects_t', dKey: 'ps.feat.projects_d', cls: 'from-rose-500 to-red-600' },
  { icon: MessageCircle, tKey: 'ps.feat.community_t', dKey: 'ps.feat.community_d', cls: 'from-fuchsia-500 to-pink-600' },
];

const PATHS = [
  { tKey: 'ps.path.beginner_t', dKey: 'ps.path.beginner_d', icon: '🌱', cls: 'from-emerald-500 to-teal-600' },
  { tKey: 'ps.path.transition_t', dKey: 'ps.path.transition_d', icon: '🔄', cls: 'from-violet-500 to-indigo-600' },
  { tKey: 'ps.path.expert_t', dKey: 'ps.path.expert_d', icon: '🎯', cls: 'from-amber-500 to-orange-600' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  return (
      <main className="bg-white min-h-screen">
        <PageHero
          badge={<><Compass className="h-3.5 w-3.5" /> {t('ps.badge')}</>}
          title={t('ps.h1_pre')}
          titleAccent={t('ps.h1_accent')}
          subtitle={t('ps.hero_desc')}
        >
          <Link href={'/register' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white hover:bg-brand-700 hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
            {t('ps.cta_start')} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href={'/cursos' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-brand-50 border border-slate-300 text-slate-700 font-bold rounded-xl">
            {t('ps.cta_catalog')}
          </Link>
        </PageHero>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="t-h2 text-slate-900">{t('ps.features_title')}</h2>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto">{t('ps.features_sub')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:-translate-y-1 hover:shadow-xl transition-all">
                <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${f.cls} text-white items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="t-h3 text-slate-900 mb-1.5">{t(f.tKey)}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t(f.dKey)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-20 border-y border-slate-200/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="t-h2 text-slate-900 text-center mb-12">{t('ps.paths_title')}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {PATHS.map((p, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="text-4xl mb-3">{p.icon}</div>
                  <h3 className={`t-h3 bg-gradient-to-br ${p.cls} bg-clip-text text-transparent`}>{t(p.tKey)}</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{t(p.dKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 p-10 sm:p-14 shadow-2xl text-center text-white">
            <Sparkles className="h-8 w-8 mx-auto mb-4 opacity-70" />
            <h2 className="t-h2">{t('ps.cta_title')}</h2>
            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">{t('ps.cta_desc')}</p>
            <Link href={'/register' as any} className="inline-flex items-center gap-2 px-8 py-3.5 mt-8 bg-white text-blue-700 hover:bg-blue-50 hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
              {t('ps.cta_create')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>
  );
}
