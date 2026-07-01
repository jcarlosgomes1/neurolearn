'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { Search, Users, GraduationCap, Building2, UserPlus, Loader2, ChevronRight, X, ArrowUpRight } from 'lucide-react';
import { UserDetailClient } from '@/app/[locale]/admin/users/[id]/UserDetailClient';
import { InstructorDossier } from '@/app/[locale]/admin/instrutor/[id]/InstructorDossier';

const KIND_META: Record<string, { icon: any; cls: string }> = {
  lead: { icon: UserPlus, cls: 'bg-amber-100 text-amber-700' },
  student: { icon: Users, cls: 'bg-sky-100 text-sky-700' },
  instructor: { icon: GraduationCap, cls: 'bg-emerald-100 text-emerald-700' },
  company: { icon: Building2, cls: 'bg-violet-100 text-violet-700' },
};
const STAT_LABEL: Record<string, string> = {
  score: 'Score', segmento: 'Segmento', consentimento: 'Consentimento', origem: 'Origem',
  plano: 'Plano', lugares: 'Lugares', membros: 'Membros', pais: 'País',
};

export function CrmHub() {
  const t = useTranslations();
  const [counts, setCounts] = useState<any>(null);
  const [kind, setKind] = useState<string>('');
  const [q, setQ] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<{ kind: string; id: string } | null>(null);
  const [rec, setRec] = useState<any>(null);
  const [recLoading, setRecLoading] = useState(false);

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

  const openRecord = useCallback(async (r: { kind: string; id: string }) => {
    setSel(r); setRec(null);
    if (r.kind === 'lead' || r.kind === 'company') {
      setRecLoading(true);
      try { const sb = createClient(); const { data } = await sb.rpc('nl_admin_crm_record', { p_kind: r.kind, p_id: r.id }); setRec(data?.ok ? data : null); }
      catch { setRec(null); } finally { setRecLoading(false); }
    }
  }, []);

  const total = counts ? (counts.lead || 0) + (counts.student || 0) + (counts.instructor || 0) + (counts.company || 0) : null;
  const chips: { k: string; label: string; n: number | null }[] = [
    { k: '', label: t('crm.all'), n: total },
    { k: 'lead', label: t('crm.leads'), n: counts?.lead ?? null },
    { k: 'student', label: t('crm.students'), n: counts?.student ?? null },
    { k: 'instructor', label: t('crm.instructors'), n: counts?.instructor ?? null },
    { k: 'company', label: t('crm.companies'), n: counts?.company ?? null },
  ];

  const meta = sel ? (KIND_META[sel.kind] || KIND_META.lead) : null;

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
          const m = KIND_META[r.kind] || KIND_META.lead; const Icon = m.icon;
          return (
            <button key={`${r.kind}-${r.id}`} type="button" onClick={() => openRecord({ kind: r.kind, id: r.id })}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm transition-all text-left">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${m.cls}`}><Icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-sm truncate">{r.name}</span>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${m.cls}`}>{t('crm.kind_' + r.kind)}</span>
                </div>
                <div className="text-xs text-slate-500 truncate">{r.email || '—'}</div>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <div className="text-[11px] text-slate-400 capitalize">{r.stage}</div>
                {r.metric != null && <div className="text-xs font-semibold text-slate-600">{Math.round(r.metric)} <span className="text-slate-400 font-normal">{t('crm.m_' + r.metric_label)}</span></div>}
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Ficha 360 — tudo dentro do CRM, sem sair */}
      {sel && meta && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSel(null)}>
          <div className="absolute inset-0 bg-slate-900/25 backdrop-blur-[1px]" />
          <div className="relative w-full max-w-3xl bg-slate-50 h-full shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 inline-flex items-center gap-2">
                <span className={`h-6 w-6 rounded-md flex items-center justify-center ${meta.cls}`}><meta.icon className="h-3.5 w-3.5" /></span>
                {t('crm.record_360')} · {t('crm.kind_' + sel.kind)}
              </span>
              <button type="button" onClick={() => setSel(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-4">
              {sel.kind === 'student' ? (
                <UserDetailClient userId={sel.id} embedded />
              ) : sel.kind === 'instructor' ? (
                <InstructorDossier instructorId={sel.id} />
              ) : recLoading ? (
                <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : !rec ? (
                <p className="text-sm text-slate-400 text-center py-16">{t('crm.record_unavailable')}</p>
              ) : (() => {
                const idn = rec.identity || {};
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${meta.cls}`}>
                        {idn.avatar ? <img src={idn.avatar} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <meta.icon className="h-6 w-6" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{idn.name || '—'}</div>
                        <div className="text-xs text-slate-500 truncate">{idn.email || '—'}</div>
                        {idn.phone && <div className="text-xs text-slate-400">{idn.phone}</div>}
                      </div>
                      {rec.stage && <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{rec.stage}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(rec.stats || []).map((s: any, idx: number) => (
                        <div key={idx} className="rounded-lg border border-slate-200 bg-white p-2.5">
                          <div className="text-[10px] uppercase tracking-wider text-slate-400">{STAT_LABEL[s.label] || s.label}</div>
                          <div className="text-sm font-bold text-slate-900 mt-0.5">{String(s.value)}</div>
                        </div>
                      ))}
                    </div>
                    {(rec.context || []).length > 0 && (
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{STAT_LABEL[rec.context_title] || rec.context_title}</div>
                        <ul className="space-y-1">
                          {(rec.context || []).map((c: any, idx: number) => (
                            <li key={idx} className="text-sm text-slate-700 flex justify-between gap-3 border-b border-slate-50 py-1 last:border-0">
                              <span className="truncate">{c.k}</span>
                              {c.v && <span className="text-slate-400 text-xs shrink-0">{c.v}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {rec.deep_href && (
                      <Link href={rec.deep_href as any} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
                        {t('crm.open_full')} <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
