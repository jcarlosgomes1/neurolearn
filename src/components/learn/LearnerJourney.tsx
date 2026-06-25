'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import {
  Flame, Trophy, Sparkles, Play, BookOpen, Target, Award, ChevronRight,
  CheckCircle2, Gift, Crown, Zap, Loader2,
} from 'lucide-react';

export type JGam = { xp_total: number; level: number; streak_current: number; streak_longest: number; level_floor_xp: number; next_level_xp: number; xp_into_level: number; xp_for_level: number };
export type JChallenge = { code: string; period: string; target: number; current: number; pct: number; completed: boolean; claimed: boolean; reward_xp: number; icon: string | null; label_key: string; desc_key: string };
export type JLbRow = { rank: number; student_name: string | null; avatar_url: string | null; xp_total: number; level: number; is_me: boolean };
export type JSkill = { skill_id: string; code: string; label_key: string; score: number; status: string; level_code: string | null };
export type JCourse = { course_id: string; title: string; subtitle?: string | null; emoji?: string | null; progress_pct?: number; completed?: boolean };
export type JourneyData = {
  gam: JGam;
  challenges: JChallenge[];
  leaderboard: { rows: JLbRow[]; my_rank: number | null };
  skills: JSkill[];
  continue: JCourse | null;
  courses: JCourse[];
  discover: JCourse[];
};

const reduced = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useMounted() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return on;
}

function useCountUp(target: number, durationMs = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (reduced()) { setVal(target); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return val;
}

function Reveal({ i = 0, children }: { i?: number; children: React.ReactNode }) {
  const on = useMounted();
  return (
    <div style={{
      opacity: on ? 1 : 0,
      transform: on ? 'none' : 'translateY(12px)',
      transition: 'opacity .55s ease, transform .55s cubic-bezier(.2,.7,.2,1)',
      transitionDelay: `${i * 70}ms`,
      willChange: 'opacity, transform',
    }}>
      {children}
    </div>
  );
}

function Ring({ pct, size = 56 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const target = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  const [off, setOff] = useState(c);
  useEffect(() => {
    if (reduced()) { setOff(target); return; }
    const id = requestAnimationFrame(() => setOff(target));
    return () => cancelAnimationFrame(id);
  }, [target, c]);
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off}
        style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)' }} />
    </svg>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  const v = useCountUp(value, 800);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">{icon}</div>
      <div className="text-xl font-bold text-slate-900 tabular-nums leading-none">{v}</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}

