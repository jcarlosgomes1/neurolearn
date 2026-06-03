'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { Stat } from '@/components/shared/Stat';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { relTime } from '@/lib/utils/cn';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

const APPROVAL_GROUPS = [
  { key: 'courses', labelKey: 'cockpit.ag.courses', emoji: '📚', match: (a: string) => a.includes('course') },
  { key: 'blog', labelKey: 'cockpit.ag.blog', emoji: '📝', match: (a: string) => a.includes('blog') },
  { key: 'social', labelKey: 'cockpit.ag.social', emoji: '📣', match: (a: string) => a.includes('social') },
  { key: 'other', labelKey: 'cockpit.ag.other', emoji: '✋', match: () => true },
];

function groupApprovals(approvals: { id: string; action?: string; created_at?: string; reason?: string; params?: Record<string, unknown> }[]) {
  const groups: Record<string, typeof approvals> = { courses: [], blog: [], social: [], other: [] };
  for (const a of approvals) {
    const g = APPROVAL_GROUPS.find((g) => g.match(a.action || ''));
    groups[g?.key || 'other'].push(a);
  }
  return groups;
}

interface DashboardData {
  students: number; instructors: number; admins: number;
  courses_published: number; published_blog_posts: number; pending_blog_posts: number;
  queued_blog_topics: number; social_pending_review: number; legal_pages_active: number;
  active_agents: number; pending_jobs: number; pending_approvals: number; critical_compliance: number;
  completed_jobs_24h: number; running_jobs: number; failed_jobs_24h: number;
  active_crons: number; audit_entries_24h: number;
  approvals_pending: Array<{ id: string; action?: string; reason?: string; created_at?: string; params?: Record<string, unknown> }>;
  compliance_issues: Array<{ id: string; severity?: string; title: string; recommendation?: string }>;
}

