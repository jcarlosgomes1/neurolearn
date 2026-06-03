'use client';

import { useMemo, useState } from 'react';
import { CourseCard } from '@/components/shared/CourseCard';
import { useTranslations } from 'next-intl';

interface Course {
  id: string;
  title: string;
  subtitle?: string | null;
  emoji?: string | null;
  price_cents: number | null;
  currency: string | null;
  rating_avg: number | null;
  enrollments_count: number | null;
  level: string | null;
  course_type: string | null;
  category: string | null;
  topics: string[] | null;
}

interface Props { courses: Course[] }

type PriceFilter = 'all' | 'free' | 'paid';

export function CatalogClient({ courses }: Props) {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [lvl, setLvl] = useState<string>('all');
  const [typ, setTyp] = useState<string>('all');
  const [price, setPrice] = useState<PriceFilter>('all');

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const c of courses) if (c.category) s.add(c.category);
    return Array.from(s).sort();
  }, [courses]);
  const levels = useMemo(() => {
    const s = new Set<string>();
    for (const c of courses) if (c.level) s.add(c.level);
    return Array.from(s).sort();
  }, [courses]);
  const types = useMemo(() => {
    const s = new Set<string>();
    for (const c of courses) if (c.course_type) s.add(c.course_type);
    return Array.from(s).sort();
  }, [courses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (cat !== 'all' && c.category !== cat) return false;
      if (lvl !== 'all' && c.level !== lvl) return false;
      if (typ !== 'all' && c.course_type !== typ) return false;
      if (price === 'free' && (c.price_cents ?? 0) > 0) return false;
      if (price === 'paid' && (c.price_cents ?? 0) === 0) return false;
      if (q) {
        const hay = `${c.title} ${c.subtitle || ''} ${(c.topics || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [courses, search, cat, lvl, typ, price]);

  const activeFilters = (cat !== 'all' ? 1 : 0) + (lvl !== 'all' ? 1 : 0) + (typ !== 'all' ? 1 : 0) + (price !== 'all' ? 1 : 0);

  function clearFilters() {
    setSearch(''); setCat('all'); setLvl('all'); setTyp('all'); setPrice('all');
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg">{t('catalog.empty')}</p>
        <p className="text-sm mt-2">{t('catalog.empty_hint')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="mb-6 sm:mb-8 bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center flex-wrap">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t('catalog.search_ph')}
          className="input text-sm flex-1 min-w-[180px]" />
        {categories.length > 0 && (
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="input text-sm">
            <option value="all">{t('catalog.f_cat_all')}</option>
            {categories.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        )}
        {levels.length > 0 && (
          <select value={lvl} onChange={(e) => setLvl(e.target.value)} className="input text-sm">
            <option value="all">{t('catalog.f_level_all')}</option>
            {levels.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        )}
        {types.length > 0 && (
          <select value={typ} onChange={(e) => setTyp(e.target.value)} className="input text-sm">
            <option value="all">{t('catalog.f_type_all')}</option>
            {types.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        )}
        <select value={price} onChange={(e) => setPrice(e.target.value as PriceFilter)} className="input text-sm">
          <option value="all">{t('catalog.f_price_all')}</option>
          <option value="free">{t('catalog.f_price_free')}</option>
          <option value="paid">{t('catalog.f_price_paid')}</option>
        </select>
        {activeFilters > 0 && (
          <button onClick={clearFilters} className="text-xs text-brand-600 hover:underline self-center px-2">
            {t('catalog.clear_filters')} ({activeFilters})
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-slate-700 font-medium">{t('catalog.no_match')}</p>
          <button onClick={clearFilters} className="mt-3 text-sm text-brand-600 hover:underline">
            {t('catalog.clear_filters_short')}
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-5 sm:mb-6">{t('catalog.count_available', { count: filtered.length })}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => <CourseCard key={c.id} course={c as any} />)}
          </div>
        </>
      )}
    </>
  );
}
