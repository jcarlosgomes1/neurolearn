'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

interface Lesson { title: string; type?: string; duration_minutes?: number }
interface Module { title: string; lessons: Lesson[] }
type ProgressMap = Record<string, boolean>; // `${mod}_${les}` -> completed

const TYPE_EMOJI: Record<string, string> = { video: '🎬', exercise: '✍️', reading: '📖', live: '🔴' };

export function CourseCurriculumNav({
  courseId, modules, moduleIndex, lessonIndex, progress, locale, mode,
}: {
  courseId: string; modules: Module[]; moduleIndex: number; lessonIndex: number; progress: ProgressMap; locale: string; mode?: string;
}) {
  const t = useTranslations('curriculum');
  const [openMods, setOpenMods] = useState<Set<number>>(new Set([moduleIndex]));

  const toggle = (i: number) => setOpenMods((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const seq = mode === 'sequential';
  const linear: Array<{ m: number; l: number }> = [];
  modules.forEach((mm, mi) => mm.lessons.forEach((_, li) => linear.push({ m: mi, l: li })));
  function isLocked(mi: number, li: number) {
    if (!seq) return false;
    if (progress[`${mi}_${li}`]) return false; // concluída é sempre reabrível
    const pos = linear.findIndex((p) => p.m === mi && p.l === li);
    return pos > 0 && !linear.slice(0, pos).every((p) => progress[`${p.m}_${p.l}`]);
  }

  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        <Link href={`/learn/curso/${courseId}/guia` as any} className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors">
          <span aria-hidden>📑</span> {t('study_guide')}
        </Link>
        <Link href={`/learn/curso/${courseId}/mapa` as any} className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors">
          <span aria-hidden>🗺️</span> {t('course_map')}
        </Link>
        {modules.map((mod, mi) => {
          const modDone = mod.lessons.filter((_, li) => progress[`${mi}_${li}`]).length;
          const modPct = mod.lessons.length ? Math.round((modDone / mod.lessons.length) * 100) : 0;
          const isOpen = openMods.has(mi);
          const isCurrentMod = mi === moduleIndex;
          return (
            <div key={mi} className="rounded-lg overflow-hidden">
              <button onClick={() => toggle(mi)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors ${isCurrentMod ? 'bg-brand-50/60' : 'hover:bg-slate-50'}`}>
                <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${modPct === 100 ? 'bg-emerald-500 text-white' : isCurrentMod ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {modPct === 100 ? '✓' : mi + 1}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-slate-800 truncate">{mod.title}</span>
                  <span className="block text-[11px] text-slate-400 tabular-nums">{modDone}/{mod.lessons.length}</span>
                </span>
                <span className={`text-slate-300 text-xs transition-transform ${isOpen ? 'rotate-90' : ''}`}>▸</span>
              </button>

              {isOpen && (
                <ul className="pb-1">
                  {mod.lessons.map((les, li) => {
                    const done = !!progress[`${mi}_${li}`];
                    const isCurrent = mi === moduleIndex && li === lessonIndex;
                    const locked = isLocked(mi, li);
                    const inner = (
                      <>
                        <span className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center text-[9px] ${done ? 'bg-emerald-500 border-emerald-500 text-white' : isCurrent ? 'border-brand-500' : 'border-slate-300'}`}>
                          {done ? '✓' : ''}
                        </span>
                        <span className="flex-1 min-w-0 truncate leading-snug">{les.title}</span>
                        {locked ? <span className="flex-shrink-0 text-[11px] text-slate-300">🔒</span> : les.duration_minutes ? <span className="flex-shrink-0 text-[10px] text-slate-400 tabular-nums">{les.duration_minutes}m</span> : null}
                      </>
                    );
                    return (
                      <li key={li}>
                        {locked ? (
                          <div className="flex items-center gap-2.5 pl-12 pr-3 py-2 text-sm text-slate-400 cursor-not-allowed select-none" title={t('locked')} aria-disabled="true">
                            {inner}
                          </div>
                        ) : (
                          <Link href={`/learn/curso/${courseId}/aula/${mi}/${li}` as any}
                            className={`flex items-center gap-2.5 pl-12 pr-3 py-2 text-sm transition-colors ${isCurrent ? 'bg-brand-100/70 text-brand-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                            {inner}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
