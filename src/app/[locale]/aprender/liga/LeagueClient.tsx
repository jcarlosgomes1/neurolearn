'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

type Row = {
  rank: number; student_name: string | null; avatar_url: string | null;
  xp_total: number; level: number; is_me: boolean;
};

export function LeagueClient({ locale }: { locale: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const t = (k: string) => msgs[k] ?? k;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [lb, m] = await Promise.all([
          supabase.rpc('nl_gam_leaderboard', { p_limit: 50 }),
          supabase.rpc('nl_i18n_messages_for_lang', { p_lang: locale }),
        ]);
        const d = lb.data as { leaderboard?: Row[]; my_rank?: number } | null;
        if (d?.leaderboard) setRows(d.leaderboard);
        setMyRank(d?.my_rank ?? null);
        if (m.data && typeof m.data === 'object') setMsgs(m.data as Record<string, string>);
      } catch { /* noop */ }
      finally { setLoading(false); }
    })();
  }, [supabase, locale]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : String(rank));

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <AppPageHeader title={t('liga.title')} description={t('liga.subtitle')} />

      {myRank != null && (
        <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-3 text-sm font-medium">
          {t('liga.my_rank')}: #{myRank}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">{t('liga.empty')}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.rank} className={'flex items-center gap-3 rounded-2xl border p-3 ' + (r.is_me ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white')}>
              <div className="w-8 text-center text-lg font-bold text-slate-700">{medal(r.rank)}</div>
              {r.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">{(r.student_name ?? '?').slice(0, 1).toUpperCase()}</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-900 truncate">{r.is_me ? t('liga.you') : (r.student_name ?? '—')}</div>
                <div className="text-xs text-slate-500">{t('liga.level')} {r.level}</div>
              </div>
              <div className="text-sm font-semibold text-violet-600">{r.xp_total} XP</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
