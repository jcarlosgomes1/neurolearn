import { Header } from '@/components/layout/Header';
import { Hero } from '@/components/sections/Hero';
import { Stats } from '@/components/sections/Stats';
import { Features } from '@/components/sections/Features';
import { Pricing } from '@/components/sections/Pricing';
import { Testimonials } from '@/components/sections/Testimonials';
import { Faq } from '@/components/sections/Faq';
import { FinalCta } from '@/components/sections/FinalCta';
import { Footer } from '@/components/sections/Footer';
import { getHomeBlocks } from '@/lib/api/home-blocks';

export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const blocks = await getHomeBlocks(locale);

  return (
    <>
      <Header />
      <main className="bg-white">
        {blocks.hero && <Hero data={blocks.hero} />}
        {blocks.stats && <Stats data={blocks.stats} />}
        {blocks.features && <Features data={blocks.features} />}
        {blocks.plans && blocks.pricing_header && (
          <Pricing header={blocks.pricing_header} plans={blocks.plans} />
        )}
        {blocks.testimonials && <Testimonials data={blocks.testimonials} />}
        {blocks.faq && <Faq data={blocks.faq} />}
        {blocks.cta_section && <FinalCta data={blocks.cta_section} />}
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
