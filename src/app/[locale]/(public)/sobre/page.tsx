import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Sparkles, Target, Heart, Globe2, Zap, ArrowRight, Users, BookOpen, Briefcase, Trophy } from 'lucide-react';

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
    { icon: Heart, titleKey: 'so.v1_t', descKey: 'so.v1_d', cls: 'from-rose-500 to-pink-600' },
    { icon: Zap, titleKey: 'so.v2_t', descKey: 'so.v2_d', cls: 'from-amber-500 to-orange-600' },
    { icon: Globe2, titleKey: 'so.v3_t', descKey: 'so.v3_d', cls: 'from-emerald-500 to-teal-600' },
    { icon: Target, titleKey: 'so.v4_t', descKey: 'so.v4_d', cls: 'from-violet-500 to-indigo-600' },
  ];

  const STATS = [
    { value: '4', labelKey: 'so.s1_label', subKey: 'so.s1_sub' },
    { value: '24/7', labelKey: 'so.s2_label', subKey: 'so.s2_sub' },
    { value: '100%', labelKey: 'so.s3_label', subKey: 'so.s3_sub' },
    { value: '0€', labelKey: 'so.s4_label', subKey: 'so.s4_sub' },
  ];

  return (
      <main className="bg-white min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-violet-200 text-xs font-semibold text-violet-700 mb-6 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> {t('so.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              {t('so.h1_pre')}<span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">{t('so.h1_accent')}</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {t('so.hero_desc')}
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">{t('so.story_title')}</h2>
          <div className="prose prose-slate prose-lg max-w-none space-y-4 text-slate-700 leading-relaxed">
            <p>{t('so.story_p1')}</p>
            <p>{t('so.story_p2')}</p>
            <p>{t('so.story_p3')}</p>
          </div>
        </section>

        {/* Values */}
        <section className="bg-slate-50 py-16 sm:py-20 border-y border-slate-200/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">{t('so.values_title')}</h2>
              <p className="mt-3 text-slate-600 max-w-2xl mx-auto">{t('so.values_sub')}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {VALUES.map((v, i) => (
                <div key={i} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:-translate-y-1 hover:shadow-xl transition-all">
                  <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${v.cls} text-white items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                    <v.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{t(v.titleKey)}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{t(v.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl sm:text-6xl font-bold bg-gradient-to-br from-violet-600 to-indigo-600 bg-clip-text text-transparent">{s.value}</div>
                <div className="mt-2 font-semibold text-slate-900">{t(s.labelKey)}</div>
                <div className="text-xs text-slate-500 mt-1">{t(s.subKey)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-10 sm:p-14 shadow-2xl">
            <div className="absolute inset-0 -z-10">
              <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            </div>
            <div className="relative text-center text-white">
              <h2 className="text-3xl sm:text-4xl font-bold">{t('so.cta_title')}</h2>
              <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">{t('so.cta_desc')}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href={'/cursos' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-violet-700 hover:bg-violet-50 hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
                  {t('common.explore_courses')} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={'/para-empresas' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl backdrop-blur-sm">
                  {t('so.cta_b2b')}
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
  );
}
