'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface RewardState {
  xp_total: number; level: number; streak_current: number;
  level_floor_xp: number; next_level_xp: number; xp_into_level: number; xp_for_level: number;
  badges?: Array<{ code: string; name?: string; icon?: string; tier?: string }>;
}

// Overlay celebratório ao concluir uma aula: XP ganho, barra de nível, streak, badge novo.
export function LessonRewardBurst({
  show, xpGained, before, after, leveledUp, newBadge, onClose,
}: {
  show: boolean;
  xpGained: number;
  before: RewardState | null;
  after: RewardState | null;
  leveledUp: boolean;
  newBadge: { name?: string; icon?: string } | null;
  onClose: () => void;
}) {
  const t = useTranslations('reward');
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    if (!show || !after) return;
    const target = after.xp_for_level ? Math.round((after.xp_into_level / after.xp_for_level) * 100) : 0;
    const start = before && before.xp_for_level ? Math.round((before.xp_into_level / before.xp_for_level) * 100) : 0;
    setAnimPct(leveledUp ? 0 : start);
    const id = setTimeout(() => setAnimPct(target), 120);
    const auto = setTimeout(onClose, 4200);
    return () => { clearTimeout(id); clearTimeout(auto); };
  }, [show, after, before, leveledUp, onClose]);

  if (!show || !after) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
        {/* confete simples */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="absolute w-2 h-2 rounded-sm animate-bounce"
              style={{
                left: `${(i * 7 + 5) % 100}%`, top: `${(i * 13) % 40}%`,
                background: ['#6366f1','#a855f7','#ec4899','#f59e0b','#10b981'][i % 5],
                animationDelay: `${(i % 5) * 0.12}s`, animationDuration: '1.1s',
              }} />
          ))}
        </div>

        <div className="text-5xl mb-2">{leveledUp ? '🎉' : '✅'}</div>
        <h3 className="text-lg font-bold text-slate-900">{leveledUp ? t('level_up', { level: after.level }) : t('lesson_done')}</h3>

        <div className="mt-3 inline-flex items-center gap-1.5 bg-gradient-to-r from-brand-500 to-purple-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow">
          +{xpGained} XP
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="font-semibold">{t('level', { level: after.level })}</span>
            <span className="tabular-nums">{after.xp_into_level}/{after.xp_for_level} XP</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-1000 ease-out" style={{ width: `${animPct}%` }} />
          </div>
        </div>

        {after.streak_current > 1 && (
          <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full font-medium">
            🔥 {t('streak', { days: after.streak_current })}
          </div>
        )}

        {newBadge && (
          <div className="mt-4 flex items-center justify-center gap-2 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-2xl">{newBadge.icon || '🏅'}</span>
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-wider text-amber-700 font-bold">{t('new_badge')}</div>
              <div className="text-sm font-semibold text-slate-800">{newBadge.name || ''}</div>
            </div>
          </div>
        )}

        <button onClick={onClose} className="mt-6 w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
          {t('continue')}
        </button>
      </div>
    </div>
  );
}
