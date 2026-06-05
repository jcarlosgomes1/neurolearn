import { createClient } from '@/lib/supabase/server';
import { PricingClient } from './PricingClient';
import { BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import type { Metadata } from 'next';

const SITE_URL = 'https://neurolearn-rosy.vercel.app';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = 'Preços · NeuroLearn';
  const desc = 'Planos transparentes para equipas a partir de empresas pequenas a enterprise — LMS multi-tenant white-label, geração de cursos com IA, marketplace.';
  return {
    title, description: desc,
    alternates: {
      canonical: `${SITE_URL}/${locale}/precos`,
      languages: {
        'pt': `${SITE_URL}/pt/precos`,
        'en': `${SITE_URL}/en/precos`,
        'es': `${SITE_URL}/es/precos`,
        'fr': `${SITE_URL}/fr/precos`,
      },
    },
    openGraph: {
      type: 'website', title, description: desc,
      url: `${SITE_URL}/${locale}/precos`, siteName: 'NeuroLearn',
      images: [`${SITE_URL}/${locale}/opengraph-image`],
    },
    twitter: { card: 'summary_large_image', title, description: desc },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const [{ data: plans }, { data: addons }] = await Promise.all([
    sb.rpc('nl_billing_plans_public_list'),
    sb.rpc('nl_billing_addons_public_list'),
  ]);
  return (
    <>
      <BreadcrumbStructuredData items={[
        { name: 'Início', href: `/${locale}` },
        { name: 'Preços', href: `/${locale}/precos` },
      ]} baseUrl={SITE_URL} />
      <PricingClient locale={locale} plans={(plans as any[]) || []} addons={(addons as any[]) || []} />
    </>
  );
}
