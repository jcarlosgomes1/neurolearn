'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';
import { toast } from 'sonner';
import { Users, UserPlus, Trash2, Building2, Crown, Shield, FileText, Sparkles, Settings, Briefcase, Inbox } from 'lucide-react';

type Member = { user_id: string; role: string; joined_at: string; name?: string | null; avatar_url?: string | null };
type Invite = { id: string; email: string; role: string; invited_at: string; expires_at: string };
type Org = {
  id: string; slug: string; name: string;
  logo_url?: string | null; primary_color?: string;
  plan: string; seats_purchased: number; seats_used: number;
  trial_ends_at?: string | null; country_code?: string | null; legal_name?: string | null;
  is_admin: boolean;
};
type Data = { ok: boolean; org: Org; members: Member[]; pending_invitations: Invite[] | null };
const ROLE_LABEL: Record<string, string> = { owner: 'emp.dashboard.role.owner', admin: 'emp.dashboard.role.admin', manager: 'emp.dashboard.role.manager', learner: 'emp.dashboard.role.learner' };

export function OrgDashboard({ data }: { data: any }) {
  const t = useTranslations();
  const d = data as Data;
  const [org] = useState<Org>(d.org);
  const [members, setMembers] = useState<Member[]>(d.members);
  const [invites, setInvites] = useState<Invite[]>(d.pending_invitations || []);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'learner'|'manager'|'admin'>('learner');
  const [sending, setSending] = useState(false);

  async function sendInvite() {
    if (!inviteEmail.includes('@')) return;
    setSending(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_org_invite_member', { p_org_id: org.id, p_email: inviteEmail.trim(), p_role: inviteRole });
      if (error) throw error;
      const r = data as any;
      if (r?.ok) {
        toast.success(t('emp.dashboard.invite_sent'));
        setInvites((prev) => [{ id: r.invitation_id, email: r.email, role: r.role, invited_at: new Date().toISOString(), expires_at: '' }, ...prev]);
        const url = `${window.location.origin}/join/${r.token}`;
        navigator.clipboard.writeText(url).catch(() => {});
        toast.info(t('emp.dashboard.link_copied'));
        setInviteEmail(''); setShowInvite(false);
      }
    } catch (e: any) { toast.error(e?.message || 'Invite failed'); }
    finally { setSending(false); }
  }
  async function removeMember(userId: string) {
    if (!confirm('Remove member?')) return;
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_org_remove_member', { p_org_id: org.id, p_user_id: userId });
      if (error) throw error;
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      toast.success('Removed');
    } catch (e: any) { toast.error(e?.message || 'Failed'); }
  }
  const trialDays = org.trial_ends_at ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / (1000*60*60*24))) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${org.primary_color || '#6366f1'}, #8b5cf6)` }}>
          {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" /> : <Building2 className="h-6 w-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">{org.name}</h1>
          {org.legal_name && <p className="text-sm text-slate-500 mt-0.5">{org.legal_name}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <Link href={`/empresa/${org.slug}/conteudos` as any}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-700 hover:text-brand-700 text-sm font-medium transition-colors">
          <FileText className="h-4 w-4" /> Conteúdos
          <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">IA</span>
        </Link>
        <Link href={`/empresa/${org.slug}/cursos/propostas` as any}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-700 hover:text-brand-700 text-sm font-medium transition-colors">
          <Sparkles className="h-4 w-4" /> Propostas
        </Link>
        <Link href={`/empresa/${org.slug}/marketplace/instrutores` as any}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-700 hover:text-violet-700 text-sm font-medium transition-colors">
          <Briefcase className="h-4 w-4" /> Marketplace Instrutores
          <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-semibold">NEW</span>
        </Link>
        <Link href={`/empresa/${org.slug}/pedidos` as any}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-700 hover:text-violet-700 text-sm font-medium transition-colors">
          <Inbox className="h-4 w-4" /> Pedidos
        </Link>
        {org.is_admin && (
          <Link href={`/empresa/${org.slug}/admin` as any}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-sm font-medium transition-colors">
            <Settings className="h-4 w-4" /> Administração
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat icon={<Users className="h-4 w-4" />} label={t('emp.dashboard.members')} value={String(org.seats_used)} />
        <Stat icon={<Users className="h-4 w-4 opacity-60" />} label={t('emp.dashboard.seats')} value={org.plan === 'trial' || org.plan === 'enterprise' ? '∞' : `${org.seats_used}/${org.seats_purchased}`} />
        <Stat icon={<Crown className="h-4 w-4" />} label={t('emp.dashboard.plan')} value={org.plan} />
        {trialDays !== null && <Stat icon={<Shield className="h-4 w-4" />} label={t('emp.dashboard.trial_until')} value={`${trialDays}d`} />}
      </div>

      {org.is_admin && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
          {!showInvite ? (
            <button onClick={() => setShowInvite(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:opacity-90 text-white font-medium">
              <UserPlus className="h-4 w-4" /> {t('emp.dashboard.invite_btn')}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="email" placeholder={t('emp.dashboard.invite_email')} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none" />
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as any)} className="px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none bg-white">
                  <option value="learner">{t('emp.dashboard.role.learner')}</option>
                  <option value="manager">{t('emp.dashboard.role.manager')}</option>
                  <option value="admin">{t('emp.dashboard.role.admin')}</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={sendInvite} disabled={sending || !inviteEmail.includes('@')} className="flex-1 sm:flex-initial px-5 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold">{sending ? '…' : t('emp.dashboard.invite_send')}</button>
                <button onClick={() => setShowInvite(false)} className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm">×</button>
              </div>
            </div>
          )}
        </div>
      )}

      <section className="mb-6">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{t('emp.dashboard.members')}</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 p-3 sm:p-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-slate-500 font-medium">
                {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" /> : (m.name?.[0]?.toUpperCase() || '?')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate">{m.name || '—'}</div>
                <div className="text-xs text-slate-500">{t(ROLE_LABEL[m.role] as any)}</div>
              </div>
              {org.is_admin && m.role !== 'owner' && (
                <button onClick={() => removeMember(m.user_id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
          ))}
        </div>
      </section>

      {invites.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{t('emp.dashboard.pending_invites')}</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl divide-y divide-amber-100">
            {invites.map((i) => (
              <div key={i.id} className="flex items-center gap-3 p-3 sm:p-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-amber-900 truncate">{i.email}</div>
                  <div className="text-xs text-amber-700">{t(ROLE_LABEL[i.role] as any)}</div>
                </div>
                <span className="text-[10px] font-bold uppercase text-amber-700">pending</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-wider font-bold">{icon}{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
