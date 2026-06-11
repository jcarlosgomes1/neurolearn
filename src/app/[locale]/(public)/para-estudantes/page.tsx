import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Compass, Briefcase, Award, Brain, Zap, Sparkles, ArrowRight, Target, BookMarked, MessageCircle } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Para estudantes · NeuroLearn' }; }

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
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-blue-200 text-xs font-semibold text-blue-700 mb-6 shadow-sm">
              <Compass className="h-3.5 w-3.5" /> {t('ps.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              {t('ps.h1_pre')}<span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{t('ps.h1_accent')}</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {t('ps.hero_desc')}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={'/register' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-600 to-cyan-600 text-white hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
                {t('ps.cta_start')} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={'/cursos' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all font-bold rounded-xl shadow-sm">
                {t('ps.cta_catalog')}
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">{t('ps.features_title')}</h2>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto">{t('ps.features_sub')}</p>
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
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center mb-12">{t('ps.paths_title')}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {PATHS.map((p, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="text-4xl mb-3">{p.icon}</div>
                  <h3 className={`font-bold text-lg bg-gradient-to-br ${p.cls} bg-clip-text text-transparent`}>{t(p.tKey)}</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{t(p.dKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 p-10 sm:p-14 shadow-2xl text-center text-white">
            <Sparkles className="h-8 w-8 mx-auto mb-4 opacity-70" />
            <h2 className="text-3xl sm:text-4xl font-bold">{t('ps.cta_title')}</h2>
            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">{t('ps.cta_desc')}</p>
            <Link href={'/register' as any} className="inline-flex items-center gap-2 px-8 py-3.5 mt-8 bg-white text-blue-700 hover:bg-blue-50 hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
              {t('ps.cta_create')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>
  );
}
