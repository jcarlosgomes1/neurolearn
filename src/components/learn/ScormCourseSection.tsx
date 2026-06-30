'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import { Package, ExternalLink } from 'lucide-react';

type Pkg = { id: string; title: string; kind: string };

export function ScormCourseSection({ courseId }: { courseId: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Pkg[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.rpc('nl_scorm_for_course', { p_course_id: courseId });
      if (active) setRows(Array.isArray(data) ? (data as Pkg[]) : []);
    })();
    return () => { active = false; };
  }, [courseId, supabase]);

  if (rows.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Package className="h-4 w-4 text-indigo-600" /> {t('scormlearn.title')}
      </h2>
      <div className="space-y-2">
        {rows.map((p) => (
          <a
            key={p.id}
            href={`/${locale}/aprender/scorm/${p.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="truncate text-sm font-medium text-slate-700">{p.title}</span>
              <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">{p.kind}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600">
              {t('scormlearn.open')} <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
