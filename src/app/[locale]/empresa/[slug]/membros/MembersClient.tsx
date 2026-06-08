'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Mail, UserPlus, Trash2, X, Loader2, Send, Copy, Check, Clock, ShieldCheck, Crown, GraduationCap, AlertCircle } from 'lucide-react';

interface Member {
  user_id: string; email: string | null; name: string | null; avatar_url: string | null;
  role: string; joined_at: string | null; last_active_at: string | null;
}
interface Invitation {
  id: string; email: string; role: string; token: string;
  invited_by: string | null; invited_by_name: string | null;
  created_at: string; expires_at: string; accepted_at: string | null;
  status: 'pending' | 'expired' | 'accepted';
  public_link: string;
}

const ROLE_META: Record<string, { label: string; icon: any; cls: string }> = {
  owner:   { label: 'Owner',   icon: Crown,       cls: 'bg-amber-100 text-amber-700' },
  admin:   { label: 'Admin',   icon: ShieldCheck, cls: 'bg-violet-100 text-violet-700' },
  manager: { label: 'Manager', icon: ShieldCheck, cls: 'bg-blue-100 text-blue-700' },
  learner: { label: 'Aluno',   icon: GraduationCap, cls: 'bg-emerald-100 text-emerald-700' },
};

export function MembersClient({ orgId, orgSlug, seatsTotal, seatsUsed, plan, currentUserId, members: initialMembers, invitations: initialInvitations }: {
  orgId: string; orgSlug: string; seatsTotal: number; seatsUsed: number; plan: string;
  currentUserId: string; members: Member[]; invitations: Invitation[];
}) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations);
  const [busy, setBusy] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'learner' });
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const pending = invitations.filter((i) => i.status === 'pending');
  const seatsAvailable = plan === 'trial' || plan === 'enterprise' ? Infinity : Math.max(0, seatsTotal - seatsUsed);
  const seatsAvailLabel = seatsAvailable === Infinity ? '∞' : String(seatsAvailable);

  async function refresh() {
    const sb = createClient();
    const [m, i] = await Promise.all([
      sb.rpc('nl_my_org_members_list', { p_org_id: orgId }),
      sb.rpc('nl_my_org_invitations_list', { p_org_id: orgId }),
    ]);
    setMembers(Array.isArray(m.data) ? m.data : []);
    setInvitations(Array.isArray(i.data) ? i.data : []);
    router.refresh();
  }

  async function invite() {
    const email = form.email.trim().toLowerCase();
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) { toast.error('Email inválido'); return; }
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_org_invite_member', { p_org_id: orgId, p_email: email, p_role: form.role });
      if (error) throw error;
      toast.success(`Convite enviado para ${email}`);
      setForm({ email: '', role: 'learner' });
      setInviting(false);
      await refresh();
    } catch (e: any) {
      const msg = e?.message || 'Erro';
      if (msg.includes('no_seats_available')) toast.error('Sem seats disponíveis. Compra mais.');
      else toast.error(msg);
    } finally { setBusy(false); }
  }

  async function revoke(inv: Invitation) {
    if (!confirm(`Revogar convite para ${inv.email}?`)) return;
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_my_org_invitation_revoke', { p_id: inv.id });
      if (error) throw error;
      toast.success('Convite revogado');
      await refresh();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
    finally { setBusy(false); }
  }

  async function removeMember(m: Member) {
    if (m.user_id === currentUserId) { toast.error('Não te podes remover a ti próprio'); return; }
    if (!confirm(`Remover ${m.name || m.email} desta empresa?`)) return;
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_my_org_member_remove', { p_org_id: orgId, p_user_id: m.user_id });
      if (error) throw error;
      toast.success('Membro removido');
      await refresh();
    } catch (e: any) {
      const msg = e?.message || 'Erro';
      if (msg.includes('cannot_remove_last_admin')) toast.error('Não podes remover o último admin');
      else toast.error(msg);
    }
    finally { setBusy(false); }
  }

  async function copyLink(inv: Invitation) {
    try {
      await navigator.clipboard.writeText(inv.public_link);
      setCopiedToken(inv.token);
      setTimeout(() => setCopiedToken(null), 2000);
      toast.success('Link copiado');
    } catch { toast.error('Não consegui copiar'); }
  }

  return (
    <div className="space-y-6">
      {/* Seats summary */}
      <div className="bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 border border-violet-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-violet-600">Plano {plan}</div>
          <div className="font-semibold text-sm text-slate-900">{seatsUsed} / {seatsTotal === 0 || plan === 'enterprise' || plan === 'trial' ? '∞' : seatsTotal} seats usadas · {seatsAvailLabel} livres</div>
        </div>
        {!inviting && (
          <button onClick={() => setInviting(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm">
            <UserPlus className="h-4 w-4" /> Convidar membro
          </button>
        )}
      </div>

      {/* Invite form */}
      {inviting && (
        <div className="bg-white border border-violet-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Novo convite</h3>
            <button onClick={() => setInviting(false)} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid sm:grid-cols-[1fr_140px_auto] gap-2 items-end">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="pessoa@empresa.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Role</label>
              <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-violet-500 outline-none">
                <option value="learner">Aluno</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button onClick={invite} disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar
            </button>
          </div>
          <p className="text-[11px] text-slate-500">O destinatário recebe um email com link de aceitação. Link válido 30 dias.</p>
        </div>
      )}

      {/* Pending invitations */}
      {pending.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-amber-50/50">
            <Clock className="h-4 w-4 text-amber-600" />
            <h2 className="font-semibold text-sm text-slate-900">Convites pendentes ({pending.length})</h2>
          </header>
          <div className="divide-y divide-slate-100">
            {pending.map((inv) => {
              const roleMeta = ROLE_META[inv.role] || ROLE_META.learner;
              return (
                <div key={inv.id} className="p-4 flex items-center gap-3 hover:bg-slate-50/40">
                  <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 truncate">{inv.email}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${roleMeta.cls}`}>{roleMeta.label}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Convidado por {inv.invited_by_name || 'admin'} · expira {new Date(inv.expires_at).toLocaleDateString('pt-PT')}
                    </div>
                  </div>
                  <button onClick={() => copyLink(inv)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded">
                    {copiedToken === inv.token ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedToken === inv.token ? 'Copiado' : 'Copiar link'}
                  </button>
                  <button onClick={() => revoke(inv)} className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Members list */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-sm text-slate-900">Membros activos ({members.length})</h2>
        </header>
        {members.length === 0 ? (
          <div className="p-10 text-center">
            <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Sem membros ainda. Convida o primeiro acima.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((m) => {
              const roleMeta = ROLE_META[m.role] || ROLE_META.learner;
              const Icon = roleMeta.icon;
              const isMe = m.user_id === currentUserId;
              return (
                <div key={m.user_id} className="p-4 flex items-center gap-3 hover:bg-slate-50/40 group">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {(m.name || m.email || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 truncate">{m.name || m.email || 'Sem nome'}</span>
                      {isMe && <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Tu</span>}
                      <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${roleMeta.cls}`}>
                        <Icon className="h-2.5 w-2.5" /> {roleMeta.label}
                      </span>
                    </div>
                    {m.email && m.name && <div className="text-[11px] text-slate-500 mt-0.5 truncate">{m.email}</div>}
                    {m.joined_at && <div className="text-[10px] text-slate-400 mt-0.5">Entrou em {new Date(m.joined_at).toLocaleDateString('pt-PT')}</div>}
                  </div>
                  {!isMe && (
                    <button onClick={() => removeMember(m)} disabled={busy}
                      className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
