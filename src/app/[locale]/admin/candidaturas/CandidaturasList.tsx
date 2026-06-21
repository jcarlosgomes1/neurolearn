'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AgentSuggestionsRail } from '@/components/primitives/AgentSuggestionsRail';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

interface Application {
  id: string; email: string; full_name: string;
  country: string | null; city: string | null; job_title: string | null; current_company: string | null;
  years_experience: number | null; expertise: string[] | null;
  linkedin_url: string | null; website_url: string | null; github_url: string | null;
  preferred_lang: string | null;
  proposed_course_title: string | null; proposed_course_description: string | null; proposed_course_format: string | null;
  proposed_course_language: string | null; proposed_target_audience: string | null; proposed_course_outline: string | null;
  proposed_course_duration: string | null; proposed_course_price_eur: number | null;
  demo_video_url: string | null; sample_lesson_url: string | null; portfolio_links: string | null;
  references_text: string | null; teaching_experience: string | null;
  ai_score_total: number | null; ai_score_credibility: number | null; ai_score_pedagogy: number | null;
  ai_score_differentiation: number | null; ai_score_format: number | null; ai_score_language_quality: number | null;
  ai_summary: string | null; ai_red_flags: string[] | null; ai_strengths: string[] | null; ai_processed_at: string | null;
  proposed_email_subject: string | null; proposed_email_html: string | null; proposed_email_text: string | null;
  proposed_email_decision: 'approve' | 'reject' | 'waitlist' | null;
  proposed_email_at: string | null; proposed_email_model: string | null;
  email_sent_at: string | null; email_sent_subject: string | null;
  status: string; admin_notes: string | null; applied_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-slate-100 text-slate-700',
  screening_passed: 'bg-blue-100 text-blue-700',
  shortlisted: 'bg-purple-100 text-purple-700',
  under_review: 'bg-amber-100 text-amber-800',
  interview_scheduled: 'bg-cyan-100 text-cyan-800',
  waitlisted: 'bg-yellow-100 text-yellow-800',
  auto_rejected: 'bg-rose-50 text-rose-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  const v = score ?? 0;
  const color = v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div>
      <div className="flex justify-between text-[11px] text-slate-600 mb-1">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">{v}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function CandidaturasList() {
  const t = useTranslations();
  const locale = useLocale();
  const localeMap: Record<string, string> = { pt: 'pt-PT', en: 'en-GB', es: 'es-ES', fr: 'fr-FR' };
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(localeMap[locale] || 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Application | null>(null);

  async function load() {
    setLoading(true);
    const sb = createClient();
    const { data, error } = await sb.from('nl_instructor_applications')
      .select('*').order('applied_at', { ascending: false });
    if (error) toast.error(error.message);
    setApps((data as Application[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? apps : apps.filter((a) => a.status === filter);
  const counts = apps.reduce<Record<string, number>>((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="🧑‍💼"
        title={t('candlist.title')}
        description={t('candlist.subtitle', { n: apps.length })}
        actions={<button onClick={load} className="text-sm bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg">{t('candlist.reload')}</button>}
      />
      <div className="mb-5">
        <AgentSuggestionsRail surface="talent" />
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {[
          { v: 'all', labelKey: 'candlist.f.all', count: apps.length },
          { v: 'submitted', labelKey: 'candlist.f.new', count: counts.submitted || 0 },
          { v: 'shortlisted', labelKey: 'candlist.f.short', count: counts.shortlisted || 0 },
          { v: 'screening_passed', labelKey: 'candlist.f.ai_ok', count: counts.screening_passed || 0 },
          { v: 'under_review', labelKey: 'candlist.f.review', count: counts.under_review || 0 },
          { v: 'waitlisted', labelKey: 'candlist.f.waitlisted', count: counts.waitlisted || 0 },
          { v: 'auto_rejected', labelKey: 'candlist.f.ai_no', count: counts.auto_rejected || 0 },
          { v: 'approved', labelKey: 'candlist.f.approved', count: counts.approved || 0 },
          { v: 'rejected', labelKey: 'candlist.f.rejected', count: counts.rejected || 0 },
        ].map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === f.v ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}>{t(f.labelKey)} <span className="opacity-60 tabular-nums">{f.count}</span></button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-12">{t('candlist.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 mt-5">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-slate-700 font-medium">{filter === 'all' ? t('candlist.empty.all') : t('candlist.empty.filter')}</p>
          <p className="text-sm text-slate-500 mt-1">{t.rich('candlist.share', { link: () => <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/candidatar</code> })}</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {filtered.map((app) => {
            const statusKey = `candlist.st.${app.status}`;
            const statusColor = STATUS_COLORS[app.status] || 'bg-slate-100';
            const scoreColor = (app.ai_score_total ?? 0) >= 80 ? 'text-emerald-600' : (app.ai_score_total ?? 0) >= 60 ? 'text-amber-600' : 'text-rose-600';
            return (
              <button key={app.id} onClick={() => setSelected(app)} className="bg-white border border-slate-200 hover:border-brand-300 hover:shadow-md rounded-xl p-4 sm:p-5 text-left transition-all">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 text-base sm:text-lg">{app.full_name}</h3>
                      <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusColor}`}>{t(statusKey)}</span>
                      {app.proposed_email_subject && !app.email_sent_at && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{t('candlist.email_ready')}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{app.job_title}{app.current_company && ` · ${app.current_company}`}</p>
                    <p className="text-sm text-slate-700 mt-2 font-medium">&quot;{app.proposed_course_title}&quot;</p>
                    <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                      <span>📅 {fmtDate(app.applied_at)}</span>
                      {app.country && <span>📍 {app.city ? `${app.city}, ` : ''}{app.country}</span>}
                      {app.years_experience && <span>💼 {t('candlist.years', { n: app.years_experience })}</span>}
                      {app.expertise && app.expertise.length > 0 && <span>🎯 {app.expertise.slice(0, 2).join(', ')}{app.expertise.length > 2 && '...'}</span>}
                    </div>
                  </div>
                  {app.ai_score_total !== null && (
                    <div className="flex-shrink-0 text-right">
                      <div className={`text-3xl font-bold tabular-nums ${scoreColor}`}>{app.ai_score_total}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{t('candlist.score_ai')}</div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && <DetailModal app={selected} onClose={() => setSelected(null)} onReload={load} fmtDate={fmtDate} />}
    </div>
  );
}

type ActionState = 'idle' | 'approving' | 'rejecting' | 'waitlisting' | 'rescoring' | 'regenerating';

function DetailModal({ app, onClose, onReload, fmtDate }: { app: Application; onClose: () => void; onReload: () => void; fmtDate: (iso: string) => string }) {
  const t = useTranslations();
  const [action, setAction] = useState<ActionState>('idle');
  const [revenueShare, setRevenueShare] = useState(50);

  // Email proposal editing state
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState(app.proposed_email_subject || '');
  const [emailHtml, setEmailHtml] = useState(app.proposed_email_html || '');
  const [emailDecision, setEmailDecision] = useState<'approve' | 'reject' | 'waitlist'>(app.proposed_email_decision || 'approve');

  async function api(actionName: string, body: Record<string, unknown> = {}) {
    const sb = createClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { toast.error(t('candlist.session_expired')); return null; }
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/instructor-applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: actionName, application_id: app.id, ...body }),
    });
    return resp.json();
  }

  async function regenerateEmail(decision: 'approve' | 'reject' | 'waitlist') {
    if (action !== 'idle') return;
    setAction('regenerating');
    setEmailDecision(decision);
    const r = await api('propose_decision_email', { decision });
    if (r?.ok && r.proposal) {
      setEmailSubject(r.proposal.subject);
      setEmailHtml(r.proposal.html);
      toast.success(t('candlist.email_regenerated'));
      onReload();
    } else { toast.error(r?.error || t('candlist.failure')); }
    setAction('idle');
  }

  async function sendDecision(decision: 'approve' | 'reject' | 'waitlist') {
    if (action !== 'idle') return;
    const stateMap = { approve: 'approving', reject: 'rejecting', waitlist: 'waitlisting' } as const;
    setAction(stateMap[decision]);
    const payload: Record<string, unknown> = {
      edited_subject: emailSubject,
      edited_html: emailHtml,
    };
    if (decision === 'approve') payload.revenue_share_pct = revenueShare;
    const r = await api(decision, payload);
    if (r?.ok) {
      const msgMap = { approve: 'candlist.approved_msg', reject: 'candlist.rejected_msg', waitlist: 'candlist.waitlisted_msg' };
      toast.success(t(msgMap[decision]));
      onClose(); onReload();
    } else { toast.error(r?.error || t('candlist.failure')); setAction('idle'); }
  }

  async function rescore() {
    if (action !== 'idle') return;
    setAction('rescoring');
    const r = await api('rescore');
    if (r?.ok) { toast.success(t('candlist.rescore_ok')); onReload(); }
    else { toast.error(r?.error || t('candlist.failure')); }
    setAction('idle');
  }

  const hasProposal = !!emailSubject && !!emailHtml;
  const decisionAccent = emailDecision === 'approve' ? 'emerald' : emailDecision === 'waitlist' ? 'amber' : 'rose';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-4xl sm:rounded-2xl shadow-2xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 text-lg sm:text-xl truncate">{app.full_name}</h2>
            <p className="text-xs text-slate-500">{app.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-3xl leading-none w-9 h-9 flex items-center justify-center flex-shrink-0">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {app.ai_score_total !== null && (
            <section className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t('candlist.ai_analysis')}</h3>
                  <p className="text-xs text-slate-500">{app.ai_processed_at && t('candlist.processed_at', { d: fmtDate(app.ai_processed_at) })}</p>
                </div>
                <button onClick={rescore} disabled={action !== 'idle'} className="text-xs bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg disabled:opacity-50">{t('candlist.recalc')}</button>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center">
                  <div className={`text-5xl font-bold tabular-nums ${(app.ai_score_total ?? 0) >= 80 ? 'text-emerald-600' : (app.ai_score_total ?? 0) >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{app.ai_score_total}</div>
                  <div className="text-xs text-slate-500 mt-1">{t('candlist.of_100')}</div>
                </div>
                <div className="flex-1 min-w-[200px] grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ScoreBar label={t('candlist.s.credibility')} score={app.ai_score_credibility} />
                  <ScoreBar label={t('candlist.s.pedagogy')} score={app.ai_score_pedagogy} />
                  <ScoreBar label={t('candlist.s.differentiation')} score={app.ai_score_differentiation} />
                  <ScoreBar label={t('candlist.s.format')} score={app.ai_score_format} />
                  <ScoreBar label={t('candlist.s.lang_quality')} score={app.ai_score_language_quality} />
                </div>
              </div>
              {app.ai_summary && (<p className="mt-4 text-sm text-slate-700 italic border-l-2 border-slate-200 pl-3">&quot;{app.ai_summary}&quot;</p>)}
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {app.ai_strengths && app.ai_strengths.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">{t('candlist.strengths')}</h4>
                    <ul className="text-sm text-slate-700 space-y-1">{app.ai_strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-emerald-500 flex-shrink-0">+</span>{s}</li>)}</ul>
                  </div>
                )}
                {app.ai_red_flags && app.ai_red_flags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">{t('candlist.flags')}</h4>
                    <ul className="text-sm text-slate-700 space-y-1">{app.ai_red_flags.map((s, i) => <li key={i} className="flex gap-2"><span className="text-rose-500 flex-shrink-0">!</span>{s}</li>)}</ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* DECISION EMAIL PROPOSAL SECTION */}
          {!['approved', 'rejected'].includes(app.status) && (
            <section className={`bg-${decisionAccent}-50/30 border border-${decisionAccent}-100 rounded-xl p-5`}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">✉️ {t('candlist.proposed_email')}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {hasProposal
                      ? t('candlist.proposed_email_desc')
                      : t('candlist.no_proposed_email')}
                    {app.proposed_email_model && <span className="ml-2 px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">{app.proposed_email_model.replace('claude-', '').replace(/-\d+$/, '')}</span>}
                  </p>
                </div>
                <div className="flex gap-1 items-center">
                  <span className="text-xs text-slate-600 mr-1">{t('candlist.regen_as')}</span>
                  <button onClick={() => regenerateEmail('approve')} disabled={action !== 'idle'} className={`text-[11px] font-semibold px-2 py-1 rounded ${emailDecision === 'approve' ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'} disabled:opacity-50`}>✓ {t('candlist.dec.approve')}</button>
                  <button onClick={() => regenerateEmail('waitlist')} disabled={action !== 'idle'} className={`text-[11px] font-semibold px-2 py-1 rounded ${emailDecision === 'waitlist' ? 'bg-amber-600 text-white' : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50'} disabled:opacity-50`}>⏳ {t('candlist.dec.waitlist')}</button>
                  <button onClick={() => regenerateEmail('reject')} disabled={action !== 'idle'} className={`text-[11px] font-semibold px-2 py-1 rounded ${emailDecision === 'reject' ? 'bg-rose-600 text-white' : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'} disabled:opacity-50`}>✕ {t('candlist.dec.reject')}</button>
                </div>
              </div>

              {action === 'regenerating' && (
                <div className="text-center py-8 text-sm text-slate-500">
                  <div className="inline-block animate-pulse">⚡ {t('candlist.regenerating')}</div>
                </div>
              )}

              {action !== 'regenerating' && !hasProposal && (
                <button onClick={() => regenerateEmail(emailDecision)} className="w-full bg-white border border-dashed border-slate-300 hover:border-brand-400 rounded-lg py-6 text-sm text-slate-600 hover:text-brand-700">
                  ⚡ {t('candlist.generate_email')}
                </button>
              )}

              {action !== 'regenerating' && hasProposal && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('candlist.email_subject')}</label>
                    {editingEmail ? (
                      <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="input mt-1" />
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-slate-800">{emailSubject}</p>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('candlist.email_body')}</label>
                      <button onClick={() => setEditingEmail((v) => !v)} className="text-[11px] text-brand-600 hover:underline font-semibold">
                        {editingEmail ? t('candlist.preview') : t('candlist.edit')}
                      </button>
                    </div>
                    {editingEmail ? (
                      <textarea value={emailHtml} onChange={(e) => setEmailHtml(e.target.value)} className="input min-h-[260px] font-mono text-xs" />
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-lg p-3 max-h-[400px] overflow-y-auto text-sm">
                        <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Already-sent email indicator */}
          {app.email_sent_at && (
            <section className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">✉️ {t('candlist.email_sent')}</div>
              <p className="text-sm text-slate-700"><strong>{app.email_sent_subject}</strong></p>
              <p className="text-xs text-slate-500 mt-1">{t('candlist.sent_at', { d: fmtDate(app.email_sent_at) })}</p>
            </section>
          )}

          <section>
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">{t('candlist.profile')}</h3>
            <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Row label={t('candlist.role')} value={`${app.job_title || '—'}${app.current_company ? ` @ ${app.current_company}` : ''}`} />
              <Row label={t('candlist.location')} value={`${app.city || ''}${app.city && app.country ? ', ' : ''}${app.country || '—'}`} />
              <Row label={t('candlist.experience')} value={app.years_experience ? t('candlist.years', { n: app.years_experience }) : '—'} />
              <Row label={t('candlist.pref_lang')} value={app.preferred_lang || '—'} />
              <Row label={t('candlist.linkedin')} value={app.linkedin_url ? <a href={app.linkedin_url} target="_blank" rel="noopener" className="text-brand-600 hover:underline">{t('candlist.view_profile')}</a> : '—'} />
              <Row label={t('candlist.website')} value={app.website_url ? <a href={app.website_url} target="_blank" rel="noopener" className="text-brand-600 hover:underline">{app.website_url} ↗</a> : '—'} />
              <Row label={t('candlist.github')} value={app.github_url ? <a href={app.github_url} target="_blank" rel="noopener" className="text-brand-600 hover:underline">{app.github_url} ↗</a> : '—'} />
              <Row label={t('candlist.expertise')} value={app.expertise?.join(', ') || '—'} />
            </dl>
            {app.teaching_experience && (
              <div className="mt-3 bg-slate-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('candlist.teaching_exp')}</div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{app.teaching_experience}</p>
              </div>
            )}
          </section>

          <section className="bg-brand-50/40 border border-brand-100 rounded-xl p-5">
            <h3 className="text-sm font-bold text-brand-900 mb-3 uppercase tracking-wider">{t('candlist.course_proposed')}</h3>
            <h4 className="font-bold text-slate-900 text-base mb-2">{app.proposed_course_title}</h4>
            {app.proposed_course_description && (<p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-3">{app.proposed_course_description}</p>)}
            <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Row label={t('candlist.c.format')} value={app.proposed_course_format || '—'} />
              <Row label={t('candlist.c.lang')} value={app.proposed_course_language || '—'} />
              <Row label={t('candlist.c.duration')} value={app.proposed_course_duration || '—'} />
              <Row label={t('candlist.c.price')} value={app.proposed_course_price_eur ? `${app.proposed_course_price_eur}€` : '—'} />
              <Row label={t('candlist.c.audience')} value={app.proposed_target_audience || '—'} />
            </dl>
            {app.proposed_course_outline && (
              <div className="mt-3 bg-white rounded-lg p-3 border border-brand-100">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('candlist.c.outline')}</div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{app.proposed_course_outline}</p>
              </div>
            )}
          </section>

          {(app.demo_video_url || app.sample_lesson_url || app.portfolio_links || app.references_text) && (
            <section>
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">{t('candlist.materials')}</h3>
              <dl className="text-sm space-y-2">
                {app.demo_video_url && <Row label={t('candlist.demo_video')} value={<a href={app.demo_video_url} target="_blank" rel="noopener" className="text-brand-600 hover:underline">{app.demo_video_url} ↗</a>} />}
                {app.sample_lesson_url && <Row label={t('candlist.sample_lesson')} value={<a href={app.sample_lesson_url} target="_blank" rel="noopener" className="text-brand-600 hover:underline">{app.sample_lesson_url} ↗</a>} />}
                {app.portfolio_links && <Row label={t('candlist.portfolio')} value={<span className="whitespace-pre-wrap text-sm">{app.portfolio_links}</span>} />}
                {app.references_text && <Row label={t('candlist.references')} value={<span className="whitespace-pre-wrap text-sm">{app.references_text}</span>} />}
              </dl>
            </section>
          )}
        </div>

        {!['approved', 'rejected'].includes(app.status) && (
          <div className="border-t border-slate-200 p-5 bg-slate-50 flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              {emailDecision === 'approve' && (
                <div className="flex items-center gap-2 mr-auto">
                  <label className="text-xs text-slate-600 font-medium">{t('candlist.revenue')}</label>
                  <select value={revenueShare} onChange={(e) => setRevenueShare(parseInt(e.target.value))} className="text-sm border border-slate-200 rounded px-2 py-1">
                    <option value={40}>40%</option><option value={50}>50%</option><option value={60}>60%</option><option value={70}>70%</option>
                  </select>
                </div>
              )}
              <div className="ml-auto flex gap-2 items-center">
                <p className="text-xs text-slate-500 mr-2">{hasProposal ? t('candlist.send_as') : t('candlist.no_email_yet')}</p>
                <button onClick={() => sendDecision('reject')} disabled={action !== 'idle' || !hasProposal} className="bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-sm font-semibold px-3 py-2 rounded-lg">
                  {action === 'rejecting' ? t('candlist.rejecting') : `✕ ${t('candlist.dec.reject')}`}
                </button>
                <button onClick={() => sendDecision('waitlist')} disabled={action !== 'idle' || !hasProposal} className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-sm font-semibold px-3 py-2 rounded-lg">
                  {action === 'waitlisting' ? t('candlist.waitlisting') : `⏳ ${t('candlist.dec.waitlist')}`}
                </button>
                <button onClick={() => sendDecision('approve')} disabled={action !== 'idle' || !hasProposal} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow">
                  {action === 'approving' ? t('candlist.approving') : `✓ ${t('candlist.approve_create')}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[110px] flex-shrink-0 mt-0.5">{label}</dt>
      <dd className="text-sm text-slate-700 break-words min-w-0">{value}</dd>
    </div>
  );
}
