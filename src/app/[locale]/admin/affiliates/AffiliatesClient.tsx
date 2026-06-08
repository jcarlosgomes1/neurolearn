'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Search, CheckCircle2, XCircle, Clock, Loader2, Users, MousePointerClick, TrendingUp, Euro, MoreVertical, X, Copy, ExternalLink } from 'lucide-react';

interface Affiliate {
  id: string; user_id: string; code: string; commission_pct: number; status: string;
  total_clicks: number; total_signups: number; total_paid_signups: number;
  total_earned_cents: number; total_paid_cents: number;
  payment_method: string | null; payment_details: any | null;
  created_at: string; updated_at: string;
  user_name: string | null; user_email: string | null; avatar_url: string | null;
}
interface KPIs { total: number; approved: number; pending: number; total_clicks: number; total_signups: number; total_paid_signups: number; total_earned_cents: number; total_paid_cents: number; }
interface Attribution {
  id: string; reference_kind: string; reference_id: string;
  purchase_amount_cents: number; commission_cents: number; currency: string; status: string;
  attributed_at: string; confirmed_at: string | null; paid_at: string | null;
  referred_name: string | null; referred_email: string | null;
}

const STATUS_META: Record<string, { label: string; cls: string; icon: any }> = {
  pending:   { label: 'Pendente',  cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  approved:  { label: 'Aprovado',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  suspended: { label: 'Suspenso',  cls: 'bg-slate-50 text-slate-600 border-slate-200', icon: XCircle },
  revoked:   { label: 'Revogado',  cls: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
};

function fmtEur(cents: number): string {
  return `€${((cents || 0) / 100).toFixed(2)}`;
}

export function AffiliatesClient({ kpis, initial }: { kpis: KPIs; initial: Affiliate[] }) {
  const router = useRouter();
  const [list, setList] = useState<Affiliate[]>(initial);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Affiliate | null>(null);
  const [attributions, setAttributions] = useState<Attribution[]>([]);
  const [editingCommission, setEditingCommission] = useState<string>('');

  const refresh = useCallback(async (newSearch = search, newStatus = filterStatus) => {
    setBusy(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_affiliates_list', {
        p_search: newSearch || null, p_status: newStatus || null,
      });
      if (error) throw error;
      setList(Array.isArray(data) ? data : []);
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
    finally { setBusy(false); }
  }, [search, filterStatus]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (searchInput !== search) { setSearch(searchInput); refresh(searchInput, filterStatus); }
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput, search, filterStatus, refresh]);

  async function openDetails(a: Affiliate) {
    setEditing(a);
    setEditingCommission(String(a.commission_pct));
    setAttributions([]);
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_admin_affiliate_attributions', { p_affiliate_id: a.id, p_limit: 100 });
      setAttributions(Array.isArray(data) ? data : []);
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
  }

  async function setStatus(id: string, status: string) {
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_affiliate_set_status', { p_id: id, p_status: status });
      if (error) throw error;
      toast.success('Estado actualizado');
      setEditing(null);
      refresh();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
  }

  async function saveCommission(id: string) {
    const pct = Number(editingCommission);
    if (isNaN(pct) || pct < 0 || pct > 100) { toast.error('Comissão entre 0 e 100'); return; }
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_affiliate_set_commission', { p_id: id, p_commission_pct: pct });
      if (error) throw error;
      toast.success('Comissão guardada');
      refresh();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(`https://neurolearn-rosy.vercel.app/?ref=${code}`);
      toast.success('Link copiado');
    } catch { toast.error('Não consegui copiar'); }
  }

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total" value={String(kpis.total ?? 0)} icon={Users} cls="from-slate-600 to-slate-800" />
        <KpiCard label="Aprovados" value={String(kpis.approved ?? 0)} icon={CheckCircle2} cls="from-emerald-500 to-teal-600" />
        <KpiCard label="Cliques" value={String(kpis.total_clicks ?? 0)} icon={MousePointerClick} cls="from-blue-500 to-cyan-600" />
        <KpiCard label="Conversões" value={`${kpis.total_paid_signups ?? 0} / ${kpis.total_signups ?? 0}`} icon={TrendingUp} cls="from-violet-500 to-indigo-600" />
        <KpiCard label="Comissões geradas" value={fmtEur(kpis.total_earned_cents)} icon={Euro} cls="from-amber-500 to-orange-600" />
        <KpiCard label="Pago a afiliados" value={fmtEur(kpis.total_paid_cents)} icon={Euro} cls="from-fuchsia-500 to-pink-600" />
        <KpiCard label="Por pagar" value={fmtEur((kpis.total_earned_cents || 0) - (kpis.total_paid_cents || 0))} icon={Euro} cls="from-rose-500 to-red-600" />
        <KpiCard label="Pendentes" value={String(kpis.pending ?? 0)} icon={Clock} cls="from-amber-500 to-yellow-600" />
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Procurar por código, nome ou email..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-rose-500 outline-none" />
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); refresh(search, e.target.value); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-rose-500 outline-none">
          <option value="">Todos os estados</option>
          <option value="pending">Pendente</option>
          <option value="approved">Aprovado</option>
          <option value="suspended">Suspenso</option>
          <option value="revoked">Revogado</option>
        </select>
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {busy ? (
          <div className="p-10 text-center"><Loader2 className="h-6 w-6 text-rose-600 mx-auto animate-spin" /></div>
        ) : list.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">Sem afiliados ainda.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {list.map((a) => {
              const meta = STATUS_META[a.status] || STATUS_META.pending;
              const StatusIcon = meta.icon;
              const earned = (a.total_earned_cents || 0) / 100;
              const conversion = a.total_clicks > 0 ? ((a.total_paid_signups / a.total_clicks) * 100).toFixed(1) : '0';
              return (
                <div key={a.id} className="p-3 sm:p-4 flex items-center gap-3 hover:bg-slate-50/40">
                  {a.avatar_url ? (
                    <img src={a.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {(a.user_name || a.user_email || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 truncate">{a.user_name || a.user_email || 'Sem nome'}</span>
                      <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold">{a.code}</code>
                      <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${meta.cls}`}>
                        <StatusIcon className="h-2.5 w-2.5" /> {meta.label}
                      </span>
                      <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-bold">{a.commission_pct}%</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                      <span>{a.total_clicks} cliques</span>
                      <span>{a.total_signups} signups · {a.total_paid_signups} pagos · {conversion}% conv.</span>
                      <span className="font-semibold text-emerald-700">€{earned.toFixed(2)} ganhos</span>
                    </div>
                  </div>
                  <button onClick={() => copyCode(a.code)} title="Copiar link ?ref="
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => openDetails(a)}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl animate-in slide-in-from-bottom-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-bold text-slate-900">{editing.user_name || editing.user_email}</div>
                <div className="text-xs text-slate-500"><code className="bg-slate-100 px-1 rounded">{editing.code}</code> · {editing.user_email}</div>
              </div>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3">
              {/* Status */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Estado</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['pending','approved','suspended','revoked'] as const).map((s) => {
                    const meta = STATUS_META[s];
                    const active = editing.status === s;
                    return (
                      <button key={s} onClick={() => setStatus(editing.id, s)}
                        className={`px-2 py-2 rounded-lg text-xs font-semibold ${active ? meta.cls : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comissão */}
              <div className="border-t border-slate-100 pt-3">
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Comissão (%)</label>
                <div className="flex gap-2">
                  <input type="number" min="0" max="100" step="0.5" value={editingCommission}
                    onChange={(e) => setEditingCommission(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-rose-500 outline-none" />
                  <button onClick={() => saveCommission(editing.id)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg">
                    Guardar
                  </button>
                </div>
              </div>

              {/* Stats summary */}
              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                <div className="bg-slate-50 rounded p-2">
                  <div className="text-xs text-slate-500">Cliques</div>
                  <div className="font-bold text-slate-900">{editing.total_clicks}</div>
                </div>
                <div className="bg-slate-50 rounded p-2">
                  <div className="text-xs text-slate-500">Pagos</div>
                  <div className="font-bold text-slate-900">{editing.total_paid_signups}/{editing.total_signups}</div>
                </div>
                <div className="bg-emerald-50 rounded p-2">
                  <div className="text-xs text-emerald-600">Ganhos</div>
                  <div className="font-bold text-emerald-700">{fmtEur(editing.total_earned_cents)}</div>
                </div>
              </div>

              {/* Payment method */}
              {editing.payment_method && (
                <div className="border-t border-slate-100 pt-3">
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Método de pagamento</div>
                  <div className="text-xs text-slate-700 font-mono bg-slate-50 rounded p-2">
                    {editing.payment_method} · {JSON.stringify(editing.payment_details || {}).slice(0, 100)}
                  </div>
                </div>
              )}

              {/* Attributions */}
              <div className="border-t border-slate-100 pt-3">
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Atribuições recentes ({attributions.length})</div>
                {attributions.length === 0 ? (
                  <p className="text-xs text-slate-500">Sem atribuições ainda.</p>
                ) : (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {attributions.slice(0, 20).map((at) => (
                      <div key={at.id} className="flex items-center justify-between text-[11px] bg-slate-50 rounded p-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-700 truncate">{at.referred_name || at.referred_email || 'Anon'}</div>
                          <div className="text-slate-400 text-[10px]">{at.reference_kind} · {new Date(at.attributed_at).toLocaleDateString('pt-PT')}</div>
                        </div>
                        <div className="text-right ml-2">
                          <div className="font-bold text-emerald-700">{fmtEur(at.commission_cents)}</div>
                          <div className="text-[10px] text-slate-400">{at.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, cls }: { label: string; value: string; icon: any; cls: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
      <div className={`inline-flex h-8 w-8 rounded-lg bg-gradient-to-br ${cls} text-white items-center justify-center mb-2 shadow-sm`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-base sm:text-lg font-bold text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}
