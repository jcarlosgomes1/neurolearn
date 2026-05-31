import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { SemanticSearch } from './SemanticSearch';

export const metadata = { title: 'Pesquisa — NeuroLearn' };

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }) {
  const { locale } = await params;
  const { q } = await searchParams;
  const blocks = await getHomeBlocks(locale);
  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <SemanticSearch initialQuery={q || ''} locale={locale} />
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
