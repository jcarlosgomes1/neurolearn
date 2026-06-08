import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { LegalAccordion } from '@/components/legal/LegalAccordion';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import type { Metadata } from 'next';

export const revalidate = 300;

const SITE_URL = 'https://neurolearn-rosy.vercel.app';

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const sb = await createClient();
  const { data } = await sb.rpc('nl_page_get_by_slug', { p_slug: slug, p_lang: locale });
  if (!data) return { title: 'Página não encontrada' };
  const tr = (data as any).translation || {};
  return {
    title: tr.meta_title || tr.title || 'NeuroLearn',
    description: tr.meta_description || tr.excerpt || tr.subtitle || '',
    alternates: { canonical: `${SITE_URL}/${locale}/p/${slug}` },
    openGraph: {
      title: tr.meta_title || tr.title, description: tr.meta_description || tr.excerpt || '',
      images: (data as any).page?.cover_url ? [(data as any).page.cover_url] : [],
    },
  };
}

export default async function CmsPublicPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const sb = await createClient();
  const { data } = await sb.rpc('nl_page_get_by_slug', { p_slug: slug, p_lang: locale });
  if (!data || !(data as any).translation) notFound();

  const page = (data as any).page;
  const tr = (data as any).translation;
  const blocks = await getHomeBlocks(locale);

  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        {page.cover_url && (
          <div className="relative h-48 sm:h-64 bg-gradient-to-br from-violet-500 to-fuchsia-600 overflow-hidden">
            <img src={page.cover_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}
        <article className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
          {page.emoji && <div className="text-5xl mb-4">{page.emoji}</div>}
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">{tr.title}</h1>
          {tr.subtitle && <p className="mt-3 text-lg text-slate-600 text-pretty">{tr.subtitle}</p>}
          <div className="mt-8 border-t border-slate-200 pt-8">
            <LegalAccordion source={tr.content_md || ''} pageTitle={tr.title} />
          </div>
        </article>
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
