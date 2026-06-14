'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Challenge {
  code: string; period: 'daily' | 'weekly'; metric: string;
  target: number; current: number; pct: number;
  completed: boolean; claimed: boolean;
  reward_xp: number; reward_badge_code?: string | null;
  icon: string; label_key: string; desc_key?: string | null;
}

export function DailyChallenges() {
  const t = useTranslations();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_gam_challenges_for_me');
      if (data?.ok) setChallenges(data.challenges || []);
    } catch { /* silencioso */ } finally { setLoaded(true); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function claim(code: string) {
    setClaiming(code);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_gam_challenge_claim', { p_code: code });
      if (error) throw error;
      if (data?.ok) {
        toast.success(safeT('challenge.claimed_xp', '+{xp} XP!').replace('{xp}', String(data.reward_xp)));
        await load();
      } else {
        toast.error(safeT('challenge.claim_error', 'Não foi possível resgatar.'));
      }
    } catch { toast.error(safeT('challenge.claim_error', 'Não foi possível resgatar.')); }
    finally { setClaiming(null); }
  }

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  if (!loaded || challenges.length === 0) return null;

  const daily = challenges.filter((c) => c.period === 'daily');
  const weekly = challenges.filter((c) => c.period === 'weekly');

  const Card = (c: Challenge) => (
    <div key={c.code} className={`relative rounded-xl border p-3.5 transition-all ${c.completed ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <span className={`text-2xl flex-shrink-0 ${c.completed && !c.claimed ? 'animate-bounce' : ''}`}>{c.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800 truncate">{safeT(c.label_key, c.code)}</span>
            <span className="text-[11px] font-bold text-brand-600 flex-shrink-0">+{c.reward_xp} XP</span>
          </div>
          {c.desc_key && <p className="text-[11px] text-slate-500 mt-0.5">{safeT(c.desc_key, '')}</p>}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${c.completed ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-500 to-purple-500'}`} style={{ width: `${c.pct}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 tabular-nums flex-shrink-0">{Math.min(c.current, c.target)}/{c.target}</span>
          </div>
        </div>
      </div>
      {c.completed && !c.claimed && (
        <button onClick={() => claim(c.code)} disabled={claiming === c.code}
          className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-50">
          {claiming === c.code ? '…' : safeT('challenge.claim', 'Resgatar recompensa')}
        </button>
      )}
      {c.claimed && (
        <div className="mt-3 w-full text-center text-xs font-semibold text-emerald-700 bg-emerald-100 py-2 rounded-lg">
          ✓ {safeT('challenge.done', 'Concluído')}
        </div>
      )}
    </div>
  );

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🎯</span>
        <h2 className="font-semibold text-slate-900">{safeT('challenge.section_title', 'Desafios')}</h2>
      </div>

      {daily.length > 0 && (
        <div className="mb-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{safeT('challenge.daily', 'Hoje')}</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{daily.map(Card)}</div>
        </div>
      )}
      {weekly.length > 0 && (
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{safeT('challenge.weekly', 'Esta semana')}</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{weekly.map(Card)}</div>
        </div>
      )}
    </section>
  );
}
