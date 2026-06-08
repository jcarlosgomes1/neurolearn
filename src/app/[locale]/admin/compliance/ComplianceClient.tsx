'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Shield, ShieldAlert, ShieldCheck, AlertCircle, Lock, FileText, X, Check, Loader2, ChevronDown } from 'lucide-react';

interface Issue {
  id: string; category: string; severity: string; title: string; description: string | null;
  resource_type: string | null; resource_id: string | null; recommendation: string | null;
  status: string; detected_by_agent: string | null; resolved_by: string | null;
  resolved_at: string | null; metadata: any; created_at: string;
}
interface SummaryRow { status: string; severity: string; count: number }

const SEV_META: Record<string, { label: string; cls: string; ring: string; icon: any }> = {
  critical: { label: 'Crítica',  cls: 'bg-rose-100 text-rose-700',       ring: 'ring-rose-300',    icon: ShieldAlert },
  high:     { label: 'Alta',     cls: 'bg-orange-100 text-orange-700',   ring: 'ring-orange-300',  icon: AlertCircle },
  medium:   { label: 'Média',    cls: 'bg-amber-100 text-amber-700',     ring: 'ring-amber-300',   icon: Shield },
  low:      { label: 'Baixa',    cls: 'bg-blue-100 text-blue-700',       ring: 'ring-blue-300',    icon: Shield },
  info:     { label: 'Info',     cls: 'bg-slate-100 text-slate-600',     ring: 'ring-slate-300',   icon: FileText },
};
const STATUS_META: Record<string, { label: string; cls: string }> = {
  open:           { label: 'Aberta',           cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  acknowledged:   { label: 'Reconhecida',      cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_progress:    { label: 'Em curso',         cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  resolved:       { label: 'Resolvida',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  wont_fix:       { label: 'Não vai corrigir', cls: 'bg-slate-50 text-slate-500 border-slate-200' },
  false_positive: { label: 'Falso positivo',   cls: 'bg-slate-50 text-slate-500 border-slate-200' },
};
const CAT_LABEL: Record<string, string> = {
  gdpr: 'GDPR', security: 'Segurança', privacy: 'Privacidade', accessibility: 'Acessibilidade',
  legal: 'Legal', data_integrity: 'Dados', performance: 'Performance', other: 'Outro',
};

export function ComplianceClient({ initialIssues, summary }: { initialIssues: Issue[]; summary: SummaryRow[] }) {
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [filter, setFilter] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(
    () => issues.filter((i) => filter === null || i.status === filter),
    [issues, filter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: issues.length, open: 0, in_progress: 0, resolved: 0 };
    for (const it of issues) c[it.status] = (c[it.status] || 0) + 1;
    return c;
  }, [issues]);

  async function update(id: string, status: string) {
    setBusy(id);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_compliance_issue_update', { p_id: id, p_status: status, p_notes: null });
      if (error) throw error;
      toast.success('Estado atualizado');
      // Refresh
      const { data } = await sb.rpc('nl_admin_compliance_issues_list', { p_status: null, p_limit: 200 });
      setIssues(Array.isArray(data) ? data : []);
      router.refresh();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
    finally { setBusy(null); }
  }

  // Cards summary
  const sev_counts: Record<string, number> = {};
  for (const s of summary) {
    if (s.status === 'open' || s.status === 'acknowledged' || s.status === 'in_progress') {
      sev_counts[s.severity] = (sev_counts[s.severity] || 0) + Number(s.count);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary cards por severidade (apenas abertas) */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(['critical','high','medium','low'] as const).map((sev) => {
          const meta = SEV_META[sev];
          const Icon = meta.icon;
          const count = sev_counts[sev] || 0;
          return (
            <div key={sev} className={`bg-white border rounded-2xl p-4 shadow-sm transition-all ${count > 0 ? meta.ring + ' ring-1' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`h-9 w-9 rounded-lg ${meta.cls} flex items-center justify-center`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{meta.label}</span>
              </div>
              <div className="text-3xl font-bold text-slate-900 tracking-tight">{count}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">abertas</div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto -mx-1 px-1">
        {[
          { k: null, label: 'Todas', n: counts.all },
          { k: 'open', label: 'Abertas', n: counts.open || 0 },
          { k: 'acknowledged', label: 'Reconhecidas', n: counts.acknowledged || 0 },
          { k: 'in_progress', label: 'Em curso', n: counts.in_progress || 0 },
          { k: 'resolved', label: 'Resolvidas', n: counts.resolved || 0 },
        ].map((tab) => (
          <button key={tab.label} onClick={() => setFilter(tab.k as any)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filter === tab.k ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            {tab.label}
            <span className={`text-[10px] px-1.5 rounded ${filter === tab.k ? 'bg-white/20' : 'bg-slate-100'}`}>{tab.n}</span>
          </button>
        ))}
      </div>

      {/* Issues list */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <ShieldCheck className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900">Sem issues neste filtro</h3>
          <p className="text-sm text-slate-500 mt-1.5">Continua o bom trabalho.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((it) => {
            const sev = SEV_META[it.severity] || SEV_META.info;
            const st = STATUS_META[it.status] || STATUS_META.open;
            const SevIcon = sev.icon;
            const isOpen = expanded === it.id;
            return (
              <article key={it.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <button onClick={() => setExpanded(isOpen ? null : it.id)} className="w-full p-4 flex items-start gap-3 text-left hover:bg-slate-50/40">
                  <div className={`h-10 w-10 rounded-lg ${sev.cls} flex items-center justify-center flex-shrink-0`}>
                    <SevIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${sev.cls}`}>{sev.label}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{CAT_LABEL[it.category] || it.category}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${st.cls}`}>{st.label}</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{it.title}</h3>
                    {it.resource_type && (
                      <div className="text-[11px] text-slate-500 mt-0.5">{it.resource_type}{it.resource_id ? ` · ${it.resource_id}` : ''}</div>
                    )}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/30">
                    {it.description && (
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Descrição</div>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{it.description}</p>
                      </div>
                    )}
                    {it.recommendation && (
                      <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                        <div className="text-[10px] uppercase font-bold text-violet-700 mb-1">Recomendação</div>
                        <p className="text-sm text-violet-900 whitespace-pre-wrap leading-relaxed">{it.recommendation}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <div className="text-[10px] text-slate-400">
                        Detectada {new Date(it.created_at).toLocaleString('pt-PT')}
                        {it.resolved_at && ` · Resolvida ${new Date(it.resolved_at).toLocaleString('pt-PT')}`}
                      </div>
                      <div className="flex items-center gap-1">
                        {it.status !== 'acknowledged' && it.status !== 'resolved' && (
                          <button onClick={() => update(it.id, 'acknowledged')} disabled={busy === it.id}
                            className="px-2.5 py-1 text-[11px] text-amber-700 hover:bg-amber-50 rounded font-semibold disabled:opacity-50">
                            Reconhecer
                          </button>
                        )}
                        {it.status !== 'in_progress' && it.status !== 'resolved' && (
                          <button onClick={() => update(it.id, 'in_progress')} disabled={busy === it.id}
                            className="px-2.5 py-1 text-[11px] text-blue-700 hover:bg-blue-50 rounded font-semibold disabled:opacity-50">
                            Em curso
                          </button>
                        )}
                        {it.status !== 'resolved' && (
                          <button onClick={() => update(it.id, 'resolved')} disabled={busy === it.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold disabled:opacity-50">
                            {busy === it.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Resolver
                          </button>
                        )}
                        {it.status !== 'wont_fix' && it.status !== 'resolved' && (
                          <button onClick={() => update(it.id, 'wont_fix')} disabled={busy === it.id}
                            className="px-2.5 py-1 text-[11px] text-slate-500 hover:bg-slate-100 rounded font-semibold disabled:opacity-50">
                            Não corrigir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
