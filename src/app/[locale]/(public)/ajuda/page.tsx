import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Search, HelpCircle, User, BookOpen, CreditCard, Award, Building2, ShieldCheck, ArrowRight, MessageCircle, Mail } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata() { return { title: 'Centro de ajuda · NeuroLearn' }; }

const CATS = [
  { icon: User, titleKey: 'aj.c1_title', href: '/conta', itemKeys: ['aj.c1_i1', 'aj.c1_i2', 'aj.c1_i3', 'aj.c1_i4', 'aj.c1_i5'], cls: 'from-violet-500 to-indigo-600' },
  { icon: BookOpen, titleKey: 'aj.c2_title', href: '/cursos', itemKeys: ['aj.c2_i1', 'aj.c2_i2', 'aj.c2_i3', 'aj.c2_i4', 'aj.c2_i5'], cls: 'from-emerald-500 to-teal-600' },
  { icon: CreditCard, titleKey: 'aj.c3_title', href: '/legal/refunds', itemKeys: ['aj.c3_i1', 'aj.c3_i2', 'aj.c3_i3', 'aj.c3_i4', 'aj.c3_i5'], cls: 'from-amber-500 to-orange-600' },
  { icon: Award, titleKey: 'aj.c4_title', href: '/legal/faq', itemKeys: ['aj.c4_i1', 'aj.c4_i2', 'aj.c4_i3', 'aj.c4_i4', 'aj.c4_i5'], cls: 'from-fuchsia-500 to-pink-600' },
  { icon: Building2, titleKey: 'aj.c5_title', href: '/para-empresas', itemKeys: ['aj.c5_i1', 'aj.c5_i2', 'aj.c5_i3', 'aj.c5_i4', 'aj.c5_i5'], cls: 'from-blue-500 to-cyan-600' },
  { icon: ShieldCheck, titleKey: 'aj.c6_title', href: '/legal/privacy', itemKeys: ['aj.c6_i1', 'aj.c6_i2', 'aj.c6_i3', 'aj.c6_i4', 'aj.c6_i5'], cls: 'from-rose-500 to-red-600' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  return (
      <main className="bg-white min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl animate-pulse" />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 mb-6 shadow-sm">
              <HelpCircle className="h-3.5 w-3.5" /> {t('aj.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              {t('aj.h1_pre')}<span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{t('aj.h1_accent')}</span>
            </h1>
            <div className="mt-8 relative max-w-xl mx-auto">
              <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="search" placeholder={t('aj.search_ph')} className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-lg outline-none focus:border-blue-500" />
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATS.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className={`inline-flex h-11 w-11 rounded-xl bg-gradient-to-br ${c.cls} text-white items-center justify-center mb-4 shadow-md`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-3">{t(c.titleKey)}</h3>
                <ul className="space-y-1.5">
                  {c.itemKeys.map((it, ii) => (
                    <li key={ii}>
                      <Link href={c.href as any} className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 hover:gap-1.5 transition-all">
                        <ArrowRight className="h-3 w-3 text-slate-400" /> {t(it)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-20 border-t border-slate-200/60">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900">{t('aj.cta_title')}</h2>
            <p className="mt-3 text-slate-600">{t('aj.cta_desc')}</p>
            <div className="mt-6 grid sm:grid-cols-1 max-w-md mx-auto">
              <Link href={{ pathname: '/contacto', query: { topic: 'support', from: '/ajuda' } } as any}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all group">
                <Mail className="h-6 w-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-slate-900">{t('aj.send_msg')}</div>
                <div className="text-xs text-slate-500 mt-1">{t('aj.send_sub')}</div>
              </Link>
            </div>
          </div>
        </section>

      </main>
  );
}