export function AdminCockpit() {
  const t = useTranslations();
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<string | null>(null);

  function load() {
    callAgentOps<{ dashboard: DashboardData }>('dashboard').then((r) => setDash(r.dashboard)).catch((e: Error) => setErr(e.message));
  }
  useEffect(() => { load(); }, []);

  async function decide(approvalId: string, decision: 'approved' | 'rejected') {
    setDeciding(approvalId);
    try {
      await callAgentOps('decide_approval', { approval_id: approvalId, decision });
      toast.success(decision === 'approved' ? t('cockpit.toast_approved') : t('cockpit.toast_rejected'));
      setDash((d) => d ? { ...d, approvals_pending: (d.approvals_pending || []).filter((a) => a.id !== approvalId), pending_approvals: Math.max(0, (d.pending_approvals || 1) - 1) } : d);
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); } finally { setDeciding(null); }
  }

  if (err) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🛠️</div>
        <p className="text-slate-700 font-medium">{err === 'admin_required' || err === 'unauthorized' ? t('cockpit.err_admin') : err === 'not_authenticated' ? t('cockpit.err_auth') : err}</p>
        <Link href={'/login' as any} className="btn-primary mt-6 inline-flex">{t('cockpit.login_btn')}</Link>
      </div>
    );
  }
  if (!dash) return <DashboardSkeleton stats={8} />;

  const approvals = dash.approvals_pending || [];
  const grouped = groupApprovals(approvals);
  const compliance = dash.compliance_issues || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('cockpit.title')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('cockpit.subtitle')}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon="🎓" label={t('cockpit.students')} value={dash.students} accent="brand" />
        <Stat icon="📚" label={t('cockpit.published_courses')} value={dash.courses_published} accent="emerald" href="/admin/cursos" />
        <Stat icon="⚙" label={t('cockpit.pending_jobs')} value={dash.pending_jobs} accent={dash.pending_jobs > 0 ? 'amber' : 'slate'} href="/admin/jobs" />
        <Stat icon="✋" label={t('cockpit.pending_approvals')} value={dash.pending_approvals} accent={dash.pending_approvals > 0 ? 'amber' : 'slate'} href="#aprovacoes" />
      </div>

      {/* Pending approvals */}
      <section id="aprovacoes" className="scroll-mt-20">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('cockpit.approvals_pending')} {approvals.length > 0 && <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full normal-case">{approvals.length}</span>}</h2>
        {approvals.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">{t('cockpit.approvals_empty')}</div>
        ) : (
          <div className="space-y-4">
            {APPROVAL_GROUPS.filter((g) => grouped[g.key].length > 0).map((g) => (
              <div key={g.key} className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">{g.emoji} {t(g.labelKey)} <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{grouped[g.key].length}</span></h3>
                <ul className="space-y-3">
                  {grouped[g.key].map((a) => (
                    <li key={a.id} className="p-3 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-900 text-sm">{(a.params?.course_title as string) || (a.params?.title as string) || a.action}</div>
                        {a.reason && <div className="text-xs text-slate-500 line-clamp-2">{a.reason}</div>}
                        <div className="text-xs text-slate-400 mt-0.5">{a.created_at && relTime(a.created_at)}</div>
                      </div>
                      <div className="flex flex-wrap gap-2 flex-shrink-0">
                        <Link href={`/admin/aprovacao/${a.id}` as any} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-medium">👁 {t('cockpit.view')}</Link>
                        <button onClick={() => decide(a.id, 'approved')} disabled={deciding === a.id} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 disabled:opacity-50">✓ {t('cockpit.approve')}</button>
                        <button onClick={() => decide(a.id, 'rejected')} disabled={deciding === a.id} className="text-xs bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-50 disabled:opacity-50">{t('cockpit.reject')}</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Content + Jobs */}
      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">{t('cockpit.content')}</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-600">{t('cockpit.blog_published')}</span><span className="font-semibold tabular-nums">{dash.published_blog_posts}</span></li>
            <li className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-600">{t('cockpit.blog_pending')}</span><span className="font-semibold tabular-nums">{dash.pending_blog_posts}</span></li>
            <li className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-600">{t('cockpit.topics_queue')}</span><span className="font-semibold tabular-nums">{dash.queued_blog_topics}</span></li>
            <li className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-600">{t('cockpit.social_review')}</span><span className="font-semibold tabular-nums">{dash.social_pending_review}</span></li>
            <li className="flex justify-between py-1.5"><span className="text-slate-600">{t('cockpit.legal_active')}</span><span className="font-semibold tabular-nums">{dash.legal_pages_active}</span></li>
          </ul>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">{t('cockpit.jobs_24h')}</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><div className="text-2xl font-bold text-emerald-600 tabular-nums">{dash.completed_jobs_24h}</div><div className="text-xs text-slate-500">{t('cockpit.completed')}</div></div>
            <div><div className="text-2xl font-bold text-amber-600 tabular-nums">{dash.running_jobs}</div><div className="text-xs text-slate-500">{t('cockpit.running')}</div></div>
            <div><div className="text-2xl font-bold text-rose-600 tabular-nums">{dash.failed_jobs_24h}</div><div className="text-xs text-slate-500">{t('cockpit.failed')}</div></div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">{t('cockpit.crons_audit', { c: dash.active_crons, a: dash.audit_entries_24h })}</div>
          <Link href={'/admin/agentes' as any} className="mt-3 inline-block text-xs text-brand-600 hover:underline">→ {t('cockpit.nav.see_full_observability')}</Link>
        </section>
      </div>

      {/* Compliance */}
      {compliance.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">⚠ {t('cockpit.compliance')}</h2>
          <ul className="space-y-2">
            {compliance.slice(0, 5).map((i) => (
              <li key={i.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${i.severity === 'critical' ? 'bg-rose-500' : i.severity === 'high' ? 'bg-orange-500' : i.severity === 'warning' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 text-sm">{i.title}</div>
                  {i.recommendation && <div className="text-xs text-slate-500 mt-0.5">{i.recommendation}</div>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
