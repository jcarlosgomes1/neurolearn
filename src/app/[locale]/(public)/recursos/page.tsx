import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/shared/PageHero';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { BookOpen, FileText, Video, Mic, Download, ArrowRight, Sparkles } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'recursos', locale, { title: 'Recursos · NeuroLearn' });
}

const CATEGORIES = [
  { icon: BookOpen, titleKey: 're.c1_title', countKey: 're.c1_count', descKey: 're.c1_desc', cls: 'from-violet-500 to-indigo-600' },
  { icon: FileText, titleKey: 're.c2_title', countKey: 're.c2_count', descKey: 're.c2_desc', cls: 'from-emerald-500 to-teal-600' },
  { icon: Video, titleKey: 're.c3_title', countKey: 're.c3_count', descKey: 're.c3_desc', cls: 'from-amber-500 to-orange-600' },
  { icon: Mic, titleKey: 're.c4_title', countKey: 're.c4_count', descKey: 're.c4_desc', cls: 'from-fuchsia-500 to-pink-600' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  return (
      <main className="bg-white min-h-screen">
        <PageHero
          icon={Sparkles} badge={t('re.badge')}
          title={t('re.h1_pre')}
          titleAccent={t('re.h1_accent')}
          subtitle={t('re.hero_desc')}
        />

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid sm:grid-cols-2 gap-6">
            {CATEGORIES.map((c, i) => (
              <div key={i} className="group bg-white rounded-3xl border border-slate-200 p-8 hover:-translate-y-1 hover:shadow-2xl transition-all relative overflow-hidden">
                <div className={`absolute top-0 right-0 h-40 w-40 rounded-full bg-gradient-to-br ${c.cls} opacity-5 blur-3xl group-hover:opacity-15 transition-opacity`} />
                <div className={`inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br ${c.cls} text-white items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <c.icon className="h-7 w-7" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="t-h3 text-slate-900">{t(c.titleKey)}</h3>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{t(c.countKey)}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{t(c.descKey)}</p>
                <Link href={'/blog' as any} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:gap-2 transition-all">
                  {t('re.explore')} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center text-white">
            <Download className="h-8 w-8 mx-auto mb-3 opacity-70" />
            <h2 className="t-h2">{t('re.nl_title')}</h2>
            <p className="mt-3 text-white/80">{t('re.nl_desc')}</p>
            <form className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input type="email" placeholder={t('re.email_ph')} className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 outline-none focus:border-white/50" />
              <button type="submit" className="px-6 py-3 bg-gradient-to-br from-fuchsia-600 to-pink-600 hover:scale-105 transition-all text-white font-bold rounded-xl shadow-lg">{t('re.subscribe')}</button>
            </form>
          </div>
        </section>

      </main>
  );
}
