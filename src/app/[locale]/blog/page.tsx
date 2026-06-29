import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { PageHero } from '@/components/shared/PageHero';
import { Link } from '@/i18n/routing';
import { CoverImage } from '@/components/shared/CoverImage';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { fmtDate } from '@/lib/utils/cn';
import { getTranslations } from 'next-intl/server';
import { BlogClient } from './BlogClient';

export const revalidate = 300;

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t('blog.meta_title') };
}

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
    .not('published_at', 'is', null).order('published_at', { ascending: false }).limit(48);
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
  const enriched = ((posts as Post[]) || []).map((p) => ({ ...p, tr: trsByPost.get(p.id) || null }));
  const [hero, ...rest] = enriched;

  return (
    <>
      <Header />
      <main className="min-h-screen" style={{ background: 'var(--paper)' }}>
        <PageHero badge={t('blog.eyebrow')} title={t('blog.title')} subtitle={t('blog.subtitle')} />

        {enriched.length === 0 ? (
          <section className="max-w-3xl mx-auto px-4 py-16 text-center">
            <p className="text-lg" style={{ color: 'var(--ink-3)' }}>{t('blog.empty')}</p>
          </section>
        ) : (
          <>
            {hero && hero.tr && (
              <section className="mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16" style={{ maxWidth: 'var(--page-max, 72rem)' }}>
                <Link href={`/blog/${hero.slug}` as any} className="group block rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
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
                      {hero.category && <span className="self-start text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4" style={{ color: 'var(--accent)', background: 'var(--accent-tint)' }}>{hero.category}</span>}
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight transition-colors" style={{ color: 'var(--ink)' }}>{hero.tr.title}</h2>
                      {hero.tr.excerpt && <p className="mt-4 text-base sm:text-lg leading-relaxed line-clamp-3" style={{ color: 'var(--ink-2)' }}>{hero.tr.excerpt}</p>}
                      <div className="mt-6 flex items-center gap-3 text-sm" style={{ color: 'var(--ink-3)' }}>
                        {hero.author_name && <span>{hero.author_name}</span>}
                        {hero.published_at && <><span>·</span><span>{fmtDate(hero.published_at)}</span></>}
                        {hero.tr.reading_time_minutes && <><span>·</span><span>{hero.tr.reading_time_minutes} {t('blog.min_read')}</span></>}
                      </div>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {rest.length > 0 && <BlogClient posts={rest} />}
          </>
        )}

        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
