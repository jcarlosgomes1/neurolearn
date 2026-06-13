'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { toast } from 'sonner';
import { Route, Users, CheckCircle2, Loader2, Plus, Trash2, Star, TrendingUp, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface Assigned {
  path_id: string; slug: string; title: string; emoji: string | null;
  difficulty: string | null; estimated_hours: number | null; tagline: string | null;
  required: boolean; team_members: number; team_enrolled: number;
  team_completed: number; team_avg_progress: number;
}
interface CatalogPath {
  id: string; slug: string; title: string; emoji: string | null; difficulty: string | null;
  estimated_hours: number | null; tagline: string | null; subtitle: string | null; course_count: number;
}
interface TeamMember {
  user_id: string; name: string | null; role: string | null;
  enrolled: boolean; progress_pct: number; completed: boolean; completed_at: string | null;
}

const DIFF_CLASS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-rose-100 text-rose-700',
};

export function OrgPathsClient({ orgId, canManage, initialAssigned, catalog }: {
  orgId: string; canManage: boolean; initialAssigned: Assigned[]; catalog: CatalogPath[];
}) {
  const t = useTranslations();
  const [assigned, setAssigned] = useState<Assigned[]>(initialAssigned || []);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [team, setTeam] = useState<Record<string, TeamMember[]>>({});
  const [teamBusy, setTeamBusy] = useState<string | null>(null);

  const assignedIds = new Set(assigned.map((a) => a.path_id));
  const available = (catalog || []).filter((c) => !assignedIds.has(c.id));

  async function assign(c: CatalogPath, required: boolean) {
    setBusy(c.id);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_org_assign_path', { p_org_id: orgId, p_path_id: c.id, p_required: required });
      if (error) throw error;
      const r = data as { ok: boolean; error?: string };
      if (!r.ok) throw new Error(r.error);
      setAssigned((xs) => [{
        path_id: c.id, slug: c.slug, title: c.title, emoji: c.emoji, difficulty: c.difficulty,
        estimated_hours: c.estimated_hours, tagline: c.tagline, required,
        team_members: 0, team_enrolled: 0, team_completed: 0, team_avg_progress: 0,
      }, ...xs]);
      toast.success(t('empresa.paths.assigned_toast'));
    } catch { toast.error(t('empresa.paths.error')); }
    finally { setBusy(null); }
  }

  async function toggleRequired(a: Assigned) {
    setBusy(a.path_id);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_org_assign_path', { p_org_id: orgId, p_path_id: a.path_id, p_required: !a.required });
      if (error) throw error;
      const r = data as { ok: boolean };
      if (!r.ok) throw new Error();
      setAssigned((xs) => xs.map((x) => x.path_id === a.path_id ? { ...x, required: !x.required } : x));
    } catch { toast.error(t('empresa.paths.error')); }
    finally { setBusy(null); }
  }

  async function unassign(a: Assigned) {
    setBusy(a.path_id);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_org_unassign_path', { p_org_id: orgId, p_path_id: a.path_id });
      if (error) throw error;
      const r = data as { ok: boolean };
      if (!r.ok) throw new Error();
      setAssigned((xs) => xs.filter((x) => x.path_id !== a.path_id));
    } catch { toast.error(t('empresa.paths.error')); }
    finally { setBusy(null); }
  }

  async function toggleTeam(a: Assigned) {
    if (expanded === a.path_id) { setExpanded(null); return; }
    setExpanded(a.path_id);
    if (team[a.path_id]) return;
    setTeamBusy(a.path_id);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_org_path_team_progress', { p_org_id: orgId, p_path_id: a.path_id });
      if (error) throw error;
      const r = data as { ok: boolean; team?: TeamMember[] };
      if (!r.ok) throw new Error();
      setTeam((m) => ({ ...m, [a.path_id]: (r.team || []) as TeamMember[] }));
    } catch { toast.error(t('empresa.paths.error')); setExpanded(null); }
    finally { setTeamBusy(null); }
  }

  return (
    <div className="space-y-10">
      {/* ASSIGNED */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Route className="h-5 w-5 text-violet-600" /> {t('empresa.paths.assigned_h')}</h2>
        {assigned.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">{t('empresa.paths.none_assigned')}</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {assigned.map((a) => {
              const pct = a.team_members > 0 ? Math.round((a.team_enrolled / a.team_members) * 100) : 0;
              const isOpen = expanded === a.path_id;
              const members = team[a.path_id] || [];
              return (
                <div key={a.path_id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <span className="flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-2xl">{a.emoji || '🎓'}</span>
                    {a.required && <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded"><Star className="h-3 w-3" /> {t('empresa.paths.required')}</span>}
                  </div>
                  <Link href={`/aprender/percursos/${a.slug}` as any} className="group">
                    <h3 className="font-bold text-slate-900 group-hover:text-violet-700 transition-colors leading-tight">{a.title}</h3>
                  </Link>
                  {a.tagline && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.tagline}</p>}

                  {/* team metrics */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {t('empresa.paths.enrolled_of', { a: a.team_enrolled, b: a.team_members })}</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {a.team_completed}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400"><TrendingUp className="h-3 w-3" /> {t('empresa.paths.avg_progress', { n: a.team_avg_progress })}</div>
                  </div>

                  {canManage && (
                    <button onClick={() => toggleTeam(a)} disabled={teamBusy === a.path_id}
                      className="mt-3 inline-flex items-center justify-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900 disabled:opacity-50">
                      {teamBusy === a.path_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {isOpen ? t('empresa.paths.hide_team') : t('empresa.paths.view_team')}
                    </button>
                  )}

                  {canManage && isOpen && (
                    <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
                      {members.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">{t('empresa.paths.team_empty')}</p>
                      ) : members.map((mb) => (
                        <div key={mb.user_id} className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-slate-700 truncate">{mb.name || '—'}</span>
                              {mb.completed && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1">
                              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${mb.enrolled ? mb.progress_pct : 0}%` }} />
                            </div>
                          </div>
                          <span className="text-[11px] tabular-nums text-slate-500 w-16 text-right">
                            {mb.enrolled ? `${mb.progress_pct}%` : t('empresa.paths.not_enrolled')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {canManage && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button onClick={() => toggleRequired(a)} disabled={busy === a.path_id}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${a.required ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {a.required ? t('empresa.paths.make_optional') : t('empresa.paths.make_required')}
                      </button>
                      <button onClick={() => unassign(a)} disabled={busy === a.path_id}
                        className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50">
                        {busy === a.path_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} {t('empresa.paths.remove')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CATALOG (manage only) */}
      {canManage && available.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2"><Plus className="h-5 w-5 text-fuchsia-500" /> {t('empresa.paths.manage_h')}</h2>
          <p className="text-sm text-slate-500 mb-4">{t('empresa.paths.manage_sub')}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map((c) => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{c.emoji || '🎓'}</span>
                  {c.difficulty && <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${DIFF_CLASS[c.difficulty] || 'bg-slate-100 text-slate-600'}`}>{c.difficulty}</span>}
                </div>
                <Link href={`/aprender/percursos/${c.slug}` as any} className="group">
                  <h3 className="font-semibold text-slate-900 group-hover:text-violet-700 transition-colors leading-tight inline-flex items-center gap-1">{c.title} <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" /></h3>
                </Link>
                {(c.tagline || c.subtitle) && <p className="text-xs text-slate-500 mt-1 line-clamp-2 flex-1">{c.tagline || c.subtitle}</p>}
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={() => assign(c, false)} disabled={busy === c.id}
                    className="flex-1 inline-flex items-center justify-center gap-1 text-sm font-semibold px-3 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-50">
                    {busy === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('empresa.paths.assign')}
                  </button>
                  <button onClick={() => assign(c, true)} disabled={busy === c.id}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50">
                    <Star className="h-3.5 w-3.5" /> {t('empresa.paths.required')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
