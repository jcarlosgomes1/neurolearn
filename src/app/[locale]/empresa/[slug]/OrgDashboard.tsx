'use client';

import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';
import { toast } from 'sonner';
import {
  Users, UserPlus, Trash2, Building2, Crown, Shield, FileText, Sparkles, Settings,
  Briefcase, Inbox, BookOpen, GraduationCap, Route, ArrowRight, Upload, BadgeCheck,
  TrendingUp, Target, Gauge, PenLine, Quote, CalendarDays,
} from 'lucide-react';

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

type SkillRow = { skill_id: string; label_key: string; code: string; members_with: number; members_validated: number; avg_score: number; target_level: string | null; coverage_pct: number };
type Academy = {
  ok: boolean;
  captar: { total: number; ready: number; processing: number; failed: number };
  gerar: { courses_total: number; proposals_pending: number };
  validar: { approved: number; pending_review: number; draft: number };
  capacitar: { members: number; managers: number; active_learners: number; completions: number; cohorts_active: number };
  crescer: { promoted_public: number };
  skillmap: SkillRow[];
};

const ROLE_LABEL: Record<string, string> = { owner: 'emp.dashboard.role.owner', admin: 'emp.dashboard.role.admin', manager: 'emp.dashboard.role.manager', learner: 'emp.dashboard.role.learner' };

