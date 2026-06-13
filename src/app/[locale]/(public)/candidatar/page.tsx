import { seoMetadata } from '@/lib/seo';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { CandidaturaForm } from './CandidaturaForm';
import { getTranslations } from 'next-intl/server';

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
      <main className="bg-white min-h-screen">
        <section className="bg-gradient-to-br from-brand-50 via-purple-50 to-white pt-16 pb-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-700 bg-white px-3 py-1.5 rounded-full mb-5 shadow-sm">{t('apply.eyebrow')}</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] text-balance">{t('apply.title')}</h1>
            <p className="mt-5 text-lg sm:text-xl text-slate-600 leading-relaxed text-balance">{t('apply.subtitle')}</p>
            <div className="mt-8 grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="text-2xl mb-1">💰</div>
                <div className="text-sm font-semibold text-slate-900">{t('apply.badge.revenue_title')}</div>
                <div className="text-xs text-slate-500 mt-1">{t('apply.badge.revenue_sub')}</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="text-2xl mb-1">🛠</div>
                <div className="text-sm font-semibold text-slate-900">{t('apply.badge.ai_title')}</div>
                <div className="text-xs text-slate-500 mt-1">{t('apply.badge.ai_sub')}</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="text-2xl mb-1">🌍</div>
                <div className="text-sm font-semibold text-slate-900">{t('apply.badge.global_title')}</div>
                <div className="text-xs text-slate-500 mt-1">{t('apply.badge.global_sub')}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <CandidaturaForm />
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="text-xl font-bold text-slate-900 mb-5">{t('apply.how.title')}</h2>
          <ol className="space-y-4">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center">{i + 1}</span>
                <div>
                  <h3 className="font-semibold text-slate-900">{t(s.titleKey)}</h3>
                  <p className="text-sm text-slate-600">{t(s.bodyKey)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

      </main>
  );
}