export function LearnerJourney({
  data, brand, title, eyebrow, onClaim, claimingCode,
}: {
  data: JourneyData; brand: string; title: string; eyebrow: string;
  onClaim?: (code: string) => void; claimingCode?: string | null;
}) {
  const t = useTranslations();
  function safeT(key: string, fb: string): string {
    try { const v = t(key as never); if (v && typeof v === 'string' && v !== key) return v; } catch { /* */ }
    return fb;
  }

  const g = data.gam;
  const xpPct = g.xp_for_level > 0 ? Math.round((g.xp_into_level / g.xp_for_level) * 100) : 0;
  const challenges = data.challenges || [];
  const lb = data.leaderboard?.rows || [];
  const skills = Array.isArray(data.skills) ? data.skills : [];

  const mounted = useMounted();
  const xpCount = useCountUp(g.xp_total, 1000);
  const heroBg = `linear-gradient(135deg, var(--accent, ${brand}), var(--accent-bright, #8b5cf6))`;
  const ctaBg = `linear-gradient(135deg, var(--accent, ${brand}), var(--accent-bright, #6366f1))`;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Reveal i={0}>
        <div className="relative overflow-hidden rounded-3xl p-6 text-white" style={{ background: heroBg }}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{eyebrow}</p>
            <h1 className="font-display font-bold text-2xl sm:text-3xl mt-0.5 tracking-tight">{title}</h1>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center font-bold text-lg"
                  style={{ transform: mounted ? 'scale(1)' : 'scale(.55)', transition: 'transform .6s cubic-bezier(.2,.9,.3,1.5)' }}>{g.level}</div>
                <div>
                  <div className="text-[11px] text-white/70 uppercase tracking-wide">{safeT('academy.learn.level', 'Nível')}</div>
                  <div className="text-sm font-semibold tabular-nums">{xpCount} XP</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1.5">
                <Flame className="h-4 w-4" /><span className="text-sm font-semibold tabular-nums">{g.streak_current}</span>
                <span className="text-[11px] text-white/70">{safeT('academy.learn.streak', 'dias')}</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-white/70 mb-1">
                <span>{safeT('academy.learn.to_next', 'Para o nível')} {g.level + 1}</span>
                <span className="tabular-nums">{g.xp_into_level}/{g.xp_for_level} XP</span>
              </div>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full bg-white" style={{ width: mounted ? `${xpPct}%` : '0%', transition: 'width 1.1s cubic-bezier(.2,.7,.2,1)' }} />
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Continuar */}
      {data.continue ? (
        <Reveal i={1}>
          <Link href={`/learn/curso/${data.continue.course_id}/continuar` as never}
            className="group flex items-center gap-4 rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all" style={{ background: ctaBg }}>
            <Ring pct={data.continue.progress_pct || 0} />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-white/70 flex items-center gap-1"><Play className="h-3 w-3" />{safeT('academy.learn.continue', 'Continuar')}</div>
              <div className="font-bold truncate">{data.continue.emoji} {data.continue.title}</div>
              <div className="text-xs text-white/80 mt-0.5">{Math.round(data.continue.progress_pct || 0)}% {safeT('academy.learn.done', 'concluído')}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-white/70 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>
        </Reveal>
      ) : data.discover.length > 0 ? (
        <Reveal i={1}>
          <Link href={`/curso/${data.discover[0].course_id}` as never}
            className="group flex items-center gap-4 rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all" style={{ background: ctaBg }}>
            <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center"><Sparkles className="h-6 w-6" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-white/70">{safeT('academy.learn.start', 'Começar a aprender')}</div>
              <div className="font-bold truncate">{data.discover[0].emoji} {data.discover[0].title}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-white/70 shrink-0" />
          </Link>
        </Reveal>
      ) : null}

      {/* Stats */}
      <Reveal i={2}>
        <div className="grid grid-cols-3 gap-3">
          <MiniStat icon={<BookOpen className="h-4 w-4" />} label={safeT('academy.learn.enrolled', 'A frequentar')} value={data.courses.length} />
          <MiniStat icon={<CheckCircle2 className="h-4 w-4" />} label={safeT('academy.learn.completed', 'Concluídos')} value={data.courses.filter((c) => c.completed).length} />
          <MiniStat icon={<Flame className="h-4 w-4" />} label={safeT('academy.learn.best_streak', 'Melhor streak')} value={g.streak_longest} />
        </div>
      </Reveal>

      {/* Os meus cursos */}
      {data.courses.length > 0 && (
        <Reveal i={3}>
          <section>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{safeT('academy.learn.my_courses', 'Os meus cursos')}</h2>
            <div className="space-y-2.5">
              {data.courses.map((c) => (
                <Link key={c.course_id}
                  href={`/learn/curso/${c.course_id}/continuar` as never}
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
        </Reveal>
      )}

      {/* Desafios */}
      {challenges.length > 0 && (
        <Reveal i={4}>
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
                    {ch.completed && !ch.claimed && onClaim ? (
                      <button onClick={() => onClaim(ch.code)} disabled={claimingCode === ch.code}
                        className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-2.5 py-1.5 hover:opacity-90 disabled:opacity-50 shrink-0 active:scale-95 transition-transform">
                        {claimingCode === ch.code ? <Loader2 className="h-3 w-3 animate-spin" /> : <Gift className="h-3 w-3" />}+{ch.reward_xp}
                      </button>
                    ) : ch.claimed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {/* Ranking */}
      {lb.length > 0 && (
        <Reveal i={5}>
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
        </Reveal>
      )}

      {/* Competências */}
      {skills.length > 0 && (
        <Reveal i={6}>
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
        </Reveal>
      )}

      {/* Descobrir */}
      {data.discover.length > 0 && (
        <Reveal i={7}>
          <section>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-violet-500" />{safeT('academy.learn.discover', 'Descobrir na Academia')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {data.discover.slice(0, 6).map((c) => (
                <Link key={c.course_id} href={`/curso/${c.course_id}` as never}
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
        </Reveal>
      )}
    </div>
  );
}
