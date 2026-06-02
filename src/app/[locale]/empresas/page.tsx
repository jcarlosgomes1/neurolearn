import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Link } from '@/i18n/routing';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { getTranslations } from 'next-intl/server';
import { Building2, Users, Shield, Sparkles, BarChart, Headphones } from 'lucide-react';

export const revalidate = 600;

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('biz.meta_title') };
}

export default async function CompaniesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const blocks = await getHomeBlocks(locale);

  const FEATURES = [
    { icon: Sparkles, title: t('biz.feature.custom'), desc: t('biz.feature.custom_desc') },
    { icon: Shield, title: t('biz.feature.wl'), desc: t('biz.feature.wl_desc') },
    { icon: Users, title: t('biz.feature.teams'), desc: t('biz.feature.teams_desc') },
    { icon: BarChart, title: t('biz.feature.analytics'), desc: t('biz.feature.analytics_desc') },
    { icon: Building2, title: t('biz.feature.sso'), desc: t('biz.feature.sso_desc') },
    { icon: Headphones, title: t('biz.feature.support'), desc: t('biz.feature.support_desc') },
  ];

  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <PageHeader badge={t('biz.badge')} title={t('biz.title')} subtitle={t('biz.subtitle')}>
          <div className="flex flex-wrap gap-3">
            <a href="mailto:hello@neurolearn.pt?subject=Enterprise" className="btn-primary">{t('biz.cta_sales')}</a>
            <Link href={'/cursos' as any} className="btn-secondary">{t('biz.cta_catalog')}</Link>
          </div>
        </PageHeader>
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">{t('biz.features_title')}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-brand-200 transition-all">
                <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900 text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed text-pretty">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-slate-50 py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('biz.cta_ready')}</h2>
            <p className="mt-4 text-lg text-slate-600">{t('biz.cta_demo_sub')}</p>
            <a href="mailto:hello@neurolearn.pt?subject=Demo" className="btn-primary mt-6 inline-flex text-base px-6 py-3">{t('biz.cta_demo_btn')}</a>
          </div>
        </section>
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
