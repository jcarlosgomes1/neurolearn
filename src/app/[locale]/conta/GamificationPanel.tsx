'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Flame, Trophy, Lock, Medal, Crown, Users } from 'lucide-react';

type State = {
  ok: boolean; xp_total: number; level: number; streak_current: number; streak_longest: number;
  level_floor_xp: number; next_level_xp: number; xp_into_level: number; xp_for_level: number;
  badges: { code: string; name: string; desc: string; icon: string; tier: string; earned_at: string }[];
};
type Badge = { code: string; name: string; desc: string; icon: string; tier: string; xp_reward: number; earned: boolean; earned_at: string | null };
type LbRow = { rank: number; student_name: string; avatar_url: string | null; xp_total: number; level: number; is_me: boolean };
type Org = { org_id: string; name: string; slug: string; role: string; plan: string };

const TIER_RING: Record<string, string> = {
  bronze: 'ring-amber-300 bg-amber-50', silver: 'ring-slate-300 bg-slate-50',
  gold: 'ring-yellow-400 bg-yellow-50', platinum: 'ring-brand-400 bg-brand-50',
};

export function GamificationPanel() {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<State | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [lb, setLb] = useState<{ leaderboard: LbRow[]; my_rank: number | null; scope: string } | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [view, setView] = useState<'badges' | 'leaderboard'>('badges');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // detetar tenant primeiro
        const { data: orgs } = await supabase.rpc('nl_my_orgs');
        const firstOrg = Array.isArray(orgs) && orgs.length > 0 ? orgs[0] as Org : null;
        setOrg(firstOrg);
        const lbArgs = firstOrg ? { p_limit: 10, p_org_id: firstOrg.org_id } : { p_limit: 10 };
        const [s, b, l] = await Promise.all([
          supabase.rpc('nl_gam_my_state'),
          supabase.rpc('nl_gam_my_badges'),
          supabase.rpc('nl_gam_leaderboard', lbArgs),
        ]);
        if ((s.data as State)?.ok) setState(s.data as State);
        if (Array.isArray(b.data)) setBadges(b.data as Badge[]);
        if ((l.data as { ok?: boolean })?.ok) setLb(l.data as { leaderboard: LbRow[]; my_rank: number | null; scope: string });
      } catch { /* noop */ }
      finally { setLoading(false); }
    })();
  }, [supabase]);

  if (loading || !state) return null;
  const pct = state.xp_for_level > 0 ? Math.min(100, Math.round((state.xp_into_level / state.xp_for_level) * 100)) : 0;
  const toNext = Math.max(0, state.next_level_xp - state.xp_total);
  const earned = badges.filter((b) => b.earned);
  const lockedCount = badges.length - earned.length;

  return (
    <div className="bg-gradient-to-br from-brand-600 via-brand-600 to-blue-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg overflow-hidden relative">
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex flex-col items-center justify-center font-bold leading-none">
              <span className="text-[10px] uppercase opacity-80">{t('gam.ui.level')}</span>
              <span className="text-xl">{state.level}</span>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums">{state.xp_total} <span className="text-sm font-medium opacity-80">{t('gam.ui.xp')}</span></div>
              <div className="text-xs opacity-80">{toNext} {t('gam.ui.xp')} {t('gam.ui.to_next_level')}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-3 py-1.5">
            <Flame className={`h-4 w-4 ${state.streak_current > 0 ? 'text-orange-300' : 'opacity-50'}`} />
            <span className="font-bold tabular-nums">{state.streak_current}</span>
            <span className="text-xs opacity-80">{t('gam.ui.days')}</span>
          </div>
        </div>

        <div className="h-2.5 bg-white/20 rounded-full overflow-hidden mb-5">
          <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setView('badges')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition ${view === 'badges' ? 'bg-white text-brand-700' : 'bg-white/15 text-white hover:bg-white/25'}`}>
            <Medal className="h-3.5 w-3.5" /> {t('gam.ui.badges')}
          </button>
          <button onClick={() => setView('leaderboard')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition ${view === 'leaderboard' ? 'bg-white text-brand-700' : 'bg-white/15 text-white hover:bg-white/25'}`}>
            <Trophy className="h-3.5 w-3.5" /> {t('gam.ui.leaderboard')}
            {org && <span className="ml-1 inline-flex items-center gap-0.5"><Users className="h-3 w-3" /></span>}
          </button>
        </div>

        {view === 'badges' ? (
          <div>
            {earned.length === 0 ? (
              <p className="text-sm opacity-80 py-2">{t('gam.ui.no_badges_yet')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {earned.map((b) => (
                  <div key={b.code} title={`${t(b.name)} — ${t(b.desc)}`}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ring-2 ring-offset-1 ring-offset-transparent ${TIER_RING[b.tier] || TIER_RING.bronze}`}>
                    <span>{b.icon}</span>
                  </div>
                ))}
              </div>
            )}
            {lockedCount > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs bg-white/10 rounded-full px-3 py-1.5">
                <Lock className="h-3.5 w-3.5 opacity-70" /> {lockedCount} {t('gam.ui.locked_remaining')}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {org && (
              <div className="flex items-center gap-1.5 text-xs opacity-80 mb-2">
                <Users className="h-3.5 w-3.5" /> {org.name}
              </div>
            )}
            {!lb || lb.leaderboard.length === 0 ? (
              <p className="text-sm opacity-80 py-3">{t('gam.ui.no_rank')}</p>
            ) : lb.leaderboard.map((r) => (
              <div key={r.rank} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${r.is_me ? 'bg-white/25' : 'bg-white/10'}`}>
                <span className="w-6 text-center font-bold tabular-nums text-sm">
                  {r.rank === 1 ? <Crown className="h-4 w-4 text-yellow-300 inline" /> : r.rank}
                </span>
                <span className="flex-1 truncate text-sm font-medium">{r.is_me ? t('gam.ui.you') : (r.student_name || '—')}</span>
                <span className="text-xs opacity-80">{t('gam.ui.level')} {r.level}</span>
                <span className="font-bold tabular-nums text-sm">{r.xp_total}</span>
              </div>
            ))}
            {lb?.my_rank && lb.my_rank > 10 && (
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 bg-white/25 mt-2">
                <span className="w-6 text-center font-bold tabular-nums text-sm">{lb.my_rank}</span>
                <span className="flex-1 text-sm font-medium">{t('gam.ui.you')}</span>
                <span className="font-bold tabular-nums text-sm">{state.xp_total}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
