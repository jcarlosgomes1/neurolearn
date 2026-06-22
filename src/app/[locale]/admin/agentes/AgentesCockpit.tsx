'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import { relTime } from '@/lib/utils/cn';
import { toast } from 'sonner';
import {
  Bot, CheckCircle2, XCircle, Play, Loader2, ShieldCheck, Sparkles,
  ClipboardList, ScrollText, AlertTriangle, Clock, ChevronDown, ChevronRight,
  Megaphone, FileText, LifeBuoy, GraduationCap, Briefcase, Eye, BookPlus, Mail,
} from 'lucide-react';

type Trust = { total: number; approved: number; rejected: number; rate: number | null; sample: number };
type AgentRow = {
  agent_id: string; name: string; description: string | null; agent_status: string;
  last_used_at: string | null; enabled: boolean | null; mode: string | null;
  auto_threshold: number | null; schedule_human: string | null; on_reject: string | null;
  paused_until: string | null; notes: string | null; trust: Trust;
  pending_approvals: number; actions_24h: number;
};
type Task = {
  id: string; task_key: string; title: string; description: string | null; rpc_name: string | null;
  capability: string | null; mode: string; auto_threshold: number; schedule_human: string | null;
  on_reject: string; enabled: boolean; has_machinery: boolean; sort_order: number;
};
type Proposal = {
  id: string; agent_id: string; agent_name: string | null; action: string; reason: string | null;
  params: Record<string, unknown> | null; status: string; created_at: string; decided_at: string | null;
  approval_note: string | null; expires_at: string | null; preview?: any;
};
type LogRow = {
  id: number; agent_id: string; agent_name: string | null; actor_kind: string; action: string;
  resource_type: string | null; resource_id: string | null; result_status: string | null;
  result_summary: string | null; error_message: string | null; duration_ms: number | null; created_at: string;
};

const MODES = ['manual', 'supervised', 'autonomous', 'conditional'];

const ACTION_ICON: Record<string, any> = {
  publish_social_posts: Megaphone,
  publish_blog_post: FileText,
  triage_messages: LifeBuoy,
  decide_application: GraduationCap,
  match_candidates: Briefcase,
  generate_course_concept: BookPlus,
  send_support_reply: Mail,
};

