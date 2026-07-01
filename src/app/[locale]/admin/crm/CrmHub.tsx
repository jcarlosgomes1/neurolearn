'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { Search, Users, GraduationCap, Building2, UserPlus, Loader2, ChevronRight, ArrowLeft, Mail, Phone, Calendar } from 'lucide-react';

const KIND_META: Record<string, { icon: any; cls: string }> = {
  lead: { icon: UserPlus, cls: 'bg-amber-100 text-amber-700' },
  student: { icon: Users, cls: 'bg-sky-100 text-sky-700' },
  instructor: { icon: GraduationCap, cls: 'bg-emerald-100 text-emerald-700' },
  company: { icon: Building2, cls: 'bg-violet-100 text-violet-700' },
};

function fmtDate(s?: string) { if (!s) return null; try { return new Date(s).toLocaleDateString('pt-PT'); } catch { return null; } }

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
    setSel(r); setRec(null); setRecLoading(true);
    try { const sb = createClient(); const { data } = await sb.rpc('nl_admin_crm_record', { p_kind: r.kind, p_id: r.id }); setRec(data?.ok ? data : null); }
    catch { setRec(null); } finally { setRecLoading(false); }
  }, []);

  // ---------- DETALHE (mesma pÃ¡gina) ----------
  if (sel) {
    const meta = KIND_META[sel.kind] || KIND_META.lead; const Icon = meta.icon;
    const idn = rec?.identity || {};
    return (
      <>
        <button type="button" onClick={() => { setSel(null); setRec(null); }} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4">
          <ArrowLeft className="h-4 w-4" /> {t('crm.back')}
        </button>
        {recLoading ? (
          <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !rec ? (
          <p className="text-sm text-slate-400 text-center py-16">{t('crm.record_unavailable')}</p>
        ) : (
          <div className="space-y-4 max-w-3xl">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${meta.cls}`}>
                  {idn.avatar ? <img src={idn.avatar} alt="" className="h-14 w-14 rounded-2xl object-cover" /> : <Icon className="h-7 w-7" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900 truncate">{idn.name || 'â'}</h2>
                    <span className={`t-chip ${meta.cls}`}>{t('crm.kind_' + sel.kind)}</span>
                    {idn.stage && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{idn.stage}</span>}
                  </div>
                  <div className="mt-1.5 text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                    {idn.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {idn.email}</span>}
                    {idn.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {idn.phone}</span>}
                    {fmtDate(idn.joined) && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {fmtDate(idn.joined)}</span>}
                  </div>
                </div>
              </div>
            </div>

            {(rec.stats || []).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {(rec.stats || []).map((s: any, i: number) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">{s.label}</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">{String(s.value)}</div>
                  </div>
                ))}
              </div>
            )}

            {(rec.sections || []).map((sec: any, i: number) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">{sec.title} ({(sec.items || []).length})</h3>
                <ul className="space-y-1.5">
                  {(sec.items || []).map((it: any, j: number) => (
                    <li key={j} className="text-sm text-slate-700 flex justify-between gap-3 border-b border-slate-50 py-1.5 last:border-0">
                      <span className="truncate">{it.k}</span>
                      {it.v && <span className="text-slate-400 text-xs shrink-0">{it.v}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  // ---------- LISTA ----------
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
      <AppPageHeader backHref="/admin" title={`ðï¸ ${t('crm.title')}`} description={t('crm.subtitle')} />
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('crm.search_ph')}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {chips.map((c) => (
          <button key={c.k} type="button" onClick={() => setKind(c.k)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${kind === c.k ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
            {c.label}{typeof c.n === 'number' ? ` Â· ${c.n}` : ''}
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
                  <span className="t-item-title truncate">{r.name}</span>
                  <span className={`t-chip ${m.cls}`}>{t('crm.kind_' + r.kind)}</span>
                </div>
                <div className="t-item-sub truncate">{r.email || "—"}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
            </button>
          );
        })}
      </div>
    </>
  );
}
