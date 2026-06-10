import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Users, MessageCircle, Calendar, BookOpen, Heart, Sparkles, ArrowRight, Shield, Globe2 } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Comunidade · NeuroLearn' }; }

const STATS = [
  { value: '12k+', lKey: 'co.stat1_label' },
  { value: '4', lKey: 'co.stat2_label' },
  { value: '850+', lKey: 'co.stat3_label' },
  { value: '24h', lKey: 'co.stat4_label' },
];

const CHANNELS = [
  { icon: MessageCircle, tKey: 'co.ch1_title', dKey: 'co.ch1_desc', ctaKey: 'co.ch1_cta', cls: 'from-violet-500 to-indigo-600' },
  { icon: BookOpen, tKey: 'co.ch2_title', dKey: 'co.ch2_desc', ctaKey: 'co.ch2_cta', cls: 'from-emerald-500 to-teal-600' },
  { icon: Calendar, tKey: 'co.ch3_title', dKey: 'co.ch3_desc', ctaKey: 'co.ch3_cta', cls: 'from-amber-500 to-orange-600' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  return (
      <main className="bg-white min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-purple-200 text-xs font-semibold text-purple-700 mb-6 shadow-sm">
              <Users className="h-3.5 w-3.5" /> {t('co.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              {t('co.h1_pre')}<span className="bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">{t('co.h1_accent')}</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {t('co.hero_desc')}
            </p>
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map((s, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">{s.value}</div>
                  <div className="text-xs text-slate-600 mt-1">{t(s.lKey)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">{t('co.channels_title')}</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {CHANNELS.map((c, i) => (
              <div key={i} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:-translate-y-1 hover:shadow-xl transition-all">
                <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${c.cls} text-white items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  <c.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{t(c.tKey)}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{t(c.dKey)}</p>
                <button className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:gap-2 transition-all">
                  {t(c.ctaKey)} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-20 border-y border-slate-200/60">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm">
              <Shield className="h-8 w-8 text-purple-600 mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">{t('co.conduct_title')}</h2>
              <div className="space-y-3 text-slate-700 leading-relaxed">
                <p>{t('co.conduct_p1')}</p>
                <p>{t('co.conduct_p2')}</p>
                <p className="text-sm text-slate-500 italic">{t('co.conduct_p3')}</p>
              </div>
            </div>
          </div>
        </section>

      </main>
  );
}
