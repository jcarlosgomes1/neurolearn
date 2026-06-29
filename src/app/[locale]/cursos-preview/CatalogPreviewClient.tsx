'use client';
import { useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { fmtCents } from '@/lib/utils/cn';
import { SlidersHorizontal, Star, Users, Layers } from 'lucide-react';

interface Course {
  id: string; title: string; subtitle?: string | null; emoji?: string | null;
  price_cents: number | null; currency: string | null; rating_avg: number | null;
  rating_count?: number | null; enrollments_count: number | null; level: string | null;
  course_type: string | null; category: string | null; topics: string[] | null;
  available_langs?: string[] | null; hero_image_url?: string | null;
}
interface CatNode { slug: string; parent: string | null; name: string; track: string | null }
type PriceFilter = 'all' | 'free' | 'paid';

const INK = 'rgb(28 25 22)', INK2 = 'rgb(92 84 76)', INK3 = 'rgb(154 144 133)', LINE = 'rgb(233 229 222)';

function PreviewCard({ course, ratingMin, enrollMin }: { course: Course; ratingMin: number; enrollMin: number }) {
  const locale = useLocale();
  const showRating = (course.rating_count ?? 0) >= ratingMin && !!course.rating_avg;
  const showEnroll = (course.enrollments_count ?? 0) >= enrollMin;
  const isFree = !course.price_cents || course.price_cents === 0;
  return (
    <Link href={`/curso/${course.id}` as any} className="group flex flex-col rounded-2xl overflow-hidden bg-white transition-all hover:shadow-[0_12px_32px_-12px_rgba(66,61,55,0.25)]" style={{ border: `1px solid ${LINE}` }}>
      {/* imagem */}
      <div className="aspect-[16/10] w-full overflow-hidden relative" style={{ backgroundColor: 'rgb(245 243 239)' }}>
        {course.hero_image_url ? (
          <img src={course.hero_image_url} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">{course.emoji || '📚'}</div>
        )}
        {course.level && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-sm" style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: INK2 }}>{course.level}</span>
        )}
      </div>
      {/* corpo */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-display font-bold leading-snug" style={{ fontSize: '1.2rem', color: INK }}>{course.title}</h3>
        {course.subtitle && <p className="mt-2 text-sm leading-relaxed line-clamp-2" style={{ color: INK2 }}>{course.subtitle}</p>}
        <div className="mt-3 flex items-center gap-3 text-xs flex-wrap" style={{ color: INK3 }}>
          {showEnroll && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {Number(course.enrollments_count).toLocaleString(locale)}</span>}
          {showRating && <span className="inline-flex items-center gap-1" style={{ color: 'rgb(180 88 58)' }}><Star className="h-3.5 w-3.5 fill-current" /> {Number(course.rating_avg).toFixed(1)}</span>}
        </div>
        <div className="mt-auto pt-4 flex items-center justify-between">
          {isFree ? (
            <span className="font-display font-bold text-lg" style={{ color: 'rgb(15 138 128)' }}>Grátis</span>
          ) : (
            <span className="font-display font-bold text-lg" style={{ color: INK }}>{fmtCents(course.price_cents!, course.currency || 'EUR')}</span>
          )}
          <span className="text-xs font-semibold transition-colors" style={{ color: 'rgb(180 88 58)' }}>Ver curso →</span>
        </div>
      </div>
    </Link>
  );
}

export function CatalogPreviewClient({ courses, cats = [], ratingMin = 5, enrollMin = 25 }: { courses: Course[]; cats?: CatNode[]; ratingMin?: number; enrollMin?: number }) {
  const t = useTranslations();
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [lvl, setLvl] = useState('all');
  const [price, setPrice] = useState<PriceFilter>('all');
  const [open, setOpen] = useState(false);

  const parentOf = useMemo(() => { const m: Record<string, string | null> = {}; for (const c of cats) m[c.slug] = c.parent; return m; }, [cats]);
  const tops = useMemo(() => cats.filter((c) => !c.parent), [cats]);
  const levels = useMemo(() => { const s = new Set<string>(); for (const c of courses) if (c.level) s.add(c.level); return Array.from(s).sort(); }, [courses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (cat !== 'all' && c.category !== cat && parentOf[c.category || ''] !== cat) return false;
      if (lvl !== 'all' && c.level !== lvl) return false;
      if (price === 'free' && (c.price_cents ?? 0) > 0) return false;
      if (price === 'paid' && (c.price_cents ?? 0) === 0) return false;
      if (q) { const hay = `${c.title} ${c.subtitle || ''} ${(c.topics || []).join(' ')}`.toLowerCase(); if (!hay.includes(q)) return false; }
      return true;
    });
  }, [courses, search, cat, lvl, price, parentOf]);

  const activeFilters = (cat !== 'all' ? 1 : 0) + (lvl !== 'all' ? 1 : 0) + (price !== 'all' ? 1 : 0);
  function clearFilters() { setCat('all'); setLvl('all'); setPrice('all'); }
  const selectCls = 'w-full rounded-lg bg-white px-3 py-2.5 text-sm outline-none';

  return (
    <>
      <div className="mb-6 flex items-center gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: INK3 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('catalog.search_ph')}
            className="w-full rounded-lg bg-white pl-10 pr-3 py-2.5 text-sm outline-none" style={{ border: `1px solid ${LINE}` }} />
        </div>
        <button onClick={() => setOpen((v) => !v)} className="relative inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors shrink-0 bg-white" style={{ border: `1px solid ${LINE}`, color: INK2 }}>
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">{t('catalog.filters')}</span>
          {activeFilters > 0 && <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-white text-[11px] font-bold" style={{ backgroundColor: 'rgb(180 88 58)' }}>{activeFilters}</span>}
        </button>
      </div>

      {open && (
        <div className="mb-6 grid grid-cols-2 lg:grid-cols-3 gap-3 rounded-xl p-3 bg-white" style={{ border: `1px solid ${LINE}` }}>
          {tops.length > 0 && (
            <select value={cat} onChange={(e) => setCat(e.target.value)} className={selectCls} style={{ border: `1px solid ${LINE}` }}>
              <option value="all">{t('catalog.f_cat_all')}</option>
              {tops.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          )}
          {levels.length > 0 && (
            <select value={lvl} onChange={(e) => setLvl(e.target.value)} className={selectCls} style={{ border: `1px solid ${LINE}` }}>
              <option value="all">{t('catalog.f_level_all')}</option>
              {levels.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          )}
          <select value={price} onChange={(e) => setPrice(e.target.value as PriceFilter)} className={selectCls} style={{ border: `1px solid ${LINE}` }}>
            <option value="all">{t('catalog.f_price_all')}</option>
            <option value="free">{t('catalog.f_price_free')}</option>
            <option value="paid">{t('catalog.f_price_paid')}</option>
          </select>
          {activeFilters > 0 && <button onClick={clearFilters} className="text-xs col-span-full text-left px-1" style={{ color: 'rgb(180 88 58)' }}>{t('catalog.clear_filters')}</button>}
        </div>
      )}

      <p className="text-sm mb-6" style={{ color: INK3 }}>{t('catalog.count_available', { count: filtered.length })}</p>

      {filtered.length === 0 ? (
        <div className="text-center py-16"><div className="text-4xl mb-2">🔍</div><p className="font-medium" style={{ color: INK2 }}>{t('catalog.no_match')}</p></div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => <PreviewCard key={c.id} course={c} ratingMin={ratingMin} enrollMin={enrollMin} />)}
        </div>
      )}
    </>
  );
}
