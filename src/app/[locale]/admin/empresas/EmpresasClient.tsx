'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useState, useTransition } from 'react';
import { Link } from '@/i18n/routing';
import { listOrgsAction, archiveOrgAction, extendTrialAction } from './actions';
import { Plus, Search, Building2, MoreVertical, Archive, Clock, Eye, Edit3, AlertCircle } from 'lucide-react';

interface Org {
  id: string;
  slug: string;
  name: string;
  plan: string;
  country_code: string | null;
  seats_purchased: number;
  seats_used: number;
  trial_ends_at: string | null;
  archived: boolean;
  logo_url: string | null;
  created_at: string;
  members_count: number;
  sub_status: string | null;
  is_trialing: boolean;
  trial_expired: boolean;
}

interface Props {
  locale: string;
  initial: { total: number; orgs: Org[] };
}

const PLANS = ['', 'trial', 'starter', 'growth', 'enterprise'] as const;
const STATUSES = ['', 'active', 'trialing', 'expired', 'archived'] as const;

export function EmpresasClient({ locale, initial }: Props) {
  const [orgs, setOrgs] = useState<Org[]>(initial.orgs);
  const [total, setTotal] = useState(initial.total);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [pending, startTransition] = useTransition();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  function applyFilters() {
    startTransition(async () => {
      const r = await listOrgsAction({ search, plan, status, includeArchived });
      if (r.ok && r.data) { setOrgs(r.data.orgs); setTotal(r.data.total); }
    });
  }

  async function handleArchive(orgId: string) {
    if (!confirm('Arquivar esta empresa? Pode ser revertido depois.')) return;
    const reason = prompt('Motivo (opcional):') || '';
    startTransition(async () => {
      const r = await archiveOrgAction(orgId, reason);
      if (r.ok) applyFilters();
      else alert('Erro: ' + (r.error || 'unknown'));
    });
    setOpenMenu(null);
  }

  async function handleExtendTrial(orgId: string) {
    const days = parseInt(prompt('Quantos dias adicionar ao trial?', '14') || '0');
    if (!days || days <= 0) return;
    startTransition(async () => {
      const r = await extendTrialAction(orgId, days);
      if (r.ok) applyFilters();
      else alert('Erro: ' + (r.error || 'unknown'));
    });
    setOpenMenu(null);
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      <AdminPageHeader
        emoji="🏢"
        title="Empresas"
        description={`${total} ${total === 1 ? 'tenant' : 'tenants'} no total`}
        actions={
          <Link href={'/admin/empresas/novo' as any}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm shadow-sm transition-colors">
            <Plus className="h-4 w-4" />
            Criar Empresa
          </Link>
        }
      />

      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="Procurar por nome ou slug…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
        </div>
        <select value={plan} onChange={(e) => { setPlan(e.target.value); }} 
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
          <option value="">Todos os planos</option>
          {PLANS.slice(1).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); }} 
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
          <option value="">Todos os estados</option>
          {STATUSES.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
          <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
          Incluir arquivadas
        </label>
        <button onClick={applyFilters} disabled={pending}
          className="sm:col-span-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg disabled:opacity-50">
          {pending ? 'A filtrar…' : 'Aplicar filtros'}
        </button>
      </div>

      {/* Lista */}
      {orgs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-3">🏢</div>
          <h3 className="font-semibold text-slate-900 mb-1">Sem empresas para mostrar</h3>
          <p className="text-sm text-slate-500 mb-6">Cria a primeira empresa para arrancar.</p>
          <Link href={'/admin/empresas/novo' as any}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
            <Plus className="h-4 w-4" /> Criar primeira empresa
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wider">Empresa</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wider">Plano</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wider">Membros</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wider">Seats</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wider">Criada</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => {
                  const planBadge = o.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                                    o.plan === 'growth' ? 'bg-blue-100 text-blue-700' :
                                    o.plan === 'starter' ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-amber-100 text-amber-700';
                  const isOpen = openMenu === o.id;
                  return (
                    <tr key={o.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${o.archived ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <Link href={`/admin/empresas/${o.id}` as any} className="flex items-center gap-3 group">
                          {o.logo_url ? (
                            <img src={o.logo_url} alt={o.name} className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center font-bold">
                              {o.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-slate-900 group-hover:text-brand-700">{o.name}</div>
                            <div className="text-xs text-slate-400">/{o.slug} · {o.country_code || '—'}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${planBadge}`}>
                          {o.plan}
                        </span>
                        {o.is_trialing && <div className="text-[10px] text-amber-600 uppercase tracking-wider mt-1">trial até {new Date(o.trial_ends_at!).toLocaleDateString(locale)}</div>}
                        {o.trial_expired && <div className="text-[10px] text-red-600 uppercase tracking-wider mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />trial expirado</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{o.members_count}</td>
                      <td className="px-4 py-3 text-slate-700">{o.seats_used} / {o.seats_purchased || '∞'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(o.created_at).toLocaleDateString(locale)}</td>
                      <td className="px-4 py-3 text-right relative">
                        <button onClick={() => setOpenMenu(isOpen ? null : o.id)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg" aria-label="Ações">
                          <MoreVertical className="h-4 w-4 text-slate-500" />
                        </button>
                        {isOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1">
                              <Link href={`/admin/empresas/${o.id}` as any} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                <Eye className="h-4 w-4" />Ver detalhes
                              </Link>
                              <Link href={`/admin/empresas/${o.id}/editar` as any} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                <Edit3 className="h-4 w-4" />Editar + Features
                              </Link>
                              <Link href={`/empresa/${o.slug}` as any} target="_blank" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                <Building2 className="h-4 w-4" />Abrir workspace
                              </Link>
                              {o.is_trialing && (
                                <button onClick={() => handleExtendTrial(o.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left">
                                  <Clock className="h-4 w-4" />Estender trial
                                </button>
                              )}
                              {!o.archived && (
                                <button onClick={() => handleArchive(o.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left">
                                  <Archive className="h-4 w-4" />Arquivar
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
