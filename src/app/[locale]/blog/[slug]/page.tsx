import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Markdown } from '@/components/shared/Markdown';
import { CoverImage } from '@/components/shared/CoverImage';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { fmtDate } from '@/lib/utils/cn';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ArticleStructuredData, BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import type { Metadata } from 'next';

export const revalidate = 300;

const SITE_URL = 'https://neurolearn-rosy.vercel.app';

// Remove qualquer seta inicial ou marca de back ("← ", "‹ ", etc.) de uma string
// — usado quando a chave i18n já inclui a seta mas mostramos um ícone separado.
function stripArrow(s: string): string {
  return (s || '').replace(/^[←‹\s«]+/u, '').trim();
}

interface BlogPost {
  id: string; slug: string; category: string | null; tags: string[] | null;
  featured_image_url: string | null; published_at: string | null; author_name: string | null;
  updated_at?: string | null;
}
interface Translation {
  post_id?: string; lang: string; title: string; excerpt: string | null;
  content_md: string | null; reading_time_minutes: number | null;
}
interface RelatedItem {
  id: string; slug: string; category: string | null;
  featured_image_url: string | null; published_at: string | null; tr: Translation;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'Ferramentas': '🛠', 'Mercado': '📊', 'Técnico': '⚙️', 'Tecnico': '⚙️',
  'Prático': '🎯', 'Pratico': '🎯', 'Caso de estudo': '💼',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const sb = await createClient();
  const { data: post } = await sb.from('nl_blog_posts')
    .select('id, slug, featured_image_url, published_at')
    .eq('slug', slug).not('published_at', 'is', null).maybeSingle();
  if (!post) return { title: 'Artigo não encontrado' };

  const { data: trs } = await sb.from('nl_blog_post_translations')
    .select('lang, title, excerpt').eq('post_id', post.id);
  const tr = (trs || []).find((x: any) => x.lang === locale) || (trs || [])[0];
  if (!tr) return { title: 'Artigo' };

  const title = tr.title as string;
  const desc = ((tr.excerpt as string | null) || title).slice(0, 160);
  const ogImage = post.featured_image_url || `${SITE_URL}/${locale}/opengraph-image`;

