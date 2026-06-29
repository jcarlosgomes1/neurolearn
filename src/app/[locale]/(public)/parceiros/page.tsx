import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/shared/PageHero';
import { PageWidth } from '@/components/shared/PageWidth';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Handshake, Building2, GraduationCap, Briefcase, Globe2, ArrowRight, Sparkles, Check } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'parceiros', locale, { title: 'Parceiros · NeuroLearn' });
}

const TYPES = [
  { icon: Building2, titleKey: 'pa.t1_title', descKey: 'pa.t1_desc', perkKeys: ['pa.t1_p1', 'pa.t1_p2', 'pa.t1_p3', 'pa.t1_p4'], fam: 'denim' },
  { icon: GraduationCap, titleKey: 'pa.t2_title', descKey: 'pa.t2_desc', perkKeys: ['pa.t2_p1', 'pa.t2_p2', 'pa.t2_p3', 'pa.t2_p4'], fam: 'sage' },
  { icon: Briefcase, titleKey: 'pa.t3_title', descKey: 'pa.t3_desc', perkKeys: ['pa.t3_p1', 'pa.t3_p2', 'pa.t3_p3', 'pa.t3_p4'], fam: 'saffron' },
  { icon: Globe2, titleKey: 'pa.t4_title', descKey: 'pa.t4_desc', perkKeys: ['pa.t4_p1', 'pa.t4_p2', 'pa.t4_p3', 'pa.t4_p4'], fam: 'plum' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <PageHero
        icon={Handshake} badge={t('pa.badge')}
        title={t('pa.h1_pre')}
        titleAccent={t('pa.h1_accent')}
        subtitle={t('pa.hero_desc')}
      />

      <PageWidth py="py-20">
        <div className="space-y-6">
          {TYPES.map((typ, i) => (
            <div key={i} className="group rounded-3xl p-6 sm:p-8 hover:shadow-2xl hover:-translate-y-1 transition-all" style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--nl-surface-shadow)' }}>
              <div className="grid sm:grid-cols-5 gap-6 items-center">
                <div className="sm:col-span-1 flex sm:block items-center gap-3">
                  <div className="inline-flex h-16 w-16 rounded-2xl text-white items-center justify-center shadow-lg group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(135deg, var(--${typ.fam}-base), var(--${typ.fam}-deep))` }}>
                    <typ.icon className="h-8 w-8" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <h3 className="t-h3 mb-2" style={{ color: `var(--${typ.fam}-deep)` }}>{t(typ.titleKey)}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>{t(typ.descKey)}</p>
                </div>
                <div className="sm:col-span-2 grid grid-cols-2 gap-1.5">
                  {typ.perkKeys.map((pk, pi) => (
                    <div key={pi} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink-2)' }}>
                      <Check className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--sage-deep)' }} /> {t(pk)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </PageWidth>

      <section className="mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center" style={{ maxWidth: '48rem' }}>
        <div className="relative overflow-hidden rounded-3xl p-10 shadow-2xl text-white" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>
          <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-70" />
          <h2 className="t-h2">{t('pa.cta_title')}</h2>
          <p className="mt-3 text-white/90">{t('pa.cta_desc')}</p>
          <Link href={{ pathname: '/contacto', query: { topic: 'partners', from: '/parceiros' } } as any}
            className="inline-flex items-center gap-2 px-6 py-3 mt-6 bg-white hover:scale-105 transition-all font-bold rounded-xl shadow-lg" style={{ color: 'var(--accent)' }}>
            {t('aj.send_msg')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
