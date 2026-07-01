'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { ChevronDown, User, Shield, ClipboardCheck, FileText, Languages, Sparkles, BookOpen, Star, Clock, Gauge, Loader2 } from 'lucide-react';

type Dossier = any;

function fmtEUR(cents?: number) { return `€${((cents || 0) / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`; }

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-lg font-bold text-slate-900 mt-0.5 nl-num">{value}</div>
      {hint && <div className="text-[11px] text-slate-400 mt-0.5">{hint}</div>}
    </div>
  );
}

function Section({ icon: Icon, title, count, open, onToggle, children }: { icon: any; title: string; count?: number; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-slate-50 transition-colors">
        <Icon className="h-4 w-4 text-brand-600 shrink-0" />
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        {typeof count === 'number' && <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{count}</span>}
        <ChevronDown className={`h-4 w-4 text-slate-400 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-slate-100">{children}</div>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  if (v === null || v === undefined || v === '') return null;
  return <div className="flex justify-between gap-3 py-1 text-sm"><span className="text-slate-500">{k}</span><span className="text-slate-900 font-medium text-right">{v}</span></div>;
}

export function InstructorDossier({ instructorId }: { instructorId: string }) {
  const t = useTranslations();
  const [d, setD] = useState<Dossier>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({ signals: true, identity: true, application: true });
  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  useEffect(() => {
    (async () => {
      try { const sb = createClient(); const { data } = await sb.rpc('nl_admin_instructor_dossier', { p_instructor_id: instructorId }); setD(data); }
      catch { /* noop */ } finally { setLoading(false); }
    })();
  }, [instructorId]);

  if (loading) return <div className="flex items-center gap-2 text-slate-400 text-sm py-8 justify-center"><Loader2 className="h-4 w-4 animate-spin" />{t('instr_dossier.loading')}</div>;
  if (!d || d.ok === false) return <div className="text-sm text-slate-400 py-8 text-center">{t('instr_dossier.unavailable')}</div>;

  const idn = d.identity || {}; const adm = d.admin || {}; const app = d.application; const rev = d.reviews || {}; const eng = d.ai_engagement || {}; const feat = d.ai_features || {};
  const engRatio = eng.total > 0 ? Math.round((eng.edited / eng.total) * 100) : null;

  return (
    <div className="space-y-3">
      {/* Sinais de avaliação em destaque */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <Stat label={t('instr_dossier.sig_rating')} value={rev.count > 0 ? `${rev.avg}★` : '—'} hint={rev.count > 0 ? t('instr_dossier.n_reviews', { n: rev.count }) : undefined} />
        <Stat label={t('instr_dossier.sig_response')} value={rev.responded > 0 ? `${rev.avg_response_hours}h` : '—'} hint={rev.responded > 0 ? t('instr_dossier.n_responded', { n: rev.responded }) : undefined} />
        <Stat label={t('instr_dossier.sig_ai')} value={engRatio !== null ? `${engRatio}%` : '—'} hint={engRatio !== null ? t('instr_dossier.ai_edited_hint') : t('instr_dossier.no_data')} />
        <Stat label={t('instr_dossier.sig_revenue')} value={fmtEUR(adm.total_revenue_cents)} hint={t('instr_dossier.rev_share', { pct: adm.revenue_share_pct ?? 0 })} />
        <Stat label={t('instr_dossier.sig_ai_cost')} value={fmtEUR(d.ai_cost?.total_cents)} hint={t('instr_dossier.cost_calls', { n: d.ai_cost?.calls ?? 0 })} />
      </div>

      <Section icon={User} title={t('instr_dossier.sec_identity')} open={!!open.identity} onToggle={() => toggle('identity')}>
        <Row k={t('instr_dossier.name')} v={idn.display_name} />
        <Row k="Email" v={d.email} />
        <Row k={t('instr_dossier.status')} v={<span className="capitalize">{idn.status}</span>} />
        <Row k={t('instr_dossier.expertise')} v={(idn.expertise || []).join(', ')} />
        <Row k={t('instr_dossier.slug')} v={idn.public_slug} />
        <Row k={t('instr_dossier.onboarding')} v={idn.onboarding_completed ? '✓' : '—'} />
        {idn.bio && <p className="text-sm text-slate-600 mt-2">{idn.bio}</p>}
      </Section>

      {app && (
        <Section icon={ClipboardCheck} title={t('instr_dossier.sec_application')} open={!!open.application} onToggle={() => toggle('application')}>
          <Row k={t('instr_dossier.app_name')} v={app.full_name} />
          <Row k={t('instr_dossier.app_role')} v={[app.job_title, app.current_company].filter(Boolean).join(' · ')} />
          <Row k={t('instr_dossier.app_country')} v={[app.city, app.country].filter(Boolean).join(', ')} />
          <Row k={t('instr_dossier.app_years')} v={app.years_experience} />
          <Row k={t('instr_dossier.app_proposed')} v={app.proposed_course_title} />
          <Row k={t('instr_dossier.app_ai_score')} v={app.ai_score_total != null ? `${app.ai_score_total}/100` : null} />
          <Row k={t('instr_dossier.app_admin_score')} v={app.admin_score != null ? `${app.admin_score}/100` : null} />
          <Row k={t('instr_dossier.app_status')} v={app.status} />
          {app.ai_summary && <p className="text-xs text-slate-500 mt-2 italic">{app.ai_summary}</p>}
        </Section>
      )}

      <Section icon={Shield} title={t('instr_dossier.sec_admin')} open={!!open.admin} onToggle={() => toggle('admin')}>
        <Row k={t('instr_dossier.rev_share_label')} v={`${adm.revenue_share_pct ?? 0}%`} />
        <Row k={t('instr_dossier.total_revenue')} v={fmtEUR(adm.total_revenue_cents)} />
        <Row k={t('instr_dossier.total_payouts')} v={fmtEUR(adm.total_payouts_cents)} />
        <Row k={t('instr_dossier.students')} v={adm.total_students} />
        <Row k={t('instr_dossier.payout_method')} v={adm.payout_method} />
        <Row k={t('instr_dossier.tax_country')} v={adm.tax_country} />
      </Section>

      <Section icon={Sparkles} title={t('instr_dossier.sec_ai_features')} open={!!open.ai_features} onToggle={() => toggle('ai_features')}>
        <Row k={t('instr_dossier.feat_lessons')} v={feat.can_generate_lessons ? '✓' : '—'} />
        <Row k={t('instr_dossier.feat_courses')} v={feat.can_generate_full_courses ? '✓' : '—'} />
        <Row k={t('instr_dossier.feat_tutor')} v={feat.can_use_ai_tutor ? '✓' : '—'} />
        <Row k={t('instr_dossier.feat_studio')} v={feat.can_use_studio ? '✓' : '—'} />
        <Row k={t('instr_dossier.feat_credits')} v={`${feat.credits_used_this_month ?? 0} / ${feat.monthly_ai_credits ?? 0}`} />
        <div className="border-t border-slate-100 mt-2 pt-2">
          <Row k={t('instr_dossier.cost_total')} v={fmtEUR(d.ai_cost?.total_cents)} />
          <Row k={t('instr_dossier.cost_month')} v={fmtEUR(d.ai_cost?.month_cents)} />
          <Row k={t('instr_dossier.cost_calls_label')} v={d.ai_cost?.calls ?? 0} />
          <Row k={t('instr_dossier.cost_tokens')} v={(d.ai_cost?.tokens ?? 0).toLocaleString('pt-PT')} />
        </div>
      </Section>

      <Section icon={BookOpen} title={t('instr_dossier.sec_courses')} count={(d.courses || []).length} open={!!open.courses} onToggle={() => toggle('courses')}>
        {(d.courses || []).length === 0 ? <p className="text-sm text-slate-400">{t('instr_dossier.no_courses')}</p> :
          <ul className="space-y-1">{(d.courses || []).map((c: any) => <li key={c.id} className="text-sm text-slate-800 flex items-center gap-2"><BookOpen className="h-3.5 w-3.5 text-slate-400" />{c.title}</li>)}</ul>}
      </Section>

      <Section icon={Languages} title={t('instr_dossier.sec_languages')} count={(d.languages || []).length} open={!!open.languages} onToggle={() => toggle('languages')}>
        {(d.languages || []).length === 0 ? <p className="text-sm text-slate-400">{t('instr_dossier.no_languages')}</p> :
          <div className="flex flex-wrap gap-1.5">{(d.languages || []).map((l: any) => <span key={l.lang} className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">{(l.lang || '').toUpperCase()} · {l.level}{l.verified ? ' ✓' : ''}</span>)}</div>}
      </Section>

      <Section icon={FileText} title={t('instr_dossier.sec_terms')} count={(d.terms || []).length} open={!!open.terms} onToggle={() => toggle('terms')}>
        {(d.terms || []).length === 0 ? <p className="text-sm text-slate-400">{t('instr_dossier.no_terms')}</p> :
          <ul className="space-y-1">{(d.terms || []).map((tm: any, i: number) => <li key={i} className="text-sm text-slate-700 flex justify-between"><span className="capitalize">{tm.scope}</span><span className="text-slate-400 text-xs">{new Date(tm.accepted_at).toLocaleDateString('pt-PT')}</span></li>)}</ul>}
      </Section>
    </div>
  );
}