export function OrgDashboard({ data }: { data: unknown }) {
  const t = useTranslations();
  const d = data as Data;
  const [org] = useState<Org>(d.org);
  const [members, setMembers] = useState<Member[]>(d.members);
  const [invites, setInvites] = useState<Invite[]>(d.pending_invitations || []);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'learner' | 'manager' | 'admin'>('learner');
  const [sending, setSending] = useState(false);
  const [academy, setAcademy] = useState<Academy | null>(null);

  const loadAcademy = useCallback(async () => {
    try {
      const sb = createClient();
      const { data: a } = await sb.rpc('nl_academy_overview', { p_org_id: org.id });
      if ((a as Academy)?.ok) setAcademy(a as Academy);
    } catch { /* noop */ }
  }, [org.id]);
  useEffect(() => { loadAcademy(); }, [loadAcademy]);

  async function sendInvite() {
    if (!inviteEmail.includes('@')) return;
    setSending(true);
    try {
      const sb = createClient();
      const { data: rd, error } = await sb.rpc('nl_org_invite_member', { p_org_id: org.id, p_email: inviteEmail.trim(), p_role: inviteRole });
      if (error) throw error;
      const r = rd as { ok?: boolean; invitation_id?: string; email?: string; role?: string; token?: string };
      if (r?.ok) {
        toast.success(t('emp.dashboard.invite_sent'));
        setInvites((prev) => [{ id: r.invitation_id || '', email: r.email || '', role: r.role || 'learner', invited_at: new Date().toISOString(), expires_at: '' }, ...prev]);
        const url = `${window.location.origin}/join/${r.token}`;
        navigator.clipboard.writeText(url).catch(() => {});
        toast.info(t('emp.dashboard.link_copied'));
        setInviteEmail(''); setShowInvite(false);
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : t('tea.error')); }
    finally { setSending(false); }
  }
  async function removeMember(userId: string) {
    if (!confirm(t('org.dash.remove_confirm'))) return;
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_org_remove_member', { p_org_id: org.id, p_user_id: userId });
      if (error) throw error;
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      toast.success(t('org.dash.removed'));
    } catch (e) { toast.error(e instanceof Error ? e.message : t('tea.error')); }
  }
  const trialDays = org.trial_ends_at ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
  const brand = org.primary_color || '#6366f1';

  // CTA mágico adaptativo: onde está a empresa no flywheel
  const cta = (() => {
    if (!academy) return null;
    if (academy.captar.total === 0)
      return { label: t('academy.cta.first_content'), sub: t('academy.cta.sub_first_content'), href: `/empresa/${org.slug}/conteudo`, icon: Upload };
    if (academy.gerar.courses_total === 0)
      return { label: t('academy.cta.first_course'), sub: t('academy.cta.sub_first_course'), href: `/empresa/${org.slug}/conteudo`, icon: Sparkles };
    return { label: t('academy.cta.enter'), sub: t('academy.cta.sub_enter'), href: `/empresa/${org.slug}/cursos/propostas`, icon: ArrowRight };
  })();

  const flywheel = academy ? [
    { key: 'captar', icon: Upload, value: academy.captar.total, hint: academy.captar.processing > 0 ? `+${academy.captar.processing}` : null },
    { key: 'gerar', icon: Sparkles, value: academy.gerar.courses_total, hint: academy.gerar.proposals_pending > 0 ? `+${academy.gerar.proposals_pending}` : null },
    { key: 'validar', icon: BadgeCheck, value: academy.validar.approved, hint: academy.validar.pending_review > 0 ? `+${academy.validar.pending_review}` : null },
    { key: 'capacitar', icon: GraduationCap, value: academy.capacitar.active_learners, hint: null },
    { key: 'medir', icon: Gauge, value: academy.skillmap.length, hint: null },
    { key: 'crescer', icon: TrendingUp, value: academy.crescer.promoted_public, hint: null },
  ] : [];

  const topSkills = (academy?.skillmap || []).slice(0, 6);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Hero: identidade da Academia */}
      <AppPageHeader title={org.name} description={t('academy.hero_sub')} />

      {/* CTA mágico adaptativo */}
      {cta && (
        <Link href={cta.href as never}
          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-indigo-300 hover:shadow-md transition-all">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center flex-shrink-0">
            <cta.icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-900">{cta.label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{cta.sub}</div>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </Link>
      )}

      {/* Flywheel vivo */}
      {academy && (
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{t('academy.flywheel_title')}</h2>
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
            {flywheel.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.key} className="flex items-center gap-2 flex-shrink-0">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3.5 py-3 min-w-[92px]">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1"><Icon className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wide">{t(`academy.flywheel.${s.key}` as never)}</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 tabular-nums">
                      {s.value}{s.hint && <span className="text-xs font-semibold text-amber-500 ml-1">{s.hint}</span>}
                    </div>
                  </div>
                  {i < flywheel.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mapa de competências (gestão) */}
      {org.is_admin && academy && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2"><Target className="h-4 w-4 text-indigo-500" />{t('academy.skillmap.title')}</h2>
            <Link href={`/empresa/${org.slug}/competencias` as never} className="text-xs text-indigo-600 hover:underline">{t('academy.skillmap.see_team')}</Link>
          </div>
          {topSkills.length === 0 ? (
            <p className="text-xs text-slate-400 leading-relaxed">{t('academy.skillmap.empty')}</p>
          ) : (
            <div className="space-y-3">
              {topSkills.map((s) => (
                <div key={s.skill_id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-700 font-medium truncate">{t(s.label_key as never)}</span>
                    <span className="text-slate-400 tabular-nums shrink-0 ml-2">
                      {s.members_with} {t('academy.skillmap.people')} · {s.members_validated} {t('academy.skillmap.validated')}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: `${s.coverage_pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat icon={<Users className="h-4 w-4" />} label={t('emp.dashboard.members')} value={String(org.seats_used)} />
        <Stat icon={<GraduationCap className="h-4 w-4" />} label={t('academy.stat.completions')} value={String(academy?.capacitar.completions ?? '—')} />
        <Stat icon={<Crown className="h-4 w-4" />} label={t('emp.dashboard.plan')} value={org.plan} />
        {trialDays !== null ? <Stat icon={<Shield className="h-4 w-4" />} label={t('emp.dashboard.trial_until')} value={`${trialDays}d`} />
          : <Stat icon={<BadgeCheck className="h-4 w-4" />} label={t('academy.stat.cohorts')} value={String(academy?.capacitar.cohorts_active ?? '—')} />}
      </div>

      {/* Navegação agrupada por intenção */}
      <div className="space-y-4">
        <NavGroup title={t('academy.group.capacitar')}>
          <Chip href={`/empresa/${org.slug}/aprender`} icon={GraduationCap} label={t('academy.group.my_learning')} />
          <Chip href={`/empresa/${org.slug}/conteudo`} icon={FileText} label={t('org.dash.nav_content')} />
          <Chip href={`/empresa/${org.slug}/cursos/propostas`} icon={Sparkles} label={t('org.dash.nav_proposals')} />
          <Chip href={`/empresa/${org.slug}/percursos`} icon={Route} label={t('org.dash.nav_paths')} />
          <Chip href={`/empresa/${org.slug}/turmas`} icon={GraduationCap} label={t('org.dash.nav_cohorts')} />
          <Chip href={`/empresa/${org.slug}/autoria`} icon={PenLine} label={t('academy.authoring.nav')} />
          <Chip href={`/empresa/${org.slug}/estudio`} icon={Sparkles} label={t('org_studio.title')} />
        </NavGroup>
        <NavGroup title={t('academy.group.pessoas')}>
          <Chip href={`/empresa/${org.slug}/cursos-subscritos`} icon={BookOpen} label={t('org.dash.nav_subscribed')} />
          <Chip href={`/empresa/${org.slug}/talent`} icon={Users} label={t('org.dash.nav_talent')} />
          <Chip href={`/empresa/${org.slug}/pedidos`} icon={Inbox} label={t('org.dash.nav_requests')} />
        </NavGroup>
        <NavGroup title={t('academy.group.crescer')}>
          <Chip href={`/empresa/${org.slug}/prova-social`} icon={Quote} label={t('org.dash.nav_social_proof')} />
          <Chip href={`/empresa/${org.slug}/eventos`} icon={CalendarDays} label={t('shell.org.events')} />
          <Chip href={`/empresa/${org.slug}/marketplace/cursos`} icon={BookOpen} label={t('org.dash.nav_mkt_courses')} />
          <Chip href={`/empresa/${org.slug}/marketplace/instrutores`} icon={Briefcase} label={t('org.dash.nav_mkt_instructors')} />
        </NavGroup>
        {org.is_admin && (
          <NavGroup title={t('academy.group.gestao')}>
            <Chip href={`/empresa/${org.slug}/admin`} icon={Settings} label={t('org.dash.nav_admin')} />
            <Chip href={`/empresa/${org.slug}/definicoes`} icon={Building2} label={t('org.dash.nav_settings')} />
          </NavGroup>
        )}
      </div>

      {/* Convidar */}
      {org.is_admin && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          {!showInvite ? (
            <button onClick={() => setShowInvite(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 text-white font-medium">
              <UserPlus className="h-4 w-4" /> {t('emp.dashboard.invite_btn')}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="email" placeholder={t('emp.dashboard.invite_email')} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none" />
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'learner' | 'manager' | 'admin')} className="px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none bg-white">
                  <option value="learner">{t('emp.dashboard.role.learner')}</option>
                  <option value="manager">{t('emp.dashboard.role.manager')}</option>
                  <option value="admin">{t('emp.dashboard.role.admin')}</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={sendInvite} disabled={sending || !inviteEmail.includes('@')} className="flex-1 sm:flex-initial px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold">{sending ? '…' : t('emp.dashboard.invite_send')}</button>
                <button onClick={() => setShowInvite(false)} className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm">×</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Membros */}
      <section>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{t('emp.dashboard.members')}</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 p-3 sm:p-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-slate-500 font-medium">
                {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" /> : (m.name?.[0]?.toUpperCase() || '?')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate">{m.name || '—'}</div>
                <div className="text-xs text-slate-500">{t(ROLE_LABEL[m.role] as never)}</div>
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
                  <div className="text-xs text-amber-700">{t(ROLE_LABEL[i.role] as never)}</div>
                </div>
                <span className="text-[10px] font-bold uppercase text-amber-700">{t('org.dash.pending_badge')}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function NavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ href, icon: Icon, label }: { href: string; icon: typeof Users; label: string }) {
  return (
    <Link href={href as never}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-sm font-medium transition-colors">
      <Icon className="h-4 w-4" /> {label}
    </Link>
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
