import { seoMetadata } from '@/lib/seo';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { CandidaturaForm } from './CandidaturaForm';
import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/shared/PageHero';
import { Coins, Wrench, Globe } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'candidatar', locale, { title: 'Candidatar · NeuroLearn' });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);

  const steps: Array<{ titleKey: string; bodyKey: string }> = [
    { titleKey: 'apply.how.step1.title', bodyKey: 'apply.how.step1.body' },
    { titleKey: 'apply.how.step2.title', bodyKey: 'apply.how.step2.body' },
    { titleKey: 'apply.how.step3.title', bodyKey: 'apply.how.step3.body' },
  ];

  return (
      <main className="bg-[var(--card)] min-h-screen bg-[var(--paper)]">
        <PageHero
          badge={t('apply.eyebrow')}
          title={t('apply.title')}
          subtitle={t('apply.subtitle')}
        />

        <section className="py-10 border-b border-[var(--line)]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-[var(--card)] rounded-xl p-5 border border-[var(--line)] shadow-sm">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-brand-50 text-brand-600 mb-3"><Coins className="h-5 w-5" /></div>
                <div className="text-sm font-semibold text-[var(--ink)]">{t('apply.badge.revenue_title')}</div>
                <div className="text-xs text-[var(--ink-3)] mt-1">{t('apply.badge.revenue_sub')}</div>
              </div>
              <div className="bg-[var(--card)] rounded-xl p-5 border border-[var(--line)] shadow-sm">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-brand-50 text-brand-600 mb-3"><Wrench className="h-5 w-5" /></div>
                <div className="text-sm font-semibold text-[var(--ink)]">{t('apply.badge.ai_title')}</div>
                <div className="text-xs text-[var(--ink-3)] mt-1">{t('apply.badge.ai_sub')}</div>
              </div>
              <div className="bg-[var(--card)] rounded-xl p-5 border border-[var(--line)] shadow-sm">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-brand-50 text-brand-600 mb-3"><Globe className="h-5 w-5" /></div>
                <div className="text-sm font-semibold text-[var(--ink)]">{t('apply.badge.global_title')}</div>
                <div className="text-xs text-[var(--ink-3)] mt-1">{t('apply.badge.global_sub')}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <CandidaturaForm />
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="t-h2 text-[var(--ink)] mb-5">{t('apply.how.title')}</h2>
          <ol className="space-y-4">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center">{i + 1}</span>
                <div>
                  <h3 className="t-h3 text-[var(--ink)]">{t(s.titleKey)}</h3>
                  <p className="text-sm text-[var(--ink-2)]">{t(s.bodyKey)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

      </main>
  );
}
