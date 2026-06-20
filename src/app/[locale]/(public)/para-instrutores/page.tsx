import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/shared/PageHero';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { GraduationCap, DollarSign, Globe2, Sparkles, Users, BarChart3, ArrowRight, Check, X, Briefcase } from 'lucide-react';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'para-instrutores', locale, { title: 'Para instrutores · NeuroLearn' });
}

const STATS = [
  { value: '70%', lKey: 'pi.stat1_label' },
  { value: '4', lKey: 'pi.stat2_label' },
  { value: '€0', lKey: 'pi.stat3_label' },
  { value: '24h', lKey: 'pi.stat4_label' },
];

const FEATURES = [
  { icon: DollarSign, tKey: 'pi.feat.revshare_t', dKey: 'pi.feat.revshare_d', cls: 'from-emerald-500 to-teal-600' },
  { icon: Globe2, tKey: 'pi.feat.translate_t', dKey: 'pi.feat.translate_d', cls: 'from-violet-500 to-indigo-600' },
  { icon: Sparkles, tKey: 'pi.feat.gen_t', dKey: 'pi.feat.gen_d', cls: 'from-fuchsia-500 to-pink-600' },
  { icon: BarChart3, tKey: 'pi.feat.analytics_t', dKey: 'pi.feat.analytics_d', cls: 'from-amber-500 to-orange-600' },
  { icon: Briefcase, tKey: 'pi.feat.talent_t', dKey: 'pi.feat.talent_d', cls: 'from-rose-500 to-red-600' },
  { icon: Users, tKey: 'pi.feat.marketing_t', dKey: 'pi.feat.marketing_d', cls: 'from-blue-500 to-cyan-600' },
];

const COMPARE = [
  { fKey: 'pi.cmp.revshare', neuro: 'pi.cmp.v_70', udemy: 'pi.cmp.v_3797', coursera: 'pi.cmp.v_50', teachable: 'pi.cmp.v_90fixa' },
  { fKey: 'pi.cmp.translate', neuro: 'pi.cmp.v_4idiomas', udemy: 'pi.no', coursera: 'pi.cmp.v_limitada', teachable: 'pi.no' },
  { fKey: 'pi.cmp.gen', neuro: 'pi.yes', udemy: 'pi.no', coursera: 'pi.no', teachable: 'pi.no' },
  { fKey: 'pi.cmp.talent', neuro: 'pi.cmp.v_royalties', udemy: 'pi.no', coursera: 'pi.no', teachable: 'pi.no' },
  { fKey: 'pi.cmp.nofees', neuro: 'pi.yes', udemy: 'pi.yes', coursera: 'pi.yes', teachable: 'pi.cmp.v_mensal' },
  { fKey: 'pi.cmp.payments', neuro: 'pi.cmp.v_24h', udemy: 'pi.cmp.v_30d', coursera: 'pi.cmp.v_60d', teachable: 'pi.cmp.v_30d' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  return (
      <main className="bg-white min-h-screen">
        {/* Hero */}
        <PageHero
          icon={GraduationCap} badge={t('pi.badge')}
          title={t('pi.h1_pre')}
          titleAccent={t('pi.h1_accent')}
          subtitle={t('pi.hero_desc')}
        >
          <Link href={'/candidatar' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white hover:bg-brand-700 hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
            {t('pi.cta_apply')} <ArrowRight className="h-4 w-4" />
          </Link>
        </PageHero>

        <section className="py-10 border-b border-slate-200/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map((s, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-brand-600 to-brand-500 bg-clip-text text-transparent">{s.value}</div>
                  <div className="text-xs text-slate-600 mt-1">{t(s.lKey)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="t-h2 text-slate-900">{t('pi.features_title')}</h2>
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

        {/* Compare */}
        <section className="bg-slate-50 py-20 border-y border-slate-200/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="t-h2 text-slate-900">{t('pi.compare_title')}</h2>
              <p className="mt-3 text-slate-600">{t('pi.compare_sub')}</p>
            </div>
            <div className="overflow-x-auto bg-white rounded-3xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-slate-200">
                    <th className="text-left p-4 font-bold text-slate-700">{t('pi.col_feature')}</th>
                    <th className="p-4 font-bold bg-gradient-to-br from-amber-600 to-orange-600 bg-clip-text text-transparent">NeuroLearn</th>
                    <th className="p-4 font-bold text-slate-500">Udemy</th>
                    <th className="p-4 font-bold text-slate-500">Coursera</th>
                    <th className="p-4 font-bold text-slate-500">Teachable</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((r, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="p-4 font-semibold text-slate-900">{t(r.fKey)}</td>
                      <td className="p-4 text-center font-bold text-amber-700 bg-amber-50/30">{t(r.neuro)}</td>
                      <td className="p-4 text-center text-slate-600">{t(r.udemy)}</td>
                      <td className="p-4 text-center text-slate-600">{t(r.coursera)}</td>
                      <td className="p-4 text-center text-slate-600">{t(r.teachable)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 p-10 sm:p-14 shadow-2xl text-center text-white">
            <h2 className="t-h2">{t('pi.cta_title')}</h2>
            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">{t('pi.cta_desc')}</p>
            <Link href={'/candidatar' as any} className="inline-flex items-center gap-2 px-8 py-3.5 mt-8 bg-white text-orange-700 hover:bg-orange-50 hover:scale-105 transition-all font-bold rounded-xl shadow-lg text-base">
              {t('pi.cta_apply2')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>
  );
}
