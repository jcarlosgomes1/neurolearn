import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/shared/PageHero';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Check, X, ArrowRight, Sparkles, GitCompare } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'comparar', locale, { title: 'Comparar plataformas · NeuroLearn' });
}

interface Row { fKey: string; nl: string | boolean; udemy: string | boolean; coursera: string | boolean; teachable: string | boolean; }

const ROWS: Row[] = [
  { fKey: 'cmp2.r_langs', nl: true, udemy: 'cmp2.v_limitado', coursera: 'cmp2.v_limitado', teachable: 'cmp2.v_limitado' },
  { fKey: 'cmp2.r_tutor', nl: true, udemy: false, coursera: false, teachable: false },
  { fKey: 'cmp2.r_paths', nl: true, udemy: false, coursera: 'cmp2.v_pago', teachable: false },
  { fKey: 'cmp2.r_talent', nl: true, udemy: false, coursera: false, teachable: false },
  { fKey: 'cmp2.r_whitelabel', nl: true, udemy: 'cmp2.v_business', coursera: 'cmp2.v_business', teachable: 'cmp2.v_pago' },
  { fKey: 'cmp2.r_gendocs', nl: true, udemy: false, coursera: false, teachable: false },
  { fKey: 'cmp2.r_freetier', nl: true, udemy: 'cmp2.v_trial', coursera: 'cmp2.v_trial', teachable: false },
  { fKey: 'cmp2.r_certs', nl: true, udemy: true, coursera: true, teachable: true },
  { fKey: 'cmp2.r_discord', nl: true, udemy: false, coursera: false, teachable: false },
  { fKey: 'cmp2.r_events', nl: true, udemy: false, coursera: false, teachable: false },
  { fKey: 'cmp2.r_support_pt', nl: true, udemy: false, coursera: false, teachable: false },
];

function render(v: string | boolean, t: (k: string) => string) {
  if (v === true) return <Check className="h-5 w-5 text-emerald-600 mx-auto" />;
  if (v === false) return <X className="h-5 w-5 text-slate-300 mx-auto" />;
  return <span className="text-xs text-slate-600">{t(v)}</span>;
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  return (
      <main className="bg-white min-h-screen">
        <PageHero
          icon={GitCompare} badge={t('cmp2.badge')}
          title={t('cmp2.h1_pre')}
          titleAccent={t('cmp2.h1_accent')}
          subtitle={t('cmp2.hero_desc')}
        />

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="overflow-x-auto bg-white rounded-3xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-slate-200">
                  <th className="text-left p-4 font-bold text-slate-700">{t('pi.col_feature')}</th>
                  <th className="p-4 font-bold bg-gradient-to-br from-emerald-600 to-blue-600 bg-clip-text text-transparent">NeuroLearn</th>
                  <th className="p-4 font-bold text-slate-500">Udemy</th>
                  <th className="p-4 font-bold text-slate-500">Coursera</th>
                  <th className="p-4 font-bold text-slate-500">Teachable</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-semibold text-slate-900">{t(r.fKey)}</td>
                    <td className="p-4 text-center bg-emerald-50/30">{render(r.nl, t)}</td>
                    <td className="p-4 text-center">{render(r.udemy, t)}</td>
                    <td className="p-4 text-center">{render(r.coursera, t)}</td>
                    <td className="p-4 text-center">{render(r.teachable, t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">{t('cmp2.updated')}</p>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-blue-600 p-10 shadow-2xl text-white">
            <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-70" />
            <h2 className="t-h2">{t('cmp2.cta_title')}</h2>
            <p className="mt-3 text-white/90 max-w-xl mx-auto">{t('cmp2.cta_desc')}</p>
            <Link href={'/register' as any} className="inline-flex items-center gap-2 px-6 py-3 mt-6 bg-white text-emerald-700 hover:bg-emerald-50 hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
              {t('ps.cta_create')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>
  );
}
