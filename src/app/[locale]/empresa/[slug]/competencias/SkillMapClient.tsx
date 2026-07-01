'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Target, Users, ChevronDown, ChevronUp, BadgeCheck, AlertTriangle, Sparkles } from 'lucide-react';

type SkillMember = { user_id: string; name: string | null; avatar_url: string | null; score: number | null; status: string | null; level_id: string | null; level_code: string | null; confidence: number | null };
type Skill = {
  skill_id: string; label_key: string; code: string; target_level: number | null; weight: number | null;
  members_with: number; members_validated: number; avg_score: number; coverage_pct: number; gap: number;
  members: SkillMember[];
};
type Person = { user_id: string; name: string | null; avatar_url: string | null; role: string; skills_count: number; validated_count: number; avg_score: number };
type SkillMap = {
  ok: boolean;
  summary: { total_members: number; skills_tracked: number; fully_covered: number; with_gaps: number };
  skills: Skill[];
  people: Person[];
};

export function SkillMapClient({ data, orgSlug }: { data: SkillMap; orgSlug: string }) {
  const t = useTranslations();
  const [view, setView] = useState<'skill' | 'person'>('skill');
  const [open, setOpen] = useState<string | null>(null);

  function safeT(key: string, fb: string): string {
    try { const v = t(key as never); if (v && typeof v === 'string' && v !== key) return v; } catch { /* */ }
    return fb;
  }

  const skills = data.skills || [];
  const people = data.people || [];

  if (skills.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <Target className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">{safeT('academy.skillmap.no_skills', 'Ainda sem competências mapeadas. Liga competências aos cursos para o mapa ganhar vida.')}</p>
        <Link href={`/empresa/${orgSlug}/cursos/propostas` as never} className="inline-flex items-center gap-1.5 mt-4 text-sm text-brand-600 font-medium hover:underline">
          <Sparkles className="h-4 w-4" /> {safeT('academy.skillmap.assign', 'Atribuir formação')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard icon={<Users className="h-4 w-4" />} label={safeT('academy.skillmap.summary_members', 'Pessoas')} value={data.summary.total_members} tone="slate" />
        <SummaryCard icon={<Target className="h-4 w-4" />} label={safeT('academy.skillmap.summary_tracked', 'Competências')} value={data.summary.skills_tracked} tone="indigo" />
        <SummaryCard icon={<BadgeCheck className="h-4 w-4" />} label={safeT('academy.skillmap.summary_covered', '100% cobertas')} value={data.summary.fully_covered} tone="emerald" />
        <SummaryCard icon={<AlertTriangle className="h-4 w-4" />} label={safeT('academy.skillmap.summary_gaps', 'Com lacunas')} value={data.summary.with_gaps} tone="amber" />
      </div>

      {/* Toggle de vista */}
      <div className="flex gap-1.5">
        <button onClick={() => setView('skill')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${view === 'skill' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          <Target className="h-4 w-4" /> {safeT('academy.skillmap.by_skill', 'Por competência')}
        </button>
        <button onClick={() => setView('person')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${view === 'person' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          <Users className="h-4 w-4" /> {safeT('academy.skillmap.by_person', 'Por pessoa')}
        </button>
      </div>

      {/* Vista por competência */}
      {view === 'skill' && (
        <div className="space-y-2.5">
          {skills.map((s) => {
            const isOpen = open === s.skill_id;
            const hasGap = s.gap > 0;
            return (
              <div key={s.skill_id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <button onClick={() => setOpen(isOpen ? null : s.skill_id)} className="w-full p-4 text-left">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="font-semibold text-sm text-slate-800 truncate">{safeT(s.label_key, s.code)}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasGap ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                          <AlertTriangle className="h-3 w-3" />{s.gap} {safeT('academy.skillmap.missing', 'em falta')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                          <BadgeCheck className="h-3 w-3" />100%
                        </span>
                      )}
                      {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>{s.members_with} {safeT('academy.skillmap.people', 'pessoas')} · {s.members_validated} {safeT('academy.skillmap.validated', 'validadas')}</span>
                    <span className="tabular-nums">{s.coverage_pct}% {safeT('academy.skillmap.coverage', 'cobertura')}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${hasGap ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`} style={{ width: `${s.coverage_pct}%` }} />
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
                    {s.members.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">{safeT('academy.skillmap.nobody', 'Ninguém domina esta competência ainda.')}</p>
                    ) : (
                      <div className="space-y-2">
                        {s.members.map((m) => (
                          <div key={m.user_id} className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-[11px] text-slate-500 font-medium shrink-0">
                              {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" /> : (m.name?.[0]?.toUpperCase() || '?')}
                            </div>
                            <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">{m.name || '—'}</span>
                            {m.level_code && <span className="text-[10px] text-slate-400 uppercase tracking-wide">{m.level_code}</span>}
                            {m.status === 'validated' && <BadgeCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                            <span className="text-xs font-semibold text-slate-600 tabular-nums w-9 text-right">{Math.round(m.score || 0)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {hasGap && (
                      <Link href={`/empresa/${orgSlug}/cursos/propostas` as never} className="inline-flex items-center gap-1.5 mt-3 text-xs text-brand-600 font-medium hover:underline">
                        <Sparkles className="h-3.5 w-3.5" /> {safeT('academy.skillmap.assign', 'Atribuir formação')}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Vista por pessoa */}
      {view === 'person' && (
        <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
          {people.map((p) => (
            <div key={p.user_id} className="flex items-center gap-3 p-3.5">
              <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-500 font-medium shrink-0">
                {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : (p.name?.[0]?.toUpperCase() || '?')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-900 truncate">{p.name || '—'}</div>
                <div className="text-[11px] text-slate-400">
                  {p.skills_count} {safeT('academy.skillmap.skills_word', 'competências')} · {p.validated_count} {safeT('academy.skillmap.validated', 'validadas')}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-slate-900 tabular-nums leading-none">{p.avg_score}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{safeT('academy.skillmap.avg', 'média')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'slate' | 'indigo' | 'emerald' | 'amber' }) {
  const tones: Record<string, string> = {
    slate: 'text-slate-500', indigo: 'text-brand-500', emerald: 'text-emerald-500', amber: 'text-amber-500',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold ${tones[tone]}`}>{icon}{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}
