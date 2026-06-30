'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, X, Activity } from 'lucide-react';
import { SUPABASE_URL } from '@/lib/supabase/config';

interface Props {
  id: string; kind: string; launchHref: string; token: string; registration: string;
  actorKey: string; studentName: string; title?: string; exitHref: string;
}

export function XapiPlayer({ id, kind, launchHref, token, registration, actorKey, studentName, title, exitHref }: Props) {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);

  const src = useMemo(() => {
    const LRS = `${SUPABASE_URL}/functions/v1/xapi-lrs`;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const actor = encodeURIComponent(JSON.stringify({ objectType: 'Agent', name: studentName, account: { homePage: origin || 'https://neurolearn', name: actorKey } }));
    const activityId = encodeURIComponent(`${origin}/xapi/activity/${id}`);
    const reg = encodeURIComponent(registration);
    const ep = encodeURIComponent(`${LRS}/`);
    const qs = kind === 'cmi5'
      ? `endpoint=${ep}&fetch=${encodeURIComponent(`${LRS}/fetch?t=${token}`)}&actor=${actor}&activityId=${activityId}&registration=${reg}`
      : `endpoint=${ep}&auth=${encodeURIComponent('Basic ' + btoa(token + ':'))}&actor=${actor}&activityId=${activityId}&registration=${reg}`;
    const sep = launchHref.includes('?') ? '&' : '?';
    return `/api/scorm/${id}/${launchHref}${sep}${qs}`;
  }, [id, kind, launchHref, token, registration, actorKey, studentName]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/95 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="truncate text-sm font-medium text-slate-100">{title || 'xAPI'}</span>
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
        <iframe src={src} title={title || 'xAPI'} className="h-full w-full border-0 bg-white" allow="fullscreen; autoplay; microphone; camera" onLoad={() => setLoading(false)} />
      </div>
    </div>
  );
}
