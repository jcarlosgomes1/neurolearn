import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/shared/PageHero';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Trophy, Quote, TrendingUp, Briefcase, GraduationCap, Building2, ArrowRight, Sparkles } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'casos-de-sucesso', locale, { title: 'Casos de sucesso · NeuroLearn' });
}

interface Case { name: string; role: string; companyKey: string; quoteKey: string; outcomeKey: string; labelKey: string; icon: any; cls: string; }

const CASES: Case[] = [
  {
    name: 'Ricardo F.', role: 'Software Engineer', companyKey: 'cs.c1_company',
    quoteKey: 'cs.c1_quote', outcomeKey: 'cs.c1_outcome', labelKey: 'cs.c1_label',
    icon: Briefcase, cls: 'from-violet-500 to-indigo-600',
  },
  {
    name: 'Ana M.', role: 'UX Designer Senior', companyKey: 'cs.c2_company',
    quoteKey: 'cs.c2_quote', outcomeKey: 'cs.c2_outcome', labelKey: 'cs.c2_label',
    icon: TrendingUp, cls: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Marta C.', role: 'Talent Manager', companyKey: 'cs.c3_company',
    quoteKey: 'cs.c3_quote', outcomeKey: 'cs.c3_outcome', labelKey: 'cs.c3_label',
    icon: Building2, cls: 'from-amber-500 to-orange-600',
  },
  {
    name: 'João T.', role: 'Data Analyst', companyKey: 'cs.c4_company',
    quoteKey: 'cs.c4_quote', outcomeKey: 'cs.c4_outcome', labelKey: 'cs.c4_label',
    icon: GraduationCap, cls: 'from-rose-500 to-pink-600',
  },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  return (
      <main className="bg-white min-h-screen">
        {/* Hero */}
        <PageHero
          icon={Trophy} badge={t('cs.badge')}
          title={t('cs.h1_pre')}
          titleAccent={t('cs.h1_accent')}
          subtitle={t('cs.hero_desc')}
        />

        {/* Cases */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-6">
          {CASES.map((c, i) => (
            <article key={i} className="group bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 hover:shadow-2xl hover:-translate-y-1 transition-all overflow-hidden relative">
              <div className={`absolute top-0 right-0 h-64 w-64 rounded-full bg-gradient-to-br ${c.cls} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity`} />
              <div className="relative grid sm:grid-cols-3 gap-6">
                <div className="sm:col-span-2 space-y-4">
                  <Quote className={`h-8 w-8 bg-gradient-to-br ${c.cls} text-white p-1.5 rounded-lg`} />
                  <blockquote className="text-lg sm:text-xl text-slate-800 leading-relaxed italic">
                    "{t(c.quoteKey)}"
                  </blockquote>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-sm text-slate-600">{c.role}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t(c.companyKey)}</div>
                  </div>
                </div>
                <div className="sm:border-l sm:border-slate-100 sm:pl-6 flex flex-col justify-center items-center sm:items-start">
                  <div className={`inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br ${c.cls} text-white items-center justify-center mb-3 shadow-lg`}>
                    <c.icon className="h-7 w-7" />
                  </div>
                  <div className={`text-3xl sm:text-4xl font-bold bg-gradient-to-br ${c.cls} bg-clip-text text-transparent`}>
                    {t(c.outcomeKey)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-medium">{t(c.labelKey)}</div>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-10 sm:p-14 shadow-2xl text-center text-white">
            <Sparkles className="h-8 w-8 mx-auto mb-4 opacity-70" />
            <h2 className="t-h2">{t('cs.cta_title')}</h2>
            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">{t('cs.cta_desc')}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={'/cursos' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 hover:bg-emerald-50 hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
                {t('common.explore_courses')} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={'/register' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl backdrop-blur-sm">
                {t('ps.cta_create')}
              </Link>
            </div>
          </div>
        </section>

      </main>
  );
}
