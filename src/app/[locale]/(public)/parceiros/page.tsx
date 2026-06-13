import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Handshake, Building2, GraduationCap, Briefcase, Globe2, ArrowRight, Sparkles, Check } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'parceiros', locale, { title: 'Parceiros · NeuroLearn' });
}

const TYPES = [
  { icon: Building2, titleKey: 'pa.t1_title', descKey: 'pa.t1_desc', perkKeys: ['pa.t1_p1', 'pa.t1_p2', 'pa.t1_p3', 'pa.t1_p4'], cls: 'from-violet-500 to-indigo-600' },
  { icon: GraduationCap, titleKey: 'pa.t2_title', descKey: 'pa.t2_desc', perkKeys: ['pa.t2_p1', 'pa.t2_p2', 'pa.t2_p3', 'pa.t2_p4'], cls: 'from-emerald-500 to-teal-600' },
  { icon: Briefcase, titleKey: 'pa.t3_title', descKey: 'pa.t3_desc', perkKeys: ['pa.t3_p1', 'pa.t3_p2', 'pa.t3_p3', 'pa.t3_p4'], cls: 'from-amber-500 to-orange-600' },
  { icon: Globe2, titleKey: 'pa.t4_title', descKey: 'pa.t4_desc', perkKeys: ['pa.t4_p1', 'pa.t4_p2', 'pa.t4_p3', 'pa.t4_p4'], cls: 'from-fuchsia-500 to-pink-600' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  return (
      <main className="bg-white min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-emerald-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl animate-pulse" />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-teal-200 text-xs font-semibold text-teal-700 mb-6 shadow-sm">
              <Handshake className="h-3.5 w-3.5" /> {t('pa.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              {t('pa.h1_pre')}<span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">{t('pa.h1_accent')}</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {t('pa.hero_desc')}
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-6">
          {TYPES.map((typ, i) => (
            <div key={i} className="group bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 hover:shadow-2xl hover:-translate-y-1 transition-all">
              <div className="grid sm:grid-cols-5 gap-6 items-center">
                <div className="sm:col-span-1 flex sm:block items-center gap-3">
                  <div className={`inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br ${typ.cls} text-white items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <typ.icon className="h-8 w-8" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <h3 className={`text-xl font-bold bg-gradient-to-r ${typ.cls} bg-clip-text text-transparent mb-2`}>{t(typ.titleKey)}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{t(typ.descKey)}</p>
                </div>
                <div className="sm:col-span-2 grid grid-cols-2 gap-1.5">
                  {typ.perkKeys.map((pk, pi) => (
                    <div key={pi} className="flex items-center gap-1.5 text-xs text-slate-700">
                      <Check className="h-3 w-3 text-emerald-600 flex-shrink-0" /> {t(pk)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-600 p-10 shadow-2xl text-white">
            <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-70" />
            <h2 className="text-2xl sm:text-3xl font-bold">{t('pa.cta_title')}</h2>
            <p className="mt-3 text-white/90">{t('pa.cta_desc')}</p>
            <Link href={{ pathname: '/contacto', query: { topic: 'partners', from: '/parceiros' } } as any}
              className="inline-flex items-center gap-2 px-6 py-3 mt-6 bg-white text-teal-700 hover:bg-teal-50 hover:scale-105 transition-all font-bold rounded-xl shadow-lg">
              {t('aj.send_msg')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>
  );
}
