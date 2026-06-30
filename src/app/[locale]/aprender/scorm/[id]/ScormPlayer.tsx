'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, X, CheckCircle2 } from 'lucide-react';
import { scormTrackAction } from './actions';

type CMI = Record<string, string>;

interface Props {
  id: string; kind: string; launchHref: string; scoId: string;
  initialCmi: CMI; studentId: string; studentName: string; title?: string;
  exitHref: string;
}

const READ_DEFAULTS_12: Record<string, string> = {
  'cmi.core._children': 'student_id,student_name,lesson_location,credit,lesson_status,entry,score,total_time,lesson_mode,exit,session_time',
  'cmi.core.score._children': 'raw,min,max',
  'cmi.objectives._count': '0', 'cmi.interactions._count': '0', 'cmi.student_data._children': 'mastery_score,max_time_allowed,time_limit_action',
};
const READ_DEFAULTS_2004: Record<string, string> = {
  'cmi._children': 'comments_from_learner,comments_from_lms,completion_status,credit,entry,launch_data,learner_id,learner_name,learner_preference,location,max_time_allowed,mode,progress_measure,scaled_passing_score,score,session_time,success_status,suspend_data,time_limit_action,total_time',
  'cmi.objectives._count': '0', 'cmi.interactions._count': '0', 'cmi.comments_from_learner._count': '0', 'cmi.comments_from_lms._count': '0',
  'cmi.score._children': 'scaled,raw,min,max',
};

export function ScormPlayer({ id, kind, launchHref, scoId, initialCmi, studentId, studentName, title, exitHref }: Props) {
  const t = useTranslations();
  const is2004 = kind === 'scorm2004' || kind === 'cmi5';
  const model = useRef<CMI>({});
  const dirty = useRef(false);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedShown = useRef(false);
  const [loading, setLoading] = useState(true);

  // Seed do modelo (defaults + retoma)
  if (Object.keys(model.current).length === 0) {
    const hasState = !!(initialCmi['cmi.suspend_data'] || initialCmi['cmi.location'] || initialCmi['cmi.core.lesson_location'] ||
      ['completed', 'passed', 'failed', 'incomplete', 'browsed'].includes(initialCmi['cmi.core.lesson_status'] || initialCmi['cmi.completion_status'] || ''));
    const base: CMI = is2004
      ? { 'cmi.learner_id': studentId, 'cmi.learner_name': studentName, 'cmi.completion_status': 'unknown', 'cmi.success_status': 'unknown', 'cmi.credit': 'credit', 'cmi.mode': 'normal', 'cmi.entry': hasState ? 'resume' : 'ab-initio', 'cmi.location': '', 'cmi.suspend_data': '', 'cmi.total_time': 'PT0H0M0S', 'cmi.session_time': 'PT0H0M0S' }
      : { 'cmi.core.student_id': studentId, 'cmi.core.student_name': studentName, 'cmi.core.lesson_status': 'not attempted', 'cmi.core.lesson_location': '', 'cmi.core.credit': 'credit', 'cmi.core.lesson_mode': 'normal', 'cmi.core.entry': hasState ? 'resume' : 'ab-initio', 'cmi.core.exit': '', 'cmi.core.total_time': '0000:00:00', 'cmi.core.session_time': '0000:00:00', 'cmi.suspend_data': '' };
    model.current = { ...base, ...initialCmi };
  }

  const flush = useCallback(async (immediate = false) => {
    if (!dirty.current && !immediate) return;
    dirty.current = false;
    const snapshot = { ...model.current };
    try {
      const r = await scormTrackAction(id, scoId, snapshot);
      if (r.ok && r.completed && !completedShown.current) { completedShown.current = true; toast.success(t('scormplay.completed')); }
    } catch { /* silencioso */ }
  }, [id, scoId, t]);

  const scheduleFlush = useCallback(() => {
    dirty.current = true;
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => flush(false), 1500);
  }, [flush]);

  useEffect(() => {
    const get = (key: string): string => {
      if (!is2004 && key in READ_DEFAULTS_12 && !(key in model.current)) return READ_DEFAULTS_12[key];
      if (is2004 && key in READ_DEFAULTS_2004 && !(key in model.current)) return READ_DEFAULTS_2004[key];
      return model.current[key] ?? '';
    };
    const set = (key: string, val: string): string => { model.current[key] = String(val); scheduleFlush(); return 'true'; };

    const api12 = {
      LMSInitialize: () => 'true',
      LMSFinish: () => { flush(true); return 'true'; },
      LMSGetValue: (k: string) => get(k),
      LMSSetValue: (k: string, v: string) => set(k, v),
      LMSCommit: () => { flush(true); return 'true'; },
      LMSGetLastError: () => '0',
      LMSGetErrorString: () => '',
      LMSGetDiagnostic: () => '',
    };
    const api2004 = {
      Initialize: () => 'true',
      Terminate: () => { flush(true); return 'true'; },
      GetValue: (k: string) => get(k),
      SetValue: (k: string, v: string) => set(k, v),
      Commit: () => { flush(true); return 'true'; },
      GetLastError: () => '0',
      GetErrorString: () => '',
      GetDiagnostic: () => '',
    };
    const w = window as unknown as Record<string, unknown>;
    w.API = api12;            // SCORM 1.2 (procurado pelo SCO em window.parent.API)
    w.API_1484_11 = api2004;  // SCORM 2004

    const onHide = () => { if (document.visibilityState === 'hidden') flush(true); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);

    return () => {
      flush(true);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      delete w.API; delete w.API_1484_11;
      if (flushTimer.current) clearTimeout(flushTimer.current);
    };
  }, [is2004, flush, scheduleFlush]);

  const src = `/api/scorm/${id}/${launchHref}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/95 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="truncate text-sm font-medium text-slate-100">{title || 'SCORM'}</span>
          <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">{kind}</span>
        </div>
        <a href={exitHref} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800">
          <X className="h-3.5 w-3.5" /> {t('scormplay.exit')}
        </a>
      </div>
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> {t('scormplay.loading')}</div>
          </div>
        )}
        <iframe
          src={src}
          title={title || 'SCORM'}
          className="h-full w-full border-0 bg-white"
          allow="fullscreen; autoplay; microphone; camera"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}
