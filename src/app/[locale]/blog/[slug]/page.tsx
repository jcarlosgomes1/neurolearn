import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Markdown } from '@/components/shared/Markdown';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { fmtDate } from '@/lib/utils/cn';
import { notFound } from 'next/navigation';

export const revalidate = 300;

interface BlogPost {
  id: string;
  slug: string;
  category: string | null;
  tags: string[] | null;
  featured_image_url: string | null;
  published_at: string | null;
  author_name: string | null;
}

interface Translation {
  post_id?: string;
  lang: string;
  title: string;
  excerpt: string | null;
  content_md: string | null;
  reading_time_minutes: number | null;
}

interface RelatedItem {
  id: string;
  slug: string;
  category: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  tr: Translation;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const sb = await createClient();
  const { data: post } = await sb.from('nl_blog_posts')
    .select('id, slug, category, tags, featured_image_url, published_at, author_name')
    .eq('slug', slug).not('published_at', 'is', null).maybeSingle<BlogPost>();
  if (!post) notFound();

  const { data: t } = await sb.from('nl_blog_post_translations')
    .select('lang, title, excerpt, content_md, reading_time_minutes')
    .eq('post_id', post.id).or(`lang.eq.${locale},lang.eq.pt`);
  const translation = (t as Translation[] | null)?.find((x) => x.lang === locale) || (t as Translation[] | null)?.[0];
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

  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        {post.featured_image_url && (
          <div className="relative h-[40vh] sm:h-[55vh] max-h-[600px] w-full overflow-hidden bg-slate-100">
            <img src={post.featured_image_url} alt={translation.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/40" />
          </div>
        )}

        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="mb-6 sm:mb-8">
            <Link href={'/blog' as any} className="text-sm text-brand-600 hover:underline">← Todos os artigos</Link>
          </div>

          {post.category && <span className="inline-block text-xs font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full mb-4">{post.category}</span>}

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-[1.15] text-balance">{translation.title}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {post.author_name && <span className="font-medium text-slate-700">{post.author_name}</span>}
            {post.published_at && <><span>·</span><span>{fmtDate(post.published_at)}</span></>}
            {translation.reading_time_minutes && <><span>·</span><span>{translation.reading_time_minutes} min de leitura</span></>}
          </div>

          {translation.excerpt && (
            <p className="mt-8 text-xl text-slate-600 leading-relaxed font-light italic border-l-4 border-brand-500 pl-5 text-pretty">{translation.excerpt}</p>
          )}

          <div className="mt-10 prose prose-slate prose-lg max-w-none">
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
          <section className="bg-slate-50 py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-8">Continua a ler</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <Link key={r.id} href={`/blog/${r.slug}` as any} className="group bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition-all">
                    {r.featured_image_url ? (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img src={r.featured_image_url} alt={r.tr.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-5xl">📝</div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">{r.tr.title}</h3>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        {r.published_at && <span>{fmtDate(r.published_at)}</span>}
                        {r.tr.reading_time_minutes && <><span>·</span><span>{r.tr.reading_time_minutes} min</span></>}
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
