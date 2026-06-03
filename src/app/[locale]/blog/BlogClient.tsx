'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';
import { CoverImage } from '@/components/shared/CoverImage';
import { useTranslations } from 'next-intl';
import { fmtDate } from '@/lib/utils/cn';

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

export function BlogClient({ posts }: { posts: Post[] }) {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<string>('all');

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

  const activeFilters = (cat !== 'all' ? 1 : 0);

  function clearFilters() { setSearch(''); setCat('all'); }

  if (posts.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
      <div className="mb-6 sm:mb-8 bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center flex-wrap">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t('blog.search_ph')}
          className="input text-sm flex-1 min-w-[180px]" />
        {categories.length > 0 && (
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="input text-sm">
            <option value="all">{t('blog.f_cat_all')}</option>
            {categories.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        )}
        {(activeFilters > 0 || search) && (
          <button onClick={clearFilters} className="text-xs text-brand-600 hover:underline self-center px-2">
            {t('blog.clear_filters')}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-slate-700 font-medium">{t('blog.no_match')}</p>
          <button onClick={clearFilters} className="mt-3 text-sm text-brand-600 hover:underline">
            {t('blog.clear_filters')}
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-5 sm:mb-6">{t('blog.showing', { n: filtered.length })}</p>
          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
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
        </>
      )}
    </section>
  );
}
