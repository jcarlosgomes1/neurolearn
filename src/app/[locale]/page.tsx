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
import { Reveal } from '@/components/motion/Reveal';

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
        <Reveal delay={60}><TrustedByStrip /></Reveal>
        {blocks.stats && <Reveal><Stats data={blocks.stats} /></Reveal>}
        <Reveal><HowItWorksSection /></Reveal>
        {blocks.features && <Reveal><Features data={blocks.features} /></Reveal>}
        <Reveal><CategoriesGrid /></Reveal>
        {blocks.plans && blocks.pricing_header && (
          <Reveal><Pricing header={blocks.pricing_header} plans={blocks.plans} /></Reveal>
        )}
        {blocks.testimonials && <Reveal><Testimonials data={blocks.testimonials} /></Reveal>}
        <Reveal><LiveMomentumSection /></Reveal>
        {blocks.faq && <Reveal><Faq data={blocks.faq} /></Reveal>}
        {blocks.cta_section && <Reveal><FinalCta data={blocks.cta_section} /></Reveal>}
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
