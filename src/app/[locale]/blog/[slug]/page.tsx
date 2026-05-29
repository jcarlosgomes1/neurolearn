import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Markdown } from '@/components/shared/Markdown';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { fmtDate } from '@/lib/utils/cn';
import { notFound } from 'next/navigation';

export const revalidate = 300;

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const sb = await createClient();
  const { data: post } = await sb.from('nl_blog_posts').select('id, slug, category, featured_image_url, published_at, author_name').eq('slug', slug).not('published_at', 'is', null).maybeSingle();
  if (!post) notFound();

  const { data: t } = await sb.from('nl_blog_post_translations').select('title, excerpt, content_md, lang, reading_time_minutes').eq('post_id', post.id).or(`lang.eq.${locale},lang.eq.pt`);
  const translation = t?.find((x) => x.lang === locale) || t?.[0];
  if (!translation) notFound();

  const blocks = await getHomeBlocks(locale);

  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <Link href={'/blog' as any} className="text-sm text-brand-600 hover:underline mb-4 inline-block">← Todos os artigos</Link>
          {post.category && <span className="inline-block text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full mb-3">{post.category}</span>}
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">{translation.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {post.author_name && <span>{post.author_name}</span>}
            {post.published_at && <span>·</span>}
            {post.published_at && <span>{fmtDate(post.published_at)}</span>}
            {translation.reading_time_minutes && <><span>·</span><span>{translation.reading_time_minutes} min de leitura</span></>}
          </div>
          {post.featured_image_url && <img src={post.featured_image_url} alt={translation.title} className="w-full rounded-xl mt-8" />}
          {translation.excerpt && <p className="mt-8 text-lg text-slate-600 leading-relaxed text-pretty">{translation.excerpt}</p>}
          <div className="mt-8 prose prose-slate max-w-none"><Markdown source={translation.content_md || ''} /></div>
        </article>
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
