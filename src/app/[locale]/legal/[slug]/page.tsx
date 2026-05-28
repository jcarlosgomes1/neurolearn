import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Markdown } from '@/components/shared/Markdown';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { notFound } from 'next/navigation';

export const revalidate = 600;
const VALID_SLUGS = ['terms', 'privacy', 'cookies', 'refunds', 'legal-notice', 'about', 'faq'];

export default async function LegalPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  if (!VALID_SLUGS.includes(slug)) notFound();

  const sb = await createClient();
  const { data: page } = await sb.from('nl_legal_pages').select('title, content_md, last_updated_label').eq('page_slug', slug).eq('lang_code', locale).eq('is_active', true).maybeSingle();
  const finalPage = page || (await sb.from('nl_legal_pages').select('title, content_md, last_updated_label').eq('page_slug', slug).eq('lang_code', 'pt').eq('is_active', true).maybeSingle()).data;
  if (!finalPage) notFound();

  const blocks = await getHomeBlocks(locale);

  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <article className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">{finalPage.title}</h1>
          {finalPage.last_updated_label && <p className="mt-3 text-sm text-slate-500">{finalPage.last_updated_label}</p>}
          <div className="mt-8 border-t border-slate-200 pt-8">
            <Markdown source={finalPage.content_md || ''} />
          </div>
        </article>
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