export function AgentesCockpit() {
  const t = useTranslations();
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<'agents' | 'proposals' | 'log'>('agents');
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [tasksByAgent, setTasksByAgent] = useState<Record<string, Task[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [openProposal, setOpenProposal] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Proposal | null>(null);

  function tx(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }
  const modeLabel = (m: string | null) => t(`agents.cockpit.mode_${m || 'supervised'}`);
  const actionLabel = (a: string) => tx(`agents.action.${a}`, a.replace(/_/g, ' '));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, p, l] = await Promise.all([
        supabase.rpc('nl_admin_agents_governance'),
        supabase.rpc('nl_admin_agent_approvals_list', { p_status: 'pending', p_limit: 200 }),
        supabase.rpc('nl_admin_agent_audit_list', { p_agent_id: null, p_limit: 150 }),
      ]);
      if (Array.isArray(g.data)) setAgents(g.data as AgentRow[]);
      if (Array.isArray(p.data)) setProposals(p.data as Proposal[]);
      if (Array.isArray(l.data)) setLogs(l.data as LogRow[]);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function loadTasks(agentId: string) {
    if (tasksByAgent[agentId]) return;
    try {
      const { data } = await supabase.rpc('nl_admin_agent_tasks', { p_agent_id: agentId });
      if (Array.isArray(data)) setTasksByAgent((m) => ({ ...m, [agentId]: data as Task[] }));
    } catch { /* noop */ }
  }

  function toggleExpand(agentId: string) {
    const next = expanded === agentId ? null : agentId;
    setExpanded(next);
    if (next) loadTasks(next);
  }

  async function updateAgent(agentId: string, patch: Record<string, unknown>) {
    setBusyId(agentId);
    try {
      const { data, error } = await supabase.rpc('nl_admin_agent_governance_update', { p_agent_id: agentId, ...patch });
      if (error || !(data as { ok?: boolean })?.ok) throw error || new Error('fail');
      setAgents((rows) => rows.map((r) => r.agent_id === agentId ? { ...r, ...patch } as AgentRow : r));
      toast.success(t('agents.cockpit.saved'));
    } catch { toast.error(t('agents.cockpit.error')); }
    finally { setBusyId(null); }
  }

  async function updateTask(agentId: string, taskId: string, patch: Record<string, unknown>) {
    setBusyId(taskId);
    try {
      const { data, error } = await supabase.rpc('nl_admin_agent_task_update', { p_task_id: taskId, ...patch });
      if (error || !(data as { ok?: boolean })?.ok) throw error || new Error('fail');
      setTasksByAgent((m) => ({
        ...m,
        [agentId]: (m[agentId] || []).map((tk) => tk.id === taskId ? { ...tk, ...patch } as Task : tk),
      }));
      toast.success(t('agents.cockpit.saved'));
    } catch { toast.error(t('agents.cockpit.error')); }
    finally { setBusyId(null); }
  }

  async function runNow(agentName: string) {
    setBusyId('run-' + agentName);
    try {
      const { error } = await supabase.rpc('nl_agent_tick', { p_agent_name: agentName, p_task_key: null, p_force: false });
      if (error) throw error;
      toast.success(t('agents.cockpit.saved'));
      await load();
    } catch { toast.error(t('agents.cockpit.error')); }
    finally { setBusyId(null); }
  }

  async function runAll() {
    setBusyId('run-all');
    try {
      const { data, error } = await supabase.rpc('nl_admin_run_all_agents');
      if (error) throw error;
      const d = data as { ok?: boolean; agents?: number; generated?: number };
      toast.success(tx('agents.cockpit.run_all_done', 'Frota executada') + (d?.generated ? ` · ${d.generated}` : ''));
      await load();
    } catch { toast.error(t('agents.cockpit.error')); }
    finally { setBusyId(null); }
  }

  async function decide(p: Proposal, approve: boolean, followup: string | null = null) {
    setBusyId(p.id);
    try {
      const { data, error } = await supabase.rpc('nl_admin_agent_approval_decide_v2', {
        p_id: p.id, p_approve: approve, p_note: null, p_followup: followup,
      });
      if (error) throw error;
      const res = data as { needs_followup?: boolean };
      if (!approve && res?.needs_followup) { setRejecting(p); setBusyId(null); return; }
      setProposals((rows) => rows.filter((r) => r.id !== p.id));
      setRejecting(null);
      toast.success(t('agents.cockpit.saved'));
    } catch { toast.error(t('agents.cockpit.error')); }
    finally { setBusyId(null); }
  }

  function proposalSummary(p: Proposal): string {
    const pv: any = p.preview;
    if (!pv) return (p.reason && p.reason !== 'event_wake') ? p.reason : actionLabel(p.action);
    switch (pv.type) {
      case 'social': return `${pv.posts?.length ?? 0} post(s)${pv.course_title ? ' · ' + pv.course_title : ''}`;
      case 'blog': return pv.title || actionLabel(p.action);
      case 'support': return `${pv.subject || '—'}${pv.from_name ? ' · ' + pv.from_name : (pv.from_email ? ' · ' + pv.from_email : '')}`;
      case 'application': return `${pv.full_name || '—'}${pv.job_title ? ' · ' + pv.job_title : ''}`;
      case 'match': return `${pv.headline || '—'} → ${pv.job_title || '—'}`;
      case 'support_reply': return `${pv.subject || '—'}${pv.from_name ? ' · ' + pv.from_name : (pv.from_email ? ' · ' + pv.from_email : '')}`;
      case 'course_concept': return pv.title || actionLabel(p.action);
      case 'nudge': return `${pv.student || '—'}${pv.course_title ? ' · «' + pv.course_title + '»' : ''}${pv.progress_pct != null ? ' · ' + pv.progress_pct + '%' : ''}`;
      case 'effect': return (p.reason && p.reason !== 'event_wake') ? p.reason : actionLabel(p.action);
      default: return actionLabel(p.action);
    }
  }

  function ProposalPreview({ p }: { p: Proposal }) {
    const pv: any = p.preview;
    if (!pv) return <p className="text-xs text-slate-400">{tx('agents.review.no_detail', 'Sem detalhe disponível para esta proposta.')}</p>;

    if (pv.type === 'nudge') {
      return (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-600">{tx('agents.review.nudge.what', 'O que acontece ao aprovar')}</div>
          <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-2.5">
            <p className="text-sm font-semibold text-slate-800">{pv.msg_title}</p>
            {pv.msg_body && <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-wrap">{pv.msg_body}</p>}
          </div>
          <p className="text-xs text-slate-600">{tx('agents.review.nudge.send', 'Enviar esta notificação ao aluno')}: <span className="font-medium text-slate-800">{pv.student}</span>{pv.course_title ? ` · «${pv.course_title}»` : ''}{pv.progress_pct != null ? ` · ${pv.progress_pct}%` : ''}</p>
          <p className="text-[11px] text-slate-400">{tx('agents.review.nudge.channel', 'Notificação na aplicação · reversível, sem custo')}</p>
        </div>
      );
    }

    if (pv.type === 'effect') {
      return (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{tx('agents.review.effect.what', 'O que acontece ao aprovar')}</div>
          {p.reason && <p className="text-sm text-slate-700">{p.reason}</p>}
          <p className="text-xs text-slate-500">{actionLabel(p.action)}</p>
          <pre className="text-[11px] bg-slate-50 border border-slate-100 rounded p-2 overflow-auto max-h-40">{JSON.stringify(pv.params ?? p.params, null, 2)}</pre>
        </div>
      );
    }

    if (pv.type === 'social') {
      return (
        <div className="space-y-2">
          {(pv.posts || []).map((post: any, i: number) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">{post.platform}</span>
                {post.lang && <span className="text-[10px] uppercase text-slate-400">{post.lang}</span>}
                {post.scheduled_at && <span className="text-[10px] text-slate-400">{new Date(post.scheduled_at).toLocaleString('pt-PT')}</span>}
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-wrap">{post.content}</p>
              {Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
                <p className="text-[11px] text-sky-600 mt-1">{post.hashtags.map((h: string) => '#' + String(h).replace(/^#/, '')).join(' ')}</p>
              )}
            </div>
          ))}
        </div>
      );
    }
    if (pv.type === 'blog') {
      return (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-slate-800">{pv.title}</p>
          {pv.category && <span className="text-[10px] uppercase tracking-wide text-slate-400">{pv.category}</span>}
          {pv.excerpt && <p className="text-xs text-slate-600">{pv.excerpt}</p>}
          {pv.slug && (
            <a href={`/${locale}/blog/${pv.slug}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:underline">
              <Eye className="h-3.5 w-3.5" /> {tx('agents.review.preview_post', 'pré-visualizar')}
            </a>
          )}
        </div>
      );
    }
    if (pv.type === 'support') {
      return (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-500">{tx('agents.review.from', 'De')}: <span className="text-slate-700">{pv.from_name}{pv.from_email ? ` · ${pv.from_email}` : ''}</span>{pv.topic ? ` · ${pv.topic}` : ''}</p>
          {pv.subject && <p className="text-sm font-semibold text-slate-800">{pv.subject}</p>}
          {pv.message && <p className="text-xs text-slate-600 whitespace-pre-wrap">{pv.message}</p>}
        </div>
      );
    }
    if (pv.type === 'application') {
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800">{pv.full_name}</span>
            {pv.email && <span className="text-xs text-slate-500">{pv.email}</span>}
            {pv.ai_score_total != null && <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">{pv.ai_score_total}/100</span>}
          </div>
          {(pv.job_title || pv.years_experience != null || pv.expertise) && (
            <p className="text-xs text-slate-500">{[pv.job_title, pv.years_experience != null ? `${pv.years_experience}a exp.` : null, pv.expertise].filter(Boolean).join(' · ')}</p>
          )}
          {pv.proposed_course_title && <p className="text-xs text-slate-600">Curso proposto: {pv.proposed_course_title}</p>}
          {pv.ai_summary && <p className="text-xs text-slate-600 italic">{pv.ai_summary}</p>}
          {Array.isArray(pv.ai_strengths) && pv.ai_strengths.length > 0 && (
            <p className="text-[11px]"><span className="text-emerald-700 font-medium">{tx('agents.review.strengths', 'Pontos fortes')}:</span> <span className="text-slate-600">{pv.ai_strengths.join('; ')}</span></p>
          )}
          {Array.isArray(pv.ai_red_flags) && pv.ai_red_flags.length > 0 && (
            <p className="text-[11px]"><span className="text-rose-700 font-medium">{tx('agents.review.red_flags', 'Sinais de alerta')}:</span> <span className="text-slate-600">{pv.ai_red_flags.join('; ')}</span></p>
          )}
        </div>
      );
    }
    if (pv.type === 'match') {
      return (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-slate-800">{pv.headline}</p>
          <p className="text-xs text-slate-500">→ {pv.job_title}{pv.score != null ? ` · ${pv.score}%` : ''}</p>
          {Array.isArray(pv.matched_skills) && pv.matched_skills.length > 0 && (
            <div><span className="text-[11px] text-emerald-700 font-medium">{tx('agents.review.matched', 'Skills compatíveis')}: </span>
              <span className="inline-flex flex-wrap gap-1 align-middle">{pv.matched_skills.map((s: string, i: number) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{s}</span>)}</span>
            </div>
          )}
          {Array.isArray(pv.missing_skills) && pv.missing_skills.length > 0 && (
            <div><span className="text-[11px] text-rose-700 font-medium">{tx('agents.review.missing', 'Skills em falta')}: </span>
              <span className="inline-flex flex-wrap gap-1 align-middle">{pv.missing_skills.map((s: string, i: number) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">{s}</span>)}</span>
            </div>
          )}
        </div>
      );
    }
    if (pv.type === 'support_reply') {
      return (
        <div className="space-y-3">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{tx('agents.review.original_msg', 'Mensagem do cliente')}</div>
            <p className="text-xs text-slate-500">{[pv.from_name, pv.from_email].filter(Boolean).join(' · ')}</p>
            {pv.subject && <p className="text-xs font-semibold text-slate-700 mt-0.5">{pv.subject}</p>}
            {pv.message && <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-wrap">{pv.message}</p>}
          </div>
          <div className="rounded-lg bg-violet-50/60 border border-violet-200 p-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-500 mb-1">{tx('agents.review.proposed_reply', 'Resposta proposta')}</div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{pv.draft}</p>
          </div>
        </div>
      );
    }
    if (pv.type === 'course_concept') {
      return (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-slate-800">{pv.title}</p>
          <p className="text-xs text-slate-500">{[pv.path_title ? `${tx('agents.review.in_path','No percurso')}: ${pv.path_title}` : null, pv.level ? `${tx('agents.review.level','Nível')}: ${pv.level}` : null].filter(Boolean).join(' · ')}</p>
          {pv.description && <p className="text-xs text-slate-600">{pv.description}</p>}
          {Array.isArray(pv.topics) && pv.topics.length > 0 && (
            <div className="flex flex-wrap gap-1">{pv.topics.map((s: string, i: number) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{s}</span>)}</div>
          )}
          <p className="text-[11px] text-violet-600 mt-1">{tx('agents.review.generates_draft', 'Aprovar gera o rascunho do curso.')}</p>
        </div>
      );
    }
    return <pre className="text-[11px] text-slate-500 overflow-x-auto">{JSON.stringify(pv, null, 2)}</pre>;
  }

  const TABS = [
    { id: 'agents' as const, label: t('agents.cockpit.tab_agents'), icon: Bot, count: agents.length },
    { id: 'proposals' as const, label: t('agents.cockpit.tab_proposals'), icon: ClipboardList, count: proposals.length },
    { id: 'log' as const, label: t('agents.cockpit.tab_log'), icon: ScrollText, count: null },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-violet-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Sparkles className="h-3.5 w-3.5" /> {t('agents.cockpit.title')}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('agents.cockpit.title')}</h1>
        <p className="text-sm text-slate-600 mt-1.5">{t('agents.cockpit.subtitle')}</p>
      </header>

      <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-violet-200/70 bg-violet-50/60 p-3.5 sm:p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{tx('agents.cockpit.run_all_title', 'Correr toda a frota')}</p>
          <p className="text-xs text-slate-500 mt-0.5">{tx('agents.cockpit.run_all_sub', 'Executa todos os agentes em sequência organizada — uns aproveitam o trabalho dos anteriores.')}</p>
        </div>
        <button onClick={runAll} disabled={busyId === 'run-all'}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 shrink-0">
          {busyId === 'run-all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {tx('agents.cockpit.run_all', 'Correr todos')}
        </button>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {TABS.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors shrink-0 whitespace-nowrap ${
              tab === tb.id ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <tb.icon className="h-4 w-4" /> {tb.label}
            {tb.count != null && tb.count > 0 && (
              <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{tb.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : tab === 'agents' ? (
        <div className="space-y-3">
          {agents.map((a) => {
            const isOpen = expanded === a.agent_id;
            const tasks = tasksByAgent[a.agent_id] || [];
            return (
              <div key={a.agent_id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-3.5 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white flex-shrink-0">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 capitalize leading-snug">{a.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {a.trust.rate != null && (
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            a.trust.rate >= 90 ? 'bg-emerald-100 text-emerald-700' :
                            a.trust.rate >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                            <ShieldCheck className="h-3 w-3" />
                            {t('agents.cockpit.trust')} {a.trust.rate}% ({a.trust.sample})
                          </span>
                        )}
                        {a.pending_approvals > 0 && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                            {a.pending_approvals} {t('agents.cockpit.pending')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {a.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{a.description}</p>}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{a.schedule_human || '—'}</span>
                    <span>{a.actions_24h} {t('agents.cockpit.actions_24h')}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <select value={a.mode || 'supervised'} disabled={busyId === a.agent_id}
                      onChange={(e) => updateAgent(a.agent_id, { p_mode: e.target.value })}
                      className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 bg-white focus:border-violet-400 outline-none">
                      {MODES.map((m) => <option key={m} value={m}>{modeLabel(m)}</option>)}
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={a.enabled ?? true}
                        onChange={(e) => updateAgent(a.agent_id, { p_enabled: e.target.checked })}
                        className="rounded" />
                      {(a.enabled ?? true) ? t('agents.cockpit.enabled') : t('agents.cockpit.disabled')}
                    </label>
                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={() => toggleExpand(a.agent_id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-violet-700">
                        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        {t('agents.cockpit.tasks')}
                      </button>
                      <button onClick={() => runNow(a.name)} disabled={busyId === 'run-' + a.name}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100">
                        {busyId === 'run-' + a.name ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                        {t('agents.cockpit.run_now')}
                      </button>
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50 divide-y divide-slate-100">
                    {tasks.length === 0 ? (
                      <div className="p-4 text-xs text-slate-400">—</div>
                    ) : tasks.map((tk) => (
                      <div key={tk.id} className="p-3 sm:p-4 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-800">{t(tk.title)}</span>
                            {!tk.has_machinery && (
                              <span className="text-[10px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                <AlertTriangle className="h-3 w-3" />{t('agents.cockpit.no_machinery')}
                              </span>
                            )}
                          </div>
                          {tk.schedule_human && <span className="text-xs text-slate-400">{tk.schedule_human}</span>}
                        </div>
                        <select value={tk.mode} disabled={busyId === tk.id || !tk.has_machinery}
                          onChange={(e) => updateTask(a.agent_id, tk.id, { p_mode: e.target.value })}
                          className="text-xs rounded-lg border border-slate-200 px-2 py-1 bg-white disabled:opacity-50 outline-none">
                          {MODES.map((m) => <option key={m} value={m}>{modeLabel(m)}</option>)}
                        </select>
                        <input type="checkbox" checked={tk.enabled} disabled={busyId === tk.id || !tk.has_machinery}
                          onChange={(e) => updateTask(a.agent_id, tk.id, { p_enabled: e.target.checked })}
                          className="rounded" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : tab === 'proposals' ? (
        <div className="space-y-2">
          {proposals.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">{t('agents.cockpit.no_proposals')}</div>
          ) : proposals.map((p) => {
            const isOpen = openProposal === p.id;
            const ActIcon = ACTION_ICON[p.action] || ClipboardList;
            return (
              <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                    <ActIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{actionLabel(p.action)}</span>
                      <span className="text-xs font-medium text-violet-700 capitalize">{p.agent_name}</span>
                      <span className="text-xs text-slate-400">{relTime(p.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{proposalSummary(p)}</p>
                    <button onClick={() => setOpenProposal(isOpen ? null : p.id)}
                      className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-slate-500 hover:text-violet-700">
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      {isOpen ? tx('agents.review.hide', 'Ocultar') : tx('agents.review.show', 'Ver conteúdo')}
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button onClick={() => decide(p, false)} disabled={busyId === p.id}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                    <XCircle className="h-3.5 w-3.5" /> {t('agents.cockpit.reject')}
                  </button>
                  <button onClick={() => decide(p, true)} disabled={busyId === p.id}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                    {busyId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    {t('agents.cockpit.approve')}
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <ProposalPreview p={p} />
                  </div>
                )}

                {rejecting?.id === p.id && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800 mb-2">{t('agents.cockpit.reject_q')}</p>
                    <div className="flex gap-2">
                      <button onClick={() => decide(p, false, 'retry_now')}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700">
                        {t('agents.cockpit.retry_now')}
                      </button>
                      <button onClick={() => decide(p, false, 'wait_next')}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-700 hover:bg-amber-100">
                        {t('agents.cockpit.wait_next')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">{t('agents.cockpit.no_log')}</div>
          ) : logs.map((l) => (
            <div key={l.id} className="p-3 sm:px-4 flex items-center gap-3">
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                l.actor_kind === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                {l.actor_kind === 'admin' ? t('agents.cockpit.actor_admin') : t('agents.cockpit.actor_agent')}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 capitalize">{l.agent_name}</span>
                  <span className="text-xs font-mono text-slate-500 truncate">{l.action}</span>
                </div>
                {l.result_summary && <p className="text-xs text-slate-500 truncate">{l.result_summary}</p>}
                {l.error_message && <p className="text-xs text-rose-500 truncate">{l.error_message}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {l.result_status && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    l.result_status === 'success' || l.result_status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    l.result_status === 'failure' || l.result_status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                    'bg-slate-100 text-slate-500'}`}>{l.result_status}</span>
                )}
                <span className="text-xs text-slate-400">{relTime(l.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
