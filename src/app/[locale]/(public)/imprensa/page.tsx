import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/shared/PageHero';
import { PageWidth } from '@/components/shared/PageWidth';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Newspaper, Download, ExternalLink, Mail, Calendar, FileText, Image as ImageIcon } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'imprensa', locale, { title: 'Imprensa · NeuroLearn' });
}

const RELEASES = [
  { date: '2026-05-12', titleKey: 'im.r1_title', summaryKey: 'im.r1_summary' },
  { date: '2026-03-08', titleKey: 'im.r2_title', summaryKey: 'im.r2_summary' },
  { date: '2026-01-15', titleKey: 'im.r3_title', summaryKey: 'im.r3_summary' },
];

const RESOURCES = [
  { icon: ImageIcon, titleKey: 'im.res1_title', descKey: 'im.res1_desc', fam: 'denim' },
  { icon: FileText, titleKey: 'im.res2_title', descKey: 'im.res2_desc', fam: 'sage' },
  { icon: Calendar, titleKey: 'im.res3_title', descKey: 'im.res3_desc', fam: 'saffron' },
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);
  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <PageHero
        icon={Newspaper} badge={t('im.badge')}
        title={t('im.h1')}
        subtitle={t('im.hero_desc')}
      />

      <PageWidth py="py-16 sm:py-20">
        <h2 className="t-h2 mb-8" style={{ color: 'var(--ink)' }}>{t('im.releases_title')}</h2>
        <div className="space-y-4">
          {RELEASES.map((r, i) => (
            <article key={i} className="group rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all" style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--nl-surface-shadow)' }}>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--ink-3)' }}>{new Date(r.date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <h3 className="t-h3 mb-2" style={{ color: 'var(--ink)' }}>{t(r.titleKey)}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>{t(r.summaryKey)}</p>
            </article>
          ))}
        </div>
      </PageWidth>

      <section className="py-20 border-y" style={{ background: 'color-mix(in srgb, var(--paper) 60%, var(--card))', borderColor: 'var(--line)' }}>
        <PageWidth>
          <h2 className="t-h2 mb-8 text-center" style={{ color: 'var(--ink)' }}>{t('im.resources_title')}</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {RESOURCES.map((r, i) => (
              <div key={i} className="rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all" style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--nl-surface-shadow)' }}>
                <div className="inline-flex h-12 w-12 rounded-xl text-white items-center justify-center mb-3 shadow-md" style={{ background: `linear-gradient(135deg, var(--${r.fam}-base), var(--${r.fam}-deep))` }}>
                  <r.icon className="h-5 w-5" />
                </div>
                <h3 className="t-h3 mb-1" style={{ color: 'var(--ink)' }}>{t(r.titleKey)}</h3>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--ink-2)' }}>{t(r.descKey)}</p>
                <a href="#" className="inline-flex items-center gap-1 text-sm font-semibold hover:gap-2 transition-all" style={{ color: 'var(--accent)' }}>
                  <Download className="h-3.5 w-3.5" /> {t('im.download')}
                </a>
              </div>
            ))}
          </div>
        </PageWidth>
      </section>

      <section className="mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center" style={{ maxWidth: '48rem' }}>
        <Mail className="h-10 w-10 mx-auto mb-4" style={{ color: 'var(--ink-2)' }} />
        <h2 className="t-h2" style={{ color: 'var(--ink)' }}>{t('im.cta_title')}</h2>
        <p className="mt-3" style={{ color: 'var(--ink-2)' }}>{t('im.cta_desc')}</p>
        <Link href={{ pathname: '/contacto', query: { topic: 'press', from: '/imprensa' } } as any}
          className="inline-flex items-center gap-2 px-6 py-3 mt-6 hover:scale-105 transition-all text-white font-bold rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>
          {t('aj.send_msg')} <ExternalLink className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
