import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { LegalAccordion } from '@/components/legal/LegalAccordion';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 600;
const VALID_SLUGS = ['terms', 'privacy', 'cookies', 'refunds', 'legal-notice', 'about', 'faq'];

export default async function LegalPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  if (!VALID_SLUGS.includes(slug)) notFound();

  const sb = await createClient();
  const { data: page } = await sb
    .from('nl_legal_pages')
    .select('title, content_md, last_updated_label')
    .eq('page_slug', slug).eq('lang_code', locale).eq('is_active', true).maybeSingle();
  const finalPage =
    page ||
    (
      await sb
        .from('nl_legal_pages')
        .select('title, content_md, last_updated_label')
        .eq('page_slug', slug).eq('lang_code', 'pt').eq('is_active', true).maybeSingle()
    ).data;
  if (!finalPage) notFound();

  const blocks = await getHomeBlocks(locale);

  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <article className="max-w-5xl mx-auto px-4 py-10 sm:py-12">
          <Link
            href={'/' as any}
            className="group inline-flex items-center gap-1.5 mb-6 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors"
            aria-label="Voltar">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="sr-only sm:not-sr-only">Início</span>
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
            {finalPage.title}
          </h1>
          {finalPage.last_updated_label && (
            <p className="mt-3 text-sm text-slate-500">{finalPage.last_updated_label}</p>
          )}

          <div className="mt-8 border-t border-slate-200 pt-8">
            <LegalAccordion source={finalPage.content_md || ''} pageTitle={finalPage.title} />
          </div>
        </article>
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
