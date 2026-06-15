'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';
import { toast } from 'sonner';
import {
  Flame, Trophy, Sparkles, Play, BookOpen, Target, Award, ChevronRight,
  Loader2, CheckCircle2, Gift, Crown, Zap,
} from 'lucide-react';

type Gam = { ok: boolean; xp_total: number; level: number; streak_current: number; streak_longest: number; level_floor_xp: number; next_level_xp: number; xp_into_level: number; xp_for_level: number; badges: { code: string; name: string; icon: string; tier: string }[] };
type Challenge = { code: string; period: string; target: number; current: number; pct: number; completed: boolean; claimed: boolean; reward_xp: number; icon: string | null; label_key: string; desc_key: string };
type LbRow = { rank: number; student_name: string | null; avatar_url: string | null; xp_total: number; level: number; is_me: boolean };
type Skill = { skill_id: string; code: string; label_key: string; score: number; status: string; level_code: string | null };
type CourseLite = { course_id: string; title: string; subtitle?: string | null; emoji?: string | null; progress_pct?: number; completed?: boolean };
type Learning = {
  ok: boolean;
  gam: Gam;
  challenges: { challenges: Challenge[] };
  leaderboard: { leaderboard: LbRow[]; my_rank: number | null };
  skills: Skill[];
  continue: CourseLite | null;
  enrolled: CourseLite[];
  available: CourseLite[];
  counts: { enrolled: number; completed: number };
};

function Ring({ pct, size = 56, brand }: { pct: number; size?: number; brand: string }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
    </svg>
  );
}