  return {
    title, description: desc,
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog/${slug}`,
      languages: {
        'pt': `${SITE_URL}/pt/blog/${slug}`,
        'en': `${SITE_URL}/en/blog/${slug}`,
        'es': `${SITE_URL}/es/blog/${slug}`,
        'fr': `${SITE_URL}/fr/blog/${slug}`,
      },
    },
    openGraph: {
      type: 'article', title, description: desc,
      url: `${SITE_URL}/${locale}/blog/${slug}`,
      images: [ogImage], siteName: 'NeuroLearn',
      publishedTime: post.published_at || undefined,
    },
    twitter: { card: 'summary_large_image', title, description: desc, images: [ogImage] },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: post } = await sb.from('nl_blog_posts')
    .select('id, slug, category, tags, featured_image_url, published_at, author_name, updated_at')
    .eq('slug', slug).not('published_at', 'is', null).maybeSingle<BlogPost>();
  if (!post) notFound();

  const { data: tr } = await sb.from('nl_blog_post_translations')
    .select('lang, title, excerpt, content_md, reading_time_minutes')
    .eq('post_id', post.id).or(`lang.eq.${locale},lang.eq.pt`);
  const translation = (tr as Translation[] | null)?.find((x) => x.lang === locale) || (tr as Translation[] | null)?.[0];
  if (!translation) notFound();

  const { data: relatedRaw } = post.category
    ? await sb.from('nl_blog_posts').select('id, slug, category, featured_image_url, published_at')
        .eq('category', post.category).neq('id', post.id).not('published_at', 'is', null)
        .order('published_at', { ascending: false }).limit(3)
    : { data: [] };
  const relatedIds = (relatedRaw || []).map((r: { id: string }) => r.id);
  const { data: relTrs } = relatedIds.length ? await sb.from('nl_blog_post_translations')
    .select('post_id, lang, title, reading_time_minutes').in('post_id', relatedIds) : { data: [] };
  const relTrsMap = new Map<string, Translation>();
  ((relTrs as Translation[]) || []).forEach((rt) => {
    const ex = relTrsMap.get(rt.post_id!);
    if (!ex || (rt.lang === locale && ex.lang !== locale) || (rt.lang === 'pt' && ex.lang !== locale && ex.lang !== 'pt')) {
      relTrsMap.set(rt.post_id!, rt);
    }
  });
  const related: RelatedItem[] = ((relatedRaw as Array<{ id: string; slug: string; category: string | null; featured_image_url: string | null; published_at: string | null }>) || [])
    .map((r) => ({ ...r, tr: relTrsMap.get(r.id)! }))
    .filter((r) => !!r.tr);

  const blocks = await getHomeBlocks(locale);
  const heroEmoji = CATEGORY_EMOJI[post.category || ''] || '📝';
  const backLabel = stripArrow(t('blog.back'));

  return (
    <>
      <ArticleStructuredData post={{
        title: translation.title,
        description: translation.excerpt,
        slug: post.slug,
        cover_url: post.featured_image_url,
        published_at: post.published_at,
        updated_at: post.updated_at,
        author_name: post.author_name,
      }} baseUrl={SITE_URL} />
      <BreadcrumbStructuredData items={[
        { name: 'Início', href: `/${locale}` },
        { name: 'Blog', href: `/${locale}/blog` },
        { name: translation.title, href: `/${locale}/blog/${slug}` },
      ]} baseUrl={SITE_URL} />
      <Header />
      <main className="bg-white min-h-screen">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
          <Link href={'/blog' as any}
            className="group inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-brand-300 text-slate-700 hover:text-brand-700 text-sm font-medium transition-all"
            aria-label={backLabel}>
            <ArrowLeft className="h-4 w-4 -ml-0.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.5} />
            <span>{backLabel}</span>
          </Link>
          <div className="rounded-2xl overflow-hidden border border-slate-200">
            <CoverImage src={post.featured_image_url} alt={translation.title} seed={post.slug}
              category={post.category} emoji={heroEmoji} aspectRatio="21/9" priority />
          </div>
        </section>
        <article className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {post.category && (
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
              {post.category}
            </span>
          )}
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-[1.2] text-balance">
            {translation.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {post.author_name && <span className="font-medium text-slate-700">{post.author_name}</span>}
            {post.published_at && <><span>·</span><span>{fmtDate(post.published_at)}</span></>}
            {translation.reading_time_minutes && <><span>·</span><span>{translation.reading_time_minutes} {t('blog.read_time_unit')}</span></>}
          </div>
          {translation.excerpt && (
            <p className="mt-8 text-xl text-slate-600 leading-relaxed font-light italic border-l-4 border-brand-500 pl-5 text-pretty">
              {translation.excerpt}
            </p>
          )}
          <div className="mt-8 prose prose-slate max-w-none">
            <Markdown source={translation.content_md || ''} />
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          )}
        </article>
        {related.length > 0 && (
          <section className="bg-slate-50 border-t border-slate-100 py-12 sm:py-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-8">{t('blog.related')}</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <Link key={r.id} href={`/blog/${r.slug}` as any} className="group bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition-all">
                    <CoverImage src={r.featured_image_url} alt={r.tr.title} seed={r.slug}
                      category={r.category} emoji={CATEGORY_EMOJI[r.category || ''] || '📝'} aspectRatio="16/10" />
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">{r.tr.title}</h3>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        {r.published_at && <span>{fmtDate(r.published_at)}</span>}
                        {r.tr.reading_time_minutes && <><span>·</span><span>{r.tr.reading_time_minutes} {t('blog.min_unit')}</span></>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
