'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Clock, Users, BookOpen, ArrowRight, Trophy, Sparkles } from 'lucide-react';

const DIFF_KEY: Record<string, string> = {
  beginner: 'path.diff_beginner',
  intermediate: 'path.diff_intermediate',
  advanced: 'path.diff_advanced',
};
const DIFF_CLASS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-rose-100 text-rose-700',
};

export function PathsGrid({ paths, basePath = '/aprender/percursos' }: { paths: any[]; basePath?: string }) {
  const t = useTranslations();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setShown(true)); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {paths.map((p: any, i: number) => (
        <div
          key={p.id}
          style={{
            transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)',
            transitionDelay: `${i * 90}ms`,
            opacity: shown ? 1 : 0,
            transform: shown ? 'none' : 'translateY(28px) scale(0.97)',
          }}
          className={p.featured ? 'md:col-span-2 lg:col-span-1' : ''}
        >
          <Link
            href={`${basePath}/${p.slug}` as any}
            className={`group relative flex flex-col h-full rounded-2xl border bg-white p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
              p.featured ? 'border-violet-300 ring-2 ring-violet-200' : 'border-slate-200 hover:border-violet-300'
            }`}
          >
            {p.featured && (
              <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 shadow animate-pulse">
                <Trophy className="h-3 w-3" /> {t('path.featured_badge')}
              </span>
            )}
            <div className="flex items-start justify-between mb-3">
              <span className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-2xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6">{p.emoji || '🎓'}</span>
              <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${DIFF_CLASS[p.difficulty] || 'bg-slate-100 text-slate-600'}`}>
                {DIFF_KEY[p.difficulty] ? t(DIFF_KEY[p.difficulty]) : p.difficulty}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-violet-700 transition-colors">{p.title}</h3>
            {(p.tagline || p.subtitle) && <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 flex-1">{p.tagline || p.subtitle}</p>}

            {p.outcomes_count > 0 && (
              <div className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2.5 py-1">
                <Sparkles className="h-3 w-3" /> {t('path.outcomes_badge', { n: p.outcomes_count })}
              </div>
            )}

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {t('bn.courses', { count: p.course_count })}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {p.estimated_hours}h</span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {p.enrollment_count}</span>
              <ArrowRight className="h-4 w-4 ml-auto text-slate-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
