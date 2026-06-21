'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  category: string | null;
  level: string | null;
  course_type: string | null;
  price_cents: number | null;
  currency: string | null;
  published: boolean;
  featured: boolean;
  archived: boolean;
  enrollments_count: number | null;
  rating_avg: number | null;
  rating_count: number | null;
  approval_status: string | null;
  instructor_id: string;
  created_at: string;
  hero_image_url: string | null;
}

interface TranslationCoverage { course_id: string; lang_code: string }

type StatusFilter = 'all' | 'published' | 'draft' | 'archived' | 'pending_review';

export function CursosClient() {
  const t = useTranslations();
  const [supabase] = useState(() => createClient());
  const [courses, setCourses] = useState<Course[]>([]);
  const [translations, setTranslations] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    const [{ data: cs }, { data: ts }] = await Promise.all([
      supabase.from('nl_courses')
        .select('id, title, category, level, course_type, price_cents, currency, published, featured, archived, enrollments_count, rating_avg, rating_count, approval_status, instructor_id, created_at, hero_image_url')
        .order('created_at', { ascending: false }),
      supabase.from('nl_course_translations').select('course_id, lang_code'),
    ]);
    setCourses((cs as Course[]) || []);
    const coverage: Record<string, string[]> = {};
    for (const r of (ts as TranslationCoverage[]) || []) {
      coverage[r.course_id] = coverage[r.course_id] || [];
      coverage[r.course_id].push(r.lang_code);
    }
    setTranslations(coverage);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const c of courses) if (c.category) s.add(c.category);
    return Array.from(s).sort();
  }, [courses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (statusFilter === 'published' && !c.published) return false;
      if (statusFilter === 'draft' && (c.published || c.archived)) return false;
      if (statusFilter === 'archived' && !c.archived) return false;
      if (statusFilter === 'pending_review' && c.approval_status !== 'pending_review') return false;
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (q && !c.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [courses, statusFilter, categoryFilter, search]);

  async function togglePublished(c: Course) {
    setSavingId(c.id);
    const newVal = !c.published;
    const { error } = await supabase.from('nl_courses').update({ published: newVal, archived: newVal ? false : c.archived }).eq('id', c.id);
    if (error) { toast.error(error.message); }
    else {
      toast.success(newVal ? t('admin_courses.toast_published') : t('admin_courses.toast_unpublished'));
      setCourses((prev) => prev.map((p) => p.id === c.id ? { ...p, published: newVal, archived: newVal ? false : p.archived } : p));
    }
    setSavingId(null);
  }

  async function toggleArchived(c: Course) {
    setSavingId(c.id);
    const newVal = !c.archived;
    if (newVal && c.published) {
      // Archiving auto-unpublishes
      const { error } = await supabase.from('nl_courses').update({ archived: true, published: false }).eq('id', c.id);
      if (error) { toast.error(error.message); }
      else {
        toast.success(t('admin_courses.toast_archived'));
        setCourses((prev) => prev.map((p) => p.id === c.id ? { ...p, archived: true, published: false } : p));
      }
    } else {
      const { error } = await supabase.from('nl_courses').update({ archived: newVal }).eq('id', c.id);
      if (error) { toast.error(error.message); }
      else {
        toast.success(newVal ? t('admin_courses.toast_archived') : t('admin_courses.toast_unarchived'));
        setCourses((prev) => prev.map((p) => p.id === c.id ? { ...p, archived: newVal } : p));
      }
    }
    setSavingId(null);
  }

  function statusBadge(c: Course) {
    if (c.archived) return <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">{t('admin_courses.s_archived')}</span>;
    if (c.published) return <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{t('admin_courses.s_published')}</span>;
    if (c.approval_status === 'pending_review') return <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{t('admin_courses.s_pending_review')}</span>;
    return <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{t('admin_courses.s_draft')}</span>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="📚"
        title={t('admin_courses.title')}
        description={t('admin_courses.hint')}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Link href={'/admin/essential/novo' as any} className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg">{t('admin_courses.btn_manual')}</Link>
            <Link href={'/admin/cursos-todos' as any} className="text-sm bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium px-4 py-2 rounded-lg">{t('admin_courses.btn_all_tenants')}</Link>
            <Link href={'/admin/curso-ia/novo' as any} className="text-sm bg-gradient-to-r from-brand-600 to-purple-600 text-white font-medium px-4 py-2 rounded-lg shadow hover:shadow-md">{t('admin_courses.btn_ai')}</Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="mb-5 bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
        <input type="search" placeholder={t('admin_courses.search_ph')} value={search} onChange={(e) => setSearch(e.target.value)}
          className="input text-sm flex-1 min-w-[180px]" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="input text-sm">
          <option value="all">{t('admin_courses.f_status_all')}</option>
          <option value="published">{t('admin_courses.s_published')}</option>
          <option value="draft">{t('admin_courses.s_draft')}</option>
          <option value="pending_review">{t('admin_courses.s_pending_review')}</option>
          <option value="archived">{t('admin_courses.s_archived')}</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input text-sm">
          <option value="all">{t('admin_courses.f_cat_all')}</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-xs text-slate-500 self-center">{t('admin_courses.showing', { n: filtered.length, total: courses.length })}</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">{t('candlist.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          <div className="text-3xl mb-2">📚</div>
          <p>{t('admin_courses.empty_filtered')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const tx = translations[c.id] || [];
            return (
              <div key={c.id} className={`bg-white rounded-xl border border-slate-200 p-4 ${c.archived ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 text-sm">{c.title}</h3>
                      {statusBadge(c)}
                      {c.featured && <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">★ {t('admin_courses.s_featured')}</span>}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                      {c.category && <span>{c.category}</span>}
                      {c.level && <span>· {c.level}</span>}
                      {c.course_type && <span>· {c.course_type}</span>}
                      {c.price_cents !== null && <span>· {(c.price_cents / 100).toFixed(2)}€</span>}
                      {(c.enrollments_count ?? 0) > 0 && <span>· 🎓 {c.enrollments_count}</span>}
                      {(c.rating_count ?? 0) > 0 && <span>· ⭐ {(c.rating_avg ?? 0).toFixed(1)} ({c.rating_count})</span>}
                    </div>
                    <div className="mt-1.5 text-[11px] text-slate-500">
                      🌍 PT
                      {tx.map((l) => <span key={l} className="ml-1">· {l.toUpperCase()}</span>)}
                      {tx.length < 3 && <span className="ml-2 text-amber-600">· {t('admin_courses.missing_langs')}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap items-start">
                    <button onClick={() => togglePublished(c)} disabled={savingId === c.id || c.archived}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg ${c.published ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} disabled:opacity-50`}>
                      {c.published ? `✓ ${t('admin_courses.btn_unpublish')}` : t('admin_courses.btn_publish')}
                    </button>
                    <button onClick={() => toggleArchived(c)} disabled={savingId === c.id}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50">
                      {c.archived ? t('admin_courses.btn_unarchive') : t('admin_courses.btn_archive')}
                    </button>
                    <Link href={`/admin/curso/${c.id}/editar` as any} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700">
                      {t('admin_courses.col_edit')}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
