'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { Search, Users, GraduationCap, Building2, UserPlus, Loader2, ChevronRight } from 'lucide-react';

const KIND_META: Record<string, { icon: any; cls: string }> = {
  lead: { icon: UserPlus, cls: 'bg-amber-100 text-amber-700' },
  student: { icon: Users, cls: 'bg-sky-100 text-sky-700' },
  instructor: { icon: GraduationCap, cls: 'bg-emerald-100 text-emerald-700' },
  company: { icon: Building2, cls: 'bg-violet-100 text-violet-700' },
};

function hrefFor(kind: string, id: string): string {
  if (kind === 'instructor') return `/admin/instrutor/${id}`;
  if (kind === 'student') return `/admin/users/${id}`;
  if (kind === 'company') return `/admin/empresas/${id}`;
  return `/admin/contactos`;
}

export function CrmHub() {
  const t = useTranslations();
  const [counts, setCounts] = useState<any>(null);
  const [kind, setKind] = useState<string>('');
  const [q, setQ] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (kindF: string, query: string) => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_admin_crm_search', { p_q: query || null, p_kind: kindF || null, p_limit: 100 });
      setRecords((data?.records as any[]) || []);
    } catch { setRecords([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { (async () => { const sb = createClient(); const { data } = await sb.rpc('nl_admin_crm_counts'); setCounts(data); })(); }, []);
  useEffect(() => { const tmo = setTimeout(() => load(kind, q), 250); return () => clearTimeout(tmo); }, [kind, q, load]);

  const total = counts ? (counts.lead || 0) + (counts.student || 0) + (counts.instructor || 0) + (counts.company || 0) : null;
  const chips: { k: string; label: string; n: number | null }[] = [
    { k: '', label: t('crm.all'), n: total },
    { k: 'lead', label: t('crm.leads'), n: counts?.lead ?? null },
    { k: 'student', label: t('crm.students'), n: counts?.student ?? null },
    { k: 'instructor', label: t('crm.instructors'), n: counts?.instructor ?? null },
    { k: 'company', label: t('crm.companies'), n: counts?.company ?? null },
  ];

  return (
    <>
      <AppPageHeader backHref="/admin" title={`🗂️ ${t('crm.title')}`} description={t('crm.subtitle')} />

      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('crm.search_ph')}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {chips.map((c) => (
          <button key={c.k} type="button" onClick={() => setKind(c.k)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${kind === c.k ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
            {c.label}{typeof c.n === 'number' ? ` · ${c.n}` : ''}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-1.5">
        {loading ? (
          <div className="flex justify-center py-10 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : records.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">{t('crm.empty')}</p>
        ) : records.map((r) => {
          const meta = KIND_META[r.kind] || KIND_META.lead; const Icon = meta.icon;
          return (
            <Link key={`${r.kind}-${r.id}`} href={hrefFor(r.kind, r.id) as any}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm transition-all">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${meta.cls}`}><Icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-sm truncate">{r.name}</span>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${meta.cls}`}>{t('crm.kind_' + r.kind)}</span>
                </div>
                <div className="text-xs text-slate-500 truncate">{r.email || '—'}</div>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <div className="text-[11px] text-slate-400 capitalize">{r.stage}</div>
                {r.metric != null && <div className="text-xs font-semibold text-slate-600">{Math.round(r.metric)} <span className="text-slate-400 font-normal">{t('crm.m_' + r.metric_label)}</span></div>}
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
            </Link>
          );
        })}
      </div>
    </>
  );
}
