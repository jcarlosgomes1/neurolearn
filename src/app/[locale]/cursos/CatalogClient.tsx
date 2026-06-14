'use client';

import { useMemo, useState } from 'react';
import { CourseCard } from '@/components/shared/CourseCard';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, X } from 'lucide-react';

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
  const [open, setOpen] = useState(false);

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
    setCat('all'); setLvl('all'); setTyp('all'); setPrice('all');
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg">{t('catalog.empty')}</p>
        <p className="text-sm mt-2">{t('catalog.empty_hint')}</p>
      </div>
    );
  }

  const selectCls = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none';

  // Conteudo dos filtros (reutilizado em desktop inline e em bottom-sheet mobile)
  const filterControls = (
    <>
      {categories.length > 0 && (
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={selectCls} aria-label={t('catalog.f_cat_all')}>
          <option value="all">{t('catalog.f_cat_all')}</option>
          {categories.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      )}
      {levels.length > 0 && (
        <select value={lvl} onChange={(e) => setLvl(e.target.value)} className={selectCls} aria-label={t('catalog.f_level_all')}>
          <option value="all">{t('catalog.f_level_all')}</option>
          {levels.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      )}
      {types.length > 0 && (
        <select value={typ} onChange={(e) => setTyp(e.target.value)} className={selectCls} aria-label={t('catalog.f_type_all')}>
          <option value="all">{t('catalog.f_type_all')}</option>
          {types.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      )}
      <select value={price} onChange={(e) => setPrice(e.target.value as PriceFilter)} className={selectCls} aria-label={t('catalog.f_price_all')}>
        <option value="all">{t('catalog.f_price_all')}</option>
        <option value="free">{t('catalog.f_price_free')}</option>
        <option value="paid">{t('catalog.f_price_paid')}</option>
      </select>
    </>
  );

  return (
    <>
      {/* Barra: procura sempre visivel + botao Filtros */}
      <div className="mb-5 flex items-center gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t('catalog.search_ph')}
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none" />
        </div>
        <button onClick={() => setOpen(true)}
          className="relative inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors shrink-0">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden xs:inline">{t('catalog.filters')}</span>
          {activeFilters > 0 && (
            <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-600 text-white text-[11px] font-bold">{activeFilters}</span>
          )}
        </button>
      </div>

      {/* Desktop: filtros inline */}
      <div className="hidden md:flex items-center gap-3 mb-6 flex-wrap">
        {filterControls}
        {activeFilters > 0 && (
          <button onClick={clearFilters} className="text-xs text-brand-600 hover:underline px-2">
            {t('catalog.clear_filters')} ({activeFilters})
          </button>
        )}
      </div>

      {/* Mobile: bottom-sheet */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <span className="font-bold text-slate-900">{t('catalog.filters_title')}</span>
              <button onClick={() => setOpen(false)} aria-label={t('catalog.filters')} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 overflow-y-auto">
              {filterControls}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-3" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
              {activeFilters > 0 && (
                <button onClick={clearFilters} className="text-sm font-medium text-slate-500 hover:text-slate-700 px-2">
                  {t('catalog.clear_filters')}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="flex-1 btn-primary text-sm py-3">
                {t('catalog.apply')} ({filtered.length})
              </button>
            </div>
          </div>
        </div>
      )}

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
