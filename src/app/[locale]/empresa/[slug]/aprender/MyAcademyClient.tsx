'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { LearnerJourney, type JourneyData } from '@/components/learn/LearnerJourney';

export function MyAcademyClient({ orgId, orgName, brand }: { orgId: string; orgSlug: string; orgName: string; brand: string }) {
  const t = useTranslations();
  const [data, setData] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  function safeT(key: string, fb: string): string {
    try { const v = t(key as never); if (v && typeof v === 'string' && v !== key) return v; } catch { /* */ }
    return fb;
  }

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data: d } = await sb.rpc('nl_academy_my_learning', { p_org_id: orgId });
      const r = d as { ok?: boolean; gam: JourneyData['gam']; challenges?: { challenges: JourneyData['challenges'] }; leaderboard?: { leaderboard: JourneyData['leaderboard']['rows']; my_rank: number | null }; skills: JourneyData['skills']; continue: JourneyData['continue']; enrolled: JourneyData['courses']; available: JourneyData['discover'] };
      if (r?.ok) {
        setData({
          gam: r.gam,
          challenges: r.challenges?.challenges || [],
          leaderboard: { rows: r.leaderboard?.leaderboard || [], my_rank: r.leaderboard?.my_rank ?? null },
          skills: r.skills || [],
          continue: r.continue,
          courses: r.enrolled || [],
          discover: r.available || [],
        });
      }
    } catch { /* */ } finally { setLoading(false); }
  }, [orgId]);
  useEffect(() => { load(); }, [load]);

  async function claim(code: string) {
    setClaiming(code);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_gam_challenge_claim', { p_code: code });
      if (error) throw error;
      toast.success(safeT('academy.learn.claimed_toast', 'Recompensa resgatada!'));
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
    finally { setClaiming(null); }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  if (!data) return <div className="text-center py-24 text-slate-500">{safeT('academy.learn.unavailable', 'Indisponível.')}</div>;

  return (
    <LearnerJourney
      data={data}
      brand={brand}
      title={orgName}
      eyebrow={safeT('academy.learn.eyebrow', 'A tua Academia')}
      onClaim={claim}
      claimingCode={claiming}
    />
  );
}
