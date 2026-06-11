import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Newspaper, Download, ExternalLink, Mail, Calendar, FileText, Image as ImageIcon } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Imprensa · NeuroLearn' }; }

const RELEASES = [
  { date: '2026-05-12', titleKey: 'im.r1_title', summaryKey: 'im.r1_summary' },
  { date: '2026-03-08', titleKey: 'im.r2_title', summaryKey: 'im.r2_summary' },
  { date: '2026-01-15', titleKey: 'im.r3_title', summaryKey: 'im.r3_summary' },
];

const RESOURCES = [
  { icon: ImageIcon, titleKey: 'im.res1_title', descKey: 'im.res1_desc', cls: 'from-violet-500 to-indigo-600' },
  { icon: FileText, titleKey: 'im.res2_title', descKey: 'im.res2_desc', cls: 'from-emerald-500 to-teal-600' },
  { icon: Calendar, titleKey: 'im.res3_title', descKey: 'im.res3_desc', cls: 'from-amber-500 to-orange-600' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  return (
      <main className="bg-white min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-zinc-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-slate-400/10 blur-3xl animate-pulse" />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 mb-6 shadow-sm">
              <Newspaper className="h-3.5 w-3.5" /> {t('im.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">{t('im.h1')}</h1>
            <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">{t('im.hero_desc')}</p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">{t('im.releases_title')}</h2>
          <div className="space-y-4">
            {RELEASES.map((r, i) => (
              <article key={i} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="text-xs font-semibold text-slate-500 mb-2">{new Date(r.date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{t(r.titleKey)}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t(r.summaryKey)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-20 border-y border-slate-200/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">{t('im.resources_title')}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {RESOURCES.map((r, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${r.cls} text-white items-center justify-center mb-3 shadow-md`}>
                    <r.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{t(r.titleKey)}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{t(r.descKey)}</p>
                  <a href="#" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:gap-2 transition-all">
                    <Download className="h-3.5 w-3.5" /> {t('im.download')}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Mail className="h-10 w-10 text-slate-700 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('im.cta_title')}</h2>
          <p className="mt-3 text-slate-600">{t('im.cta_desc')}</p>
          <Link href={{ pathname: '/contacto', query: { topic: 'press', from: '/imprensa' } } as any}
            className="inline-flex items-center gap-2 px-6 py-3 mt-6 bg-gradient-to-br from-slate-800 to-slate-900 hover:scale-105 transition-all text-white font-bold rounded-xl shadow-lg">
            {t('aj.send_msg')} <ExternalLink className="h-4 w-4" />
          </Link>
        </section>

      </main>
  );
}
