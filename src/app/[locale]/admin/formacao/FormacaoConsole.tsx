'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Check, X, GraduationCap, BookOpen, AlertTriangle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

type App = { id: string; full_name: string; email: string; proposed_course_title: string | null; expertise: string | null; years_experience: number | null; ai_score_total: number | null; ai_summary: string | null; ai_red_flags: string | null; ai_strengths: string | null; status: string | null };
type Course = { id: string; title: string; subtitle: string | null; enrollments_count: number | null; approval_status: string };
type Risk = { user_id: string; student_name: string | null; course_title: string | null; days_inactive: number | null };
type Overview = { ok: boolean; applications: App[]; courses_pending: Course[]; at_risk: { at_risk?: Risk[]; students?: Risk[] } };

export function FormacaoConsole() {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tab, setTab] = useState<'apps' | 'courses' | 'risk' | 'generate'>('apps');
  const [genTitle, setGenTitle] = useState('');
  const [genTopics, setGenTopics] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data: d } = await supabase.rpc('nl_formacao_console_overview');
      if ((d as Overview)?.ok) setData(d as Overview);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function decideApp(id: string, approve: boolean) {
    setBusy(id);
    try {
      const { data: r, error } = await supabase.rpc('nl_formacao_instructor_decide', { p_application_id: id, p_approve: approve });
      if (error || !(r as { ok?: boolean })?.ok) throw error || new Error('fail');
      toast.success(approve ? t('formacao.app_approved') : t('formacao.app_rejected'));
      setData((d) => d ? { ...d, applications: d.applications.filter((a) => a.id !== id) } : d);
    } catch { toast.error(t('formacao.error')); }
    finally { setBusy(null); }
  }

  async function decideCourse(id: string, approve: boolean) {
    setBusy(id);
    try {
      const { data: r, error } = await supabase.rpc('nl_formacao_course_approve', { p_course_id: id, p_approve: approve });
      if (error || !(r as { ok?: boolean })?.ok) throw error || new Error('fail');
      toast.success(approve ? t('formacao.course_approved') : t('formacao.course_rejected'));
      setData((d) => d ? { ...d, courses_pending: d.courses_pending.filter((c) => c.id !== id) } : d);
    } catch { toast.error(t('formacao.error')); }
    finally { setBusy(null); }
  }

  async function generate() {
    if (!genTitle.trim()) return;
    setBusy('gen');
    try {
      const topics = genTopics.split(',').map((s) => s.trim()).filter(Boolean);
      const { data: r, error } = await supabase.rpc('nl_formacao_course_generate_start', { p_title: genTitle, p_topics: topics.length ? topics : null });
      if (error || !(r as { ok?: boolean })?.ok) throw error || new Error('fail');
      toast.success(t('formacao.gen_started'));
      setGenTitle(''); setGenTopics('');
    } catch { toast.error(t('formacao.error')); }
    finally { setBusy(null); }
  }

  if (loading || !data) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  const risk = data.at_risk?.at_risk || data.at_risk?.students || [];
  const TABS = [
    { k: 'apps' as const, icon: GraduationCap, label: t('formacao.tab_apps'), count: data.applications.length },
    { k: 'courses' as const, icon: BookOpen, label: t('formacao.tab_courses'), count: data.courses_pending.length },
    { k: 'risk' as const, icon: AlertTriangle, label: t('formacao.tab_risk'), count: risk.length },
    { k: 'generate' as const, icon: Sparkles, label: t('formacao.tab_generate'), count: null },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((tb) => (
          <button key={tb.k} onClick={() => setTab(tb.k)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${tab === tb.k ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300'}`}>
            <tb.icon className="h-3.5 w-3.5" /> {tb.label}
            {tb.count != null && tb.count > 0 && <span className={`text-xs px-1.5 rounded-full ${tab === tb.k ? 'bg-white/25' : 'bg-slate-100'}`}>{tb.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'apps' && (
        <div className="space-y-3">
          {data.applications.length === 0 ? <Empty t={t} /> : data.applications.map((a) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900">{a.full_name}</h3>
                    {a.ai_score_total != null && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{a.ai_score_total}/100</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{a.email}</div>
                  {a.proposed_course_title && <div className="text-sm text-slate-700 mt-1">{a.proposed_course_title}</div>}
                  <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} className="text-xs text-violet-600 mt-2 inline-flex items-center gap-1">
                    {t('formacao.ai_analysis')} {expanded === a.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {expanded === a.id && (
                    <div className="mt-2 text-xs text-slate-600 space-y-1.5 bg-slate-50 rounded-lg p-3">
                      {a.ai_summary && <p>{a.ai_summary}</p>}
                      {a.ai_strengths && <p className="text-emerald-700"><strong>+</strong> {a.ai_strengths}</p>}
                      {a.ai_red_flags && <p className="text-rose-700"><strong>!</strong> {a.ai_red_flags}</p>}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button onClick={() => decideApp(a.id, true)} disabled={busy === a.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium disabled:opacity-50">
                    {busy === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} {t('formacao.approve')}
                  </button>
                  <button onClick={() => decideApp(a.id, false)} disabled={busy === a.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium disabled:opacity-50">
                    <X className="h-3.5 w-3.5" /> {t('formacao.reject')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'courses' && (
        <div className="space-y-3">
          {data.courses_pending.length === 0 ? <Empty t={t} /> : data.courses_pending.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900">{c.title}</h3>
                {c.subtitle && <div className="text-xs text-slate-500 mt-0.5">{c.subtitle}</div>}
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button onClick={() => decideCourse(c.id, true)} disabled={busy === c.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium disabled:opacity-50">
                  {busy === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} {t('formacao.approve')}
                </button>
                <button onClick={() => decideCourse(c.id, false)} disabled={busy === c.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium disabled:opacity-50">
                  <X className="h-3.5 w-3.5" /> {t('formacao.reject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'risk' && (
        <div className="space-y-2">
          {risk.length === 0 ? <Empty t={t} /> : risk.map((r, i) => (
            <div key={r.user_id || i} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-900">{r.student_name || '—'}</span>
                {r.course_title && <span className="text-xs text-slate-500"> · {r.course_title}</span>}
              </div>
              {r.days_inactive != null && <span className="text-xs text-amber-700 font-medium">{t('formacao.days_inactive', { n: r.days_inactive })}</span>}
            </div>
          ))}
        </div>
      )}

      {tab === 'generate' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 max-w-lg">
          <p className="text-sm text-slate-600">{t('formacao.gen_hint')}</p>
          <input value={genTitle} onChange={(e) => setGenTitle(e.target.value)} placeholder={t('formacao.gen_title_ph')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 outline-none" />
          <input value={genTopics} onChange={(e) => setGenTopics(e.target.value)} placeholder={t('formacao.gen_topics_ph')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 outline-none" />
          <button onClick={generate} disabled={busy === 'gen' || !genTitle.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-50">
            {busy === 'gen' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {t('formacao.gen_start')}
          </button>
        </div>
      )}
    </div>
  );
}

function Empty({ t }: { t: (k: string) => string }) {
  return <div className="text-center py-12 text-slate-400 text-sm">{t('formacao.empty')}</div>;
}
