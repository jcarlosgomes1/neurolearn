'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Search, Filter, Crown, ShieldCheck, GraduationCap, User as UserIcon, CheckCircle2, XCircle, Loader2, ChevronLeft, ChevronRight, MoreVertical, Mail, Calendar, Activity, X } from 'lucide-react';

interface User {
  id: string; name: string | null; email: string | null; handle: string | null;
  role: string; is_active: boolean; avatar_url: string | null;
  country_code: string | null; preferred_lang: string | null;
  subscription_status: string | null; subscription_plan: string | null;
  joined_at: string | null; last_login: string | null;
  enrolled_count: number; email_confirmed: boolean;
}
interface KPIs { total: number; active: number; inactive: number; admins: number; instructors: number; students: number; paying: number; last_7d: number; last_30d: number; }
interface Page { items: User[]; total: number; limit: number; offset: number; }

const ROLE_META: Record<string, { label: string; icon: any; cls: string }> = {
  super_admin: { label: 'Super',     icon: Crown,         cls: 'bg-amber-100 text-amber-700' },
  admin:       { label: 'Admin',     icon: ShieldCheck,   cls: 'bg-violet-100 text-violet-700' },
  instructor:  { label: 'Instrutor', icon: GraduationCap, cls: 'bg-emerald-100 text-emerald-700' },
  student:     { label: 'Aluno',     icon: UserIcon,      cls: 'bg-blue-100 text-blue-700' },
};