export function MyAcademyClient({ orgId, orgSlug, orgName, brand }: { orgId: string; orgSlug: string; orgName: string; brand: string }) {
  const t = useTranslations();
  const [data, setData] = useState<Learning | null>(null);
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
      if ((d as Learning)?.ok) setData(d as Learning);
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

  const g = data.gam;
  const xpPct = g.xp_for_level > 0 ? Math.round((g.xp_into_level / g.xp_for_level) * 100) : 0;
  const challenges = data.challenges?.challenges || [];
  const lb = data.leaderboard?.leaderboard || [];
  const skills = Array.isArray(data.skills) ? data.skills : [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Hero: a tua Academia */}
      <div className="relative overflow-hidden rounded-3xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${brand}, #8b5cf6)` }}>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{safeT('academy.learn.eyebrow', 'A tua Academia')}</p>
          <h1 className="text-2xl font-bold mt-0.5">{orgName}</h1>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center font-bold text-lg">{g.level}</div>
              <div>
                <div className="text-[11px] text-white/70 uppercase tracking-wide">{safeT('academy.learn.level', 'Nível')}</div>
                <div className="text-sm font-semibold">{g.xp_total} XP</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1.5">
              <Flame className="h-4 w-4" /><span className="text-sm font-semibold">{g.streak_current}</span>
              <span className="text-[11px] text-white/70">{safeT('academy.learn.streak', 'dias')}</span>
            </div>
          </div>
          {/* barra XP para o próximo nível */}
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-white/70 mb-1">
              <span>{safeT('academy.learn.to_next', 'Para o nível')} {g.level + 1}</span>
              <span className="tabular-nums">{g.xp_into_level}/{g.xp_for_level} XP</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Continuar (destaque) */}
      {data.continue ? (
        <Link href={{ pathname: '/learn/curso/[id]/continuar', params: { id: data.continue.course_id } } as never}
          className="group flex items-center gap-4 rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all" style={{ background: `linear-gradient(135deg, ${brand}, #6366f1)` }}>
          <Ring pct={data.continue.progress_pct || 0} brand={brand} />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-white/70 flex items-center gap-1"><Play className="h-3 w-3" />{safeT('academy.learn.continue', 'Continuar')}</div>
            <div className="font-bold truncate">{data.continue.emoji} {data.continue.title}</div>
            <div className="text-xs text-white/80 mt-0.5">{Math.round(data.continue.progress_pct || 0)}% {safeT('academy.learn.done', 'concluído')}</div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/70 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>
      ) : data.available.length > 0 ? (
        <Link href={{ pathname: '/curso/[id]', params: { id: data.available[0].course_id } } as never}
          className="group flex items-center gap-4 rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all" style={{ background: `linear-gradient(135deg, ${brand}, #6366f1)` }}>
          <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center"><Sparkles className="h-6 w-6" /></div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-white/70">{safeT('academy.learn.start', 'Começar a aprender')}</div>
            <div className="font-bold truncate">{data.available[0].emoji} {data.available[0].title}</div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/70 shrink-0" />
        </Link>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat icon={<BookOpen className="h-4 w-4" />} label={safeT('academy.learn.enrolled', 'A frequentar')} value={data.counts.enrolled} />
        <MiniStat icon={<CheckCircle2 className="h-4 w-4" />} label={safeT('academy.learn.completed', 'Concluídos')} value={data.counts.completed} />
        <MiniStat icon={<Flame className="h-4 w-4" />} label={safeT('academy.learn.best_streak', 'Melhor streak')} value={g.streak_longest} />
      </div>

      {/* Os meus cursos */}
      {data.enrolled.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{safeT('academy.learn.my_courses', 'Os meus cursos')}</h2>
          <div className="space-y-2.5">
            {data.enrolled.map((c) => (
              <Link key={c.course_id}
                href={(c.completed
                  ? { pathname: '/curso/[id]', params: { id: c.course_id } }
                  : { pathname: '/learn/curso/[id]/continuar', params: { id: c.course_id } }) as never}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 hover:border-indigo-300 hover:shadow-sm transition-all">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-lg shrink-0">{c.emoji || '📘'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900 truncate">{c.title}</div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${c.completed ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`} style={{ width: `${c.completed ? 100 : Math.round(c.progress_pct || 0)}%` }} />
                  </div>
                </div>
                {c.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> : <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 shrink-0" />}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Desafios */}
      {challenges.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Zap className="h-4 w-4 text-amber-500" />{safeT('academy.learn.challenges', 'Desafios')}</h2>
          <div className="space-y-2.5">
            {challenges.map((ch) => (
              <div key={ch.code} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{ch.icon || '🎯'}</span>
                    <span className="font-medium text-sm text-slate-800 truncate">{safeT(ch.label_key, ch.code)}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 shrink-0">{ch.period === 'daily' ? safeT('academy.learn.daily', 'diário') : safeT('academy.learn.weekly', 'semanal')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${ch.pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 tabular-nums shrink-0">{ch.current}/{ch.target}</span>
                  {ch.completed && !ch.claimed ? (
                    <button onClick={() => claim(ch.code)} disabled={claiming === ch.code}
                      className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-2.5 py-1.5 hover:opacity-90 disabled:opacity-50 shrink-0">
                      {claiming === ch.code ? <Loader2 className="h-3 w-3 animate-spin" /> : <Gift className="h-3 w-3" />}+{ch.reward_xp}
                    </button>
                  ) : ch.claimed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 shrink-0"><CheckCircle2 className="h-3.5 w-3.5" /></span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ranking interno */}
      {lb.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Trophy className="h-4 w-4 text-amber-500" />{safeT('academy.learn.ranking', 'Ranking da equipa')}</h2>
          <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
            {lb.map((r) => (
              <div key={r.rank} className={`flex items-center gap-3 p-3 ${r.is_me ? 'bg-indigo-50/60' : ''}`}>
                <div className={`w-7 text-center font-bold text-sm tabular-nums ${r.rank === 1 ? 'text-amber-500' : r.rank === 2 ? 'text-slate-400' : r.rank === 3 ? 'text-orange-400' : 'text-slate-300'}`}>
                  {r.rank <= 3 ? <Crown className="h-4 w-4 inline" /> : r.rank}
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-xs text-slate-500 font-medium shrink-0">
                  {r.avatar_url ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" /> : (r.student_name?.[0]?.toUpperCase() || '?')}
                </div>
                <span className="flex-1 min-w-0 truncate text-sm text-slate-800">{r.is_me ? safeT('academy.learn.you', 'Tu') : (r.student_name || '—')}</span>
                <span className="text-xs font-semibold text-slate-500 tabular-nums shrink-0">{r.xp_total} XP</span>
              </div>
            ))}
          </div>
          {data.leaderboard?.my_rank && data.leaderboard.my_rank > lb.length && (
            <p className="text-xs text-slate-400 mt-2 text-center">{safeT('academy.learn.your_rank', 'A tua posição')}: #{data.leaderboard.my_rank}</p>
          )}
        </section>
      )}

      {/* As minhas competências */}
      {skills.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Target className="h-4 w-4 text-indigo-500" />{safeT('academy.learn.skills', 'As minhas competências')}</h2>
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 12).map((s) => (
              <span key={s.skill_id} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${s.status === 'validated' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                {s.status === 'validated' && <Award className="h-3 w-3" />}
                {safeT(s.label_key, s.code)}
                <span className="text-slate-400 tabular-nums">{Math.round(s.score)}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Descobrir */}
      {data.available.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-violet-500" />{safeT('academy.learn.discover', 'Descobrir na Academia')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {data.available.slice(0, 6).map((c) => (
              <Link key={c.course_id} href={{ pathname: '/curso/[id]', params: { id: c.course_id } } as never}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 hover:border-violet-300 hover:shadow-sm transition-all">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center text-lg shrink-0">{c.emoji || '✨'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900 truncate">{c.title}</div>
                  {c.subtitle && <div className="text-[11px] text-slate-400 truncate">{c.subtitle}</div>}
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-violet-500 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">{icon}</div>
      <div className="text-xl font-bold text-slate-900 tabular-nums leading-none">{value}</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}
