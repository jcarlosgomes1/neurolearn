'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Languages, Check, Loader2, Clock, Globe } from 'lucide-react';
import { toast } from 'sonner';

const LANG_NAMES: Record<string, string> = { pt: 'Português', en: 'English', es: 'Español', fr: 'Français' };

type LangState = { lang: string; available: boolean; job_status: string | null; demand_count: number };
type State = { ok: boolean; source_lang?: string; auto_translate?: boolean | null; auto_effective?: boolean; langs?: LangState[] };

export function CourseTranslationManager({ courseId }: { courseId: string }) {
  const t = useTranslations('course_editor');
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_course_translation_jobs_for', { p_course_id: courseId });
      if (data) setState(data as State);
    } catch { /* silencioso */ }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  async function toggleAuto(value: boolean) {
    setState((s) => (s ? { ...s, auto_translate: value, auto_effective: value } : s));
    try {
      const sb = createClient();
      await sb.rpc('nl_course_set_auto_translate', { p_course_id: courseId, p_value: value });
    } catch (e: any) { toast.error(e?.message || 'erro'); load(); }
  }

  async function translateNow() {
    setBusy(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_course_translation_request_all', { p_course_id: courseId });
      if (error) throw error;
      const n = (data as any)?.enqueued ?? 0;
      toast.success(t('tr_enqueued', { n }));
      await load();
    } catch (e: any) { toast.error(e?.message || 'erro'); } finally { setBusy(false); }
  }

  if (!state || !state.ok) return null;

  function statusLabel(s: LangState) {
    if (s.available) return { label: t('tr_st_available'), cls: 'text-emerald-600', Icon: Check };
    if (s.job_status === 'running') return { label: t('tr_st_running'), cls: 'text-blue-600', Icon: Loader2 };
    if (s.job_status === 'queued') return { label: t('tr_st_queued'), cls: 'text-amber-600', Icon: Clock };
    if (s.job_status === 'error') return { label: t('tr_st_waiting'), cls: 'text-slate-400', Icon: Clock };
    return { label: t('tr_st_none'), cls: 'text-slate-400', Icon: Globe };
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Languages className="h-5 w-5 text-brand-600" />
        <h2 className="font-semibold text-slate-900">{t('tr_title')}</h2>
      </div>
      <p className="text-xs text-slate-500">{t('tr_source', { lang: LANG_NAMES[state.source_lang || 'pt'] || (state.source_lang || '').toUpperCase() })}</p>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600" checked={!!state.auto_translate} onChange={(e) => toggleAuto(e.target.checked)} />
        <span>
          <span className="text-sm font-medium text-slate-800">{t('tr_auto_label')}</span>
          <span className="block text-xs text-slate-500 mt-0.5">{t('tr_auto_hint')}</span>
        </span>
      </label>

      <ul className="space-y-1.5 text-sm border-t border-slate-100 pt-3">
        {(state.langs || []).map((s) => {
          const st = statusLabel(s);
          return (
            <li key={s.lang} className="flex items-center justify-between">
              <span className="text-slate-700">{LANG_NAMES[s.lang] || s.lang.toUpperCase()}</span>
              <span className="flex items-center gap-2">
                {s.demand_count > 0 && !s.available && <span className="text-xs text-slate-400">{t('tr_demand', { n: s.demand_count })}</span>}
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${st.cls}`}>
                  <st.Icon className={`h-3.5 w-3.5 ${s.job_status === 'running' ? 'animate-spin' : ''}`} /> {st.label}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <button onClick={translateNow} disabled={busy} className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
        {t('tr_now_btn')}
      </button>
    </div>
  );
}