export function UsersClient({ currentUserId, kpis, initialPage }: { currentUserId: string; kpis: KPIs; initialPage: Page; }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterActive, setFilterActive] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState<Page>(initialPage);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const refresh = useCallback(async (newOffset = offset, newSearch = search, newRole = filterRole, newActive = filterActive) => {
    setBusy(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_users_list', {
        p_search: newSearch || null,
        p_role: newRole || null,
        p_is_active: newActive === '' ? null : newActive === 'true',
        p_limit: 50,
        p_offset: newOffset,
      });
      if (error) throw error;
      setPage((data as any) || { items: [], total: 0, limit: 50, offset: newOffset });
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
    finally { setBusy(false); }
  }, [offset, search, filterRole, filterActive]);

  // debounce search
  useEffect(() => {
    const id = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput); setOffset(0); refresh(0, searchInput, filterRole, filterActive);
      }
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput, search, filterRole, filterActive, refresh]);

  function changeFilter(setter: (v: any) => void, value: any) {
    setter(value); setOffset(0); refresh(0, search, setter === setFilterRole ? value : filterRole, setter === setFilterActive ? value : filterActive);
  }

  async function setRole(userId: string, newRole: string) {
    if (userId === currentUserId && !confirm('Estás a alterar o TEU próprio role. Continuar?')) return;
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_user_set_role', { p_user_id: userId, p_role: newRole });
      if (error) throw error;
      toast.success('Role actualizado');
      refresh();
      setEditing(null);
    } catch (e: any) {
      const msg = e?.message || 'Erro';
      if (msg.includes('cannot_demote_last_super_admin')) toast.error('Não podes despromover o último super admin');
      else toast.error(msg);
    }
  }

  async function setActive(userId: string, active: boolean) {
    if (userId === currentUserId && !active && !confirm('Estás a desactivar a TUA própria conta. Vais perder acesso. Continuar?')) return;
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_user_set_active', { p_user_id: userId, p_is_active: active });
      if (error) throw error;
      toast.success(active ? 'Conta activada' : 'Conta desactivada');
      refresh();
      setEditing(null);
    } catch (e: any) {
      const msg = e?.message || 'Erro';
      if (msg.includes('cannot_deactivate_last_super_admin')) toast.error('Não podes desactivar o último super admin');
      else toast.error(msg);
    }
  }

  function paginate(delta: number) {
    const newOffset = Math.max(0, offset + delta * 50);
    if (newOffset >= (page.total || 0)) return;
    setOffset(newOffset); refresh(newOffset);
  }

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total" value={kpis.total ?? 0} icon={Users2 as any} cls="from-slate-600 to-slate-800" />
        <KpiCard label="Activos" value={kpis.active ?? 0} icon={CheckCircle2} cls="from-emerald-500 to-teal-600" />
        <KpiCard label="Admins" value={kpis.admins ?? 0} icon={Crown} cls="from-amber-500 to-orange-600" />
        <KpiCard label="Instrutores" value={kpis.instructors ?? 0} icon={GraduationCap} cls="from-violet-500 to-indigo-600" />
        <KpiCard label="Alunos" value={kpis.students ?? 0} icon={UserIcon} cls="from-blue-500 to-cyan-600" />
        <KpiCard label="A pagar" value={kpis.paying ?? 0} icon={Activity} cls="from-fuchsia-500 to-pink-600" />
        <KpiCard label="Novos 7d" value={kpis.last_7d ?? 0} icon={Calendar} cls="from-emerald-500 to-green-600" />
        <KpiCard label="Novos 30d" value={kpis.last_30d ?? 0} icon={Calendar} cls="from-teal-500 to-cyan-600" />
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Procurar por nome, email ou handle..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 outline-none" />
        </div>
        <select value={filterRole} onChange={(e) => changeFilter(setFilterRole, e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-violet-500 outline-none">
          <option value="">Todos os roles</option>
          <option value="super_admin">Super admin</option>
          <option value="admin">Admin</option>
          <option value="instructor">Instrutor</option>
          <option value="student">Aluno</option>
        </select>
        <select value={filterActive} onChange={(e) => changeFilter(setFilterActive, e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-violet-500 outline-none">
          <option value="">Activos+Inactivos</option>
          <option value="true">Apenas activos</option>
          <option value="false">Apenas inactivos</option>
        </select>
        {(search || filterRole || filterActive) && (
          <button onClick={() => { setSearchInput(''); setSearch(''); setFilterRole(''); setFilterActive(''); setOffset(0); refresh(0,'','',''); }}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="h-3.5 w-3.5" /> Limpar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {busy ? (
          <div className="p-10 text-center"><Loader2 className="h-6 w-6 text-violet-600 mx-auto animate-spin" /></div>
        ) : page.items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">Sem utilizadores que correspondam aos filtros.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {page.items.map((u) => {
              const roleMeta = ROLE_META[u.role] || ROLE_META.student;
              const RoleIcon = roleMeta.icon;
              const isMe = u.id === currentUserId;
              return (
                <div key={u.id} className={`p-3 sm:p-4 flex items-center gap-3 hover:bg-slate-50/40 ${!u.is_active ? 'opacity-60' : ''}`}>
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {(u.name || u.email || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 truncate">{u.name || u.email || 'Sem nome'}</span>
                      {isMe && <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold">Tu</span>}
                      {!u.is_active && <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase font-bold">Inactivo</span>}
                      <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${roleMeta.cls}`}>
                        <RoleIcon className="h-2.5 w-2.5" /> {roleMeta.label}
                      </span>
                      {u.subscription_status === 'active' && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase">€</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      {u.email && <span className="inline-flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{u.email}</span>}
                      {u.email_confirmed ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <XCircle className="h-3 w-3 text-amber-600" />}
                      {u.handle && <span>@{u.handle}</span>}
                      {u.country_code && <span className="uppercase">{u.country_code}</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {u.joined_at && <>Entrou {new Date(u.joined_at).toLocaleDateString('pt-PT')}</>}
                      {u.last_login && <> · login {new Date(u.last_login).toLocaleDateString('pt-PT')}</>}
                      {u.enrolled_count > 0 && <> · {u.enrolled_count} curso(s)</>}
                    </div>
                  </div>
                  <button onClick={() => setEditing(u)}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {page.total > 50 && (
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Mostrando {offset + 1}–{Math.min(offset + 50, page.total)} de {page.total}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => paginate(-1)} disabled={offset === 0 || busy}
              className="p-1.5 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => paginate(1)} disabled={offset + 50 >= page.total || busy}
              className="p-1.5 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in slide-in-from-bottom-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-bold text-slate-900">{editing.name || editing.email}</div>
                <div className="text-xs text-slate-500">{editing.email}</div>
              </div>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Role</label>
                <div className="grid grid-cols-2 gap-1">
                  {(['student','instructor','admin','super_admin'] as const).map((r) => {
                    const meta = ROLE_META[r];
                    const RoleIcon = meta.icon;
                    const active = editing.role === r;
                    return (
                      <button key={r} onClick={() => setRole(editing.id, r)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${active ? `${meta.cls}` : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                        <RoleIcon className="h-3 w-3" /> {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Estado</label>
                {editing.is_active ? (
                  <button onClick={() => setActive(editing.id, false)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg">
                    <XCircle className="h-3.5 w-3.5" /> Desactivar conta
                  </button>
                ) : (
                  <button onClick={() => setActive(editing.id, true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Activar conta
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] border-t border-slate-100 pt-3">
                <div>
                  <div className="text-slate-500">Subscription</div>
                  <div className="font-semibold text-slate-900 capitalize">{editing.subscription_status || '—'}</div>
                </div>
                <div>
                  <div className="text-slate-500">Plano</div>
                  <div className="font-semibold text-slate-900">{editing.subscription_plan || '—'}</div>
                </div>
                <div>
                  <div className="text-slate-500">Cursos inscritos</div>
                  <div className="font-semibold text-slate-900">{editing.enrolled_count}</div>
                </div>
                <div>
                  <div className="text-slate-500">País</div>
                  <div className="font-semibold text-slate-900 uppercase">{editing.country_code || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Users icon (lucide already loaded but we want Users2 alias)
const Users2 = function Users2({ className }: { className?: string }) {
  return <Crown className={className} />;
};

function KpiCard({ label, value, icon: Icon, cls }: { label: string; value: number; icon: any; cls: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
      <div className={`inline-flex h-8 w-8 rounded-lg bg-gradient-to-br ${cls} text-white items-center justify-center mb-2 shadow-sm`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xl font-bold text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}
