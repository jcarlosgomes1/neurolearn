import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { CoverImage } from '@/components/shared/CoverImage';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { fmtDate } from '@/lib/utils/cn';
import { getTranslations } from 'next-intl/server';

export const revalidate = 300;
export const metadata = { title: 'Blog · NeuroLearn' };

type Post = {
  id: string;
  slug: string;
  category: string | null;
  tags: string[] | null;
  featured_image_url: string | null;
  published_at: string | null;
  author_name: string | null;
};

type Translation = {
  post_id: string;
  lang: string;
  title: string;
  excerpt: string | null;
  reading_time_minutes: number | null;
};

const CATEGORY_EMOJI: Record<string, string> = {
  'Ferramentas': '🛠',
  'Mercado': '📊',
  'Técnico': '⚙️',
  'Tecnico': '⚙️',
  'Prático': '🎯',
  'Pratico': '🎯',
  'Caso de estudo': '💼',
};

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: posts } = await sb.from('nl_blog_posts')
    .select('id, slug, category, tags, featured_image_url, published_at, author_name')
    .not('published_at', 'is', null).order('published_at', { ascending: false }).limit(24);
  const ids = (posts || []).map((p: Post) => p.id);
  const { data: trs } = ids.length ? await sb.from('nl_blog_post_translations')
    .select('post_id, lang, title, excerpt, reading_time_minutes').in('post_id', ids) : { data: [] };
  const trsByPost = new Map<string, Translation>();
  ((trs as Translation[]) || []).forEach((tr) => {
    const existing = trsByPost.get(tr.post_id);
    if (!existing || (tr.lang === locale && existing.lang !== locale) || (tr.lang === 'pt' && existing.lang !== locale && existing.lang !== 'pt')) {
      trsByPost.set(tr.post_id, tr);
    }
  });
  const blocks = await getHomeBlocks(locale);
  const enriched = ((posts as Post[]) || []).map((p) => ({ ...p, tr: trsByPost.get(p.id) }));
  const [hero, ...rest] = enriched;

  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-6 sm:pb-10">
          <div className="text-center sm:text-left max-w-2xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-700 bg-brand-50 px-3 py-1 rounded-full mb-4">{t('blog.eyebrow')}</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">{t('blog.title')}</h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">{t('blog.subtitle')}</p>
          </div>
        </section>

        {enriched.length === 0 ? (
          <section className="max-w-3xl mx-auto px-4 py-16 text-center">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-lg text-slate-500">{t('blog.empty')}</p>
          </section>
        ) : (
          <>
            {hero && hero.tr && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
                <Link href={`/blog/${hero.slug}` as any} className="group block bg-slate-50 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="grid md:grid-cols-2 gap-0">
                    <CoverImage
                      src={hero.featured_image_url}
                      alt={hero.tr.title}
                      seed={hero.slug}
                      category={hero.category}
                      emoji={CATEGORY_EMOJI[hero.category || ''] || '📝'}
                      aspectRatio="16/10"
                      priority
                    />
                    <div className="p-6 sm:p-10 flex flex-col justify-center">
                      {hero.category && <span className="self-start text-xs font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full mb-4">{hero.category}</span>}
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight group-hover:text-brand-700 transition-colors">{hero.tr.title}</h2>
                      {hero.tr.excerpt && <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed line-clamp-3">{hero.tr.excerpt}</p>}
                      <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
                        {hero.author_name && <span>{hero.author_name}</span>}
                        {hero.published_at && <><span>·</span><span>{fmtDate(hero.published_at)}</span></>}
                        {hero.tr.reading_time_minutes && <><span>·</span><span>{hero.tr.reading_time_minutes} {t('blog.min_read')}</span></>}
                      </div>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {rest.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
                <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.filter((p) => p.tr).map((p) => (
                    <Link key={p.id} href={`/blog/${p.slug}` as any} className="group flex flex-col bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300">
                      <CoverImage
                        src={p.featured_image_url}
                        alt={p.tr!.title}
                        seed={p.slug}
                        category={p.category}
                        emoji={CATEGORY_EMOJI[p.category || ''] || '📝'}
                        aspectRatio="16/10"
                      />
                      <div className="p-5 flex flex-col flex-1">
                        {p.category && <span className="self-start text-[11px] font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full mb-3">{p.category}</span>}
                        <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">{p.tr!.title}</h3>
                        {p.tr!.excerpt && <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3 flex-1">{p.tr!.excerpt}</p>}
                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                          {p.published_at && <span>{fmtDate(p.published_at)}</span>}
                          {p.tr!.reading_time_minutes && <><span>·</span><span>{p.tr!.reading_time_minutes} {t('blog.min_read')}</span></>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
