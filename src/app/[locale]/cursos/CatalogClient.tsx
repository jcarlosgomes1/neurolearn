'use client';

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CourseCard } from '@/components/shared/CourseCard';
import { useTranslations, useLocale } from 'next-intl';
import { SlidersHorizontal, X } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  subtitle?: string | null;
  emoji?: string | null;
  price_cents: number | null;
  currency: string | null;
  rating_avg: number | null;
  rating_count?: number | null;
  enrollments_count: number | null;
  level: string | null;
  course_type: string | null;
  category: string | null;
  topics: string[] | null;
  available_langs?: string[] | null;
}

interface CatNode { slug: string; parent: string | null; name: string; track: string | null }
interface Props { courses: Course[]; cats?: CatNode[]; initialCat?: string; ratingMin?: number; enrollMin?: number }

type PriceFilter = 'all' | 'free' | 'paid';

export function CatalogClient({ courses, cats = [], initialCat = 'all', ratingMin = 5, enrollMin = 25 }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<string>(initialCat);
  const [lvl, setLvl] = useState<string>('all');
  const [price, setPrice] = useState<PriceFilter>('all');
  const [onlyMyLang, setOnlyMyLang] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!open) return;
    // Mobile: bottom-sheet (bloqueia scroll). Desktop: painel inline (nao bloqueia).
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const parentOf = useMemo(() => { const m: Record<string, string | null> = {}; for (const c of cats) m[c.slug] = c.parent; return m; }, [cats]);
  const tops = useMemo(() => cats.filter((c) => !c.parent), [cats]);
  const levels = useMemo(() => {
    const s = new Set<string>();
    for (const c of courses) if (c.level) s.add(c.level);
    return Array.from(s).sort();
  }, [courses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (cat !== 'all' && c.category !== cat && parentOf[c.category || ''] !== cat) return false;
      if (lvl !== 'all' && c.level !== lvl) return false;
      if (price === 'free' && (c.price_cents ?? 0) > 0) return false;
      if (price === 'paid' && (c.price_cents ?? 0) === 0) return false;
      if (onlyMyLang && !(c.available_langs || []).includes(locale)) return false;
      if (q) {
        const hay = `${c.title} ${c.subtitle || ''} ${(c.topics || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [courses, search, cat, lvl, price, onlyMyLang, locale, parentOf]);

  const activeFilters = (cat !== 'all' ? 1 : 0) + (lvl !== 'all' ? 1 : 0) + (price !== 'all' ? 1 : 0) + (onlyMyLang ? 1 : 0);

  function clearFilters() {
    setCat('all'); setLvl('all'); setPrice('all'); setOnlyMyLang(false);
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
      {tops.length > 0 && (
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={selectCls} aria-label={t('catalog.f_cat_all')}>
          <option value="all">{t('catalog.f_cat_all')}</option>
          {tops.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      )}
      {levels.length > 0 && (
        <select value={lvl} onChange={(e) => setLvl(e.target.value)} className={selectCls} aria-label={t('catalog.f_level_all')}>
          <option value="all">{t('catalog.f_level_all')}</option>
          {levels.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      )}
      <select value={price} onChange={(e) => setPrice(e.target.value as PriceFilter)} className={selectCls} aria-label={t('catalog.f_price_all')}>
        <option value="all">{t('catalog.f_price_all')}</option>
        <option value="free">{t('catalog.f_price_free')}</option>
        <option value="paid">{t('catalog.f_price_paid')}</option>
      </select>
      <label className="inline-flex items-center gap-2 cursor-pointer select-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 hover:border-slate-300 transition-colors">
        <input type="checkbox" checked={onlyMyLang} onChange={(e) => setOnlyMyLang(e.target.checked)} className="accent-brand-600 h-4 w-4" />
        🌐 {t('catalog.only_my_lang')}
      </label>
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
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open}
          className={`relative inline-flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors shrink-0 ${open ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}>
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden xs:inline">{t('catalog.filters')}</span>
          {activeFilters > 0 && (
            <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-600 text-white text-[11px] font-bold">{activeFilters}</span>
          )}
        </button>
      </div>

      {/* Desktop: painel de filtros colapsavel (abre pelo botao Filtros) */}
      {open && (
        <div className="hidden md:block mb-6 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {filterControls}
          </div>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="mt-2 text-xs text-brand-600 hover:underline px-1">
              {t('catalog.clear_filters')} ({activeFilters})
            </button>
          )}
        </div>
      )}

      {/* Mobile: bottom-sheet (portal para o body: escapa a ancestrais com transform) */}
      {open && mounted && createPortal(
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
      , document.body)}

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
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {filtered.map((c) => <CourseCard key={c.id} course={c as any} ratingMin={ratingMin} enrollMin={enrollMin} />)}
          </div>
        </>
      )}
    </>
  );
}
