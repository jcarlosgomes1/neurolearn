'use client';

import { useMemo, useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { CoverImage } from '@/components/shared/CoverImage';
import { useTranslations } from 'next-intl';
import { fmtDate } from '@/lib/utils/cn';
import { SearchX } from 'lucide-react';

interface Post {
  id: string;
  slug: string;
  category: string | null;
  tags: string[] | null;
  featured_image_url: string | null;
  published_at: string | null;
  author_name: string | null;
  tr?: { title: string; excerpt: string | null; reading_time_minutes: number | null } | null;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'Ferramentas': '🛠',
  'Mercado': '📊',
  'Técnico': '⚙️',
  'Tecnico': '⚙️',
  'Prático': '🎯',
  'Pratico': '🎯',
  'Caso de estudo': '💼',
};

const PAGE = 9;

export function BlogClient({ posts }: { posts: Post[] }) {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [visible, setVisible] = useState(PAGE);

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const p of posts) if (p.category) s.add(p.category);
    return Array.from(s).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (!p.tr) return false;
      if (cat !== 'all' && p.category !== cat) return false;
      if (q) {
        const hay = `${p.tr.title} ${p.tr.excerpt || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [posts, search, cat]);

  useEffect(() => { setVisible(PAGE); }, [search, cat]);

  const shown = filtered.slice(0, visible);

  function clearFilters() { setSearch(''); setCat('all'); }

  if (posts.length === 0) return null;

  return (
    <section className="mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24" style={{ maxWidth: 'var(--page-max, 72rem)' }}>
      <div className="mb-4 sm:mb-5">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t('blog.search_ph')}
          className="input text-sm w-full" />
      </div>

      {categories.length > 0 && (
        <div className="mb-6 sm:mb-8 flex flex-wrap gap-2">
          <button onClick={() => setCat('all')} className="text-sm font-medium px-3.5 py-1.5 rounded-full border transition-colors"
            style={cat === 'all' ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : { background: 'var(--card)', color: 'var(--ink-2)', borderColor: 'var(--line)' }}>{t('blog.f_cat_all')}</button>
          {categories.map((x) => (
            <button key={x} onClick={() => setCat(x)} className="text-sm font-medium px-3.5 py-1.5 rounded-full border transition-colors"
              style={cat === x ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : { background: 'var(--card)', color: 'var(--ink-2)', borderColor: 'var(--line)' }}>{x}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <SearchX className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--ink-3)' }} aria-hidden />
          <p className="font-medium" style={{ color: 'var(--ink)' }}>{t('blog.no_match')}</p>
          <button onClick={clearFilters} className="mt-3 text-sm hover:underline" style={{ color: 'var(--accent)' }}>
            {t('blog.clear_filters')}
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm mb-5 sm:mb-6" style={{ color: 'var(--ink-3)' }}>{t('blog.showing', { n: filtered.length })}</p>
          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}` as any} className="group flex flex-col rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
                <CoverImage
                  src={p.featured_image_url}
                  alt={p.tr!.title}
                  seed={p.slug}
                  category={p.category}
                  emoji={CATEGORY_EMOJI[p.category || ''] || '📝'}
                  aspectRatio="16/10"
                />
                <div className="p-5 flex flex-col flex-1">
                  {p.category && <span className="self-start text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3" style={{ color: 'var(--accent)', background: 'var(--accent-tint)' }}>{p.category}</span>}
                  <h3 className="text-lg font-bold leading-snug transition-colors line-clamp-2" style={{ color: 'var(--ink)' }}>{p.tr!.title}</h3>
                  {p.tr!.excerpt && <p className="mt-2 text-sm leading-relaxed line-clamp-3 flex-1" style={{ color: 'var(--ink-2)' }}>{p.tr!.excerpt}</p>}
                  <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: 'var(--ink-3)' }}>
                    {p.published_at && <span>{fmtDate(p.published_at)}</span>}
                    {p.tr!.reading_time_minutes && <><span>·</span><span>{p.tr!.reading_time_minutes} {t('blog.min_read')}</span></>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {filtered.length > visible && (
            <div className="mt-10 sm:mt-12 text-center">
              <button onClick={() => setVisible((v) => v + PAGE)}
                className="inline-flex items-center px-6 py-2.5 rounded-full border text-sm font-semibold transition-colors" style={{ background: 'var(--card)', color: 'var(--ink-2)', borderColor: 'var(--line)' }}>
                {t('blog.load_more')}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
