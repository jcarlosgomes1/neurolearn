import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { fmtDate } from '@/lib/utils/cn';

export const revalidate = 120;
export const metadata = { title: 'Blog' };

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: translations } = await sb.from('nl_blog_post_translations').select('post_id, title, excerpt, lang').eq('lang', locale).limit(30);
  const postIds = (translations || []).map((t) => t.post_id);

  let posts: any[] = [];
  if (postIds.length > 0) {
    const { data } = await sb.from('nl_blog_posts').select('id, slug, category, featured_image_url, published_at, author_name').in('id', postIds).not('published_at', 'is', null).order('published_at', { ascending: false });
    posts = (data || []).map((p) => {
      const t = translations!.find((tr) => tr.post_id === p.id);
      return { ...p, title: t?.title, excerpt: t?.excerpt };
    });
  }
  const blocks = await getHomeBlocks(locale);

  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <PageHeader badge="📝 Blog" title="Aprende com os nossos artigos" subtitle="Tutoriais, casos de estudo e novidades do mundo da IA, escritos por especialistas." />
        <section className="max-w-6xl mx-auto px-4 py-12">
          {posts.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="text-lg">Em breve — primeiros artigos a caminho.</p>
              <Link href="/" className="mt-4 inline-block text-brand-600 hover:underline">← Voltar à página inicial</Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}` as any} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-brand-200 transition-all flex flex-col">
                  {p.featured_image_url && <img src={p.featured_image_url} alt={p.title} className="w-full h-40 object-cover rounded-lg mb-4" />}
                  {p.category && <span className="inline-block w-fit text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full mb-2">{p.category}</span>}
                  <h2 className="font-semibold text-slate-900 text-lg leading-snug">{p.title}</h2>
                  {p.excerpt && <p className="mt-2 text-sm text-slate-600 line-clamp-3">{p.excerpt}</p>}
                  <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate-500">
                    {p.author_name && <span>{p.author_name}</span>}
                    {p.published_at && <span>{fmtDate(p.published_at)}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
