'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';

interface GamState {
  ok: boolean; xp_total: number; level: number; streak_current: number; streak_longest: number;
  level_floor_xp: number; next_level_xp: number; xp_into_level: number; xp_for_level: number;
  badges?: Array<{ code: string; icon?: string; name?: string }>;
}

interface NextGoal { courseId: string; courseTitle: string; emoji: string; progressPct: number }

export function StudentMomentumBar({ nextGoal }: { nextGoal: NextGoal | null }) {
  const t = useTranslations('momentum');
  const [g, setG] = useState<GamState | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.rpc('nl_gam_my_state').then(({ data }) => { if (data?.ok) setG(data as GamState); }).catch(() => {});
  }, []);

  if (!g) return null;
  const pct = g.xp_for_level ? Math.round((g.xp_into_level / g.xp_for_level) * 100) : 0;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-600 text-white p-5 sm:p-6 shadow-lg relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="relative flex items-center gap-5 flex-wrap">
        {/* Nível + XP */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-white/70 leading-none">{t('level_short')}</span>
            <span className="text-2xl font-extrabold leading-none">{g.level}</span>
          </div>
          <div className="min-w-[140px]">
            <div className="flex items-center justify-between text-[11px] text-white/80 mb-1">
              <span className="font-semibold">{g.xp_total} XP</span>
              <span className="tabular-nums">{g.xp_into_level}/{g.xp_for_level}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[11px] text-white/70 mt-1">{t('to_next', { xp: Math.max(0, g.xp_for_level - g.xp_into_level) })}</p>
          </div>
        </div>

        {/* Streak */}
        {g.streak_current > 0 && (
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3 py-2">
            <span className="text-xl">🔥</span>
            <div>
              <div className="text-lg font-bold leading-none">{g.streak_current}</div>
              <div className="text-[10px] text-white/70 uppercase tracking-wide">{t('day_streak')}</div>
            </div>
          </div>
        )}

        {/* Próximo objetivo */}
        {nextGoal && (
          <Link href={`/learn/curso/${nextGoal.courseId}/continuar` as any}
            className="flex-1 min-w-[200px] flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-4 py-2.5 group">
            <span className="text-2xl flex-shrink-0">{nextGoal.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-white/70">{t('continue_label')}</div>
              <div className="text-sm font-semibold truncate">{nextGoal.courseTitle}</div>
            </div>
            <span className="flex-shrink-0 text-xs font-bold bg-white text-brand-700 px-3 py-1.5 rounded-lg group-hover:scale-105 transition-transform">
              {t('resume')} →
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
