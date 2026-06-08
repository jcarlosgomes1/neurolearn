import { Header } from '@/components/layout/Header';
import { Hero } from '@/components/sections/Hero';
import { Stats } from '@/components/sections/Stats';
import { Features } from '@/components/sections/Features';
import { Pricing } from '@/components/sections/Pricing';
import { Testimonials } from '@/components/sections/Testimonials';
import { Faq } from '@/components/sections/Faq';
import { FinalCta } from '@/components/sections/FinalCta';
import { Footer } from '@/components/sections/Footer';
import { TrustedByStrip, HowItWorksSection, CategoriesGrid, LiveMomentumSection } from '@/components/sections/HomeExtras';
import { OrganizationStructuredData, WebsiteStructuredData, FAQStructuredData } from '@/components/seo/StructuredData';
import { getHomeBlocks } from '@/lib/api/home-blocks';

export const revalidate = 60;

const SITE_URL = 'https://neurolearn-rosy.vercel.app';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const blocks = await getHomeBlocks(locale);

  // Extrair FAQ items para Schema.org (defensive)
  const faqItems: Array<{ q: string; a: string }> = [];
  const faqData = blocks.faq as { items?: Array<{ question?: string; answer?: string; q?: string; a?: string }> } | undefined;
  if (faqData?.items && Array.isArray(faqData.items)) {
    for (const item of faqData.items) {
      const q = item.question || item.q;
      const a = item.answer || item.a;
      if (q && a) faqItems.push({ q, a });
    }
  }

  return (
    <>
      <OrganizationStructuredData baseUrl={SITE_URL} />
      <WebsiteStructuredData baseUrl={SITE_URL} />
      {faqItems.length > 0 && <FAQStructuredData items={faqItems} />}
      <Header />
      <main className="bg-white">
        {blocks.hero && <Hero data={blocks.hero} />}
        <TrustedByStrip />
        {blocks.stats && <Stats data={blocks.stats} />}
        <HowItWorksSection />
        {blocks.features && <Features data={blocks.features} />}
        <CategoriesGrid />
        {blocks.plans && blocks.pricing_header && (
          <Pricing header={blocks.pricing_header} plans={blocks.plans} />
        )}
        {blocks.testimonials && <Testimonials data={blocks.testimonials} />}
        <LiveMomentumSection />
        {blocks.faq && <Faq data={blocks.faq} />}
        {blocks.cta_section && <FinalCta data={blocks.cta_section} />}
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
