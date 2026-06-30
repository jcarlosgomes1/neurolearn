'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import { Loader2, Save, Sparkles, Trash2, Plus, Briefcase, Users, Award, Target, GraduationCap, ShieldCheck, ExternalLink } from 'lucide-react';

type Setting = { key: string; value: unknown; description: string | null };
type Taxo = { id: string; code: string; label: string };
type CourseSkill = { skill_id: string; code: string; label: string; weight: number; target_level: number };
type CourseRow = { course_id: string; title: string; published: boolean; skills: CourseSkill[] };

const LABELS: Record<string, string> = {
  talent_match_semantic_weight: 'Peso semântico (embeddings)',
  talent_match_required_weight: 'Peso skills obrigatórias',
  talent_match_nice_weight: 'Peso skills desejáveis',
  talent_match_esco_weight: 'Peso taxonomia ESCO',
  talent_match_min_score: 'Score mínimo para mostrar',
  talent_match_years_cap: 'Limite de anos de experiência',
  skill_min_evidence_to_validate: 'Evidências mínimas p/ validar',
  skill_validate_confidence_threshold: 'Confiança mínima p/ validar',
  skill_confidence_per_evidence: 'Confiança por evidência',
  skill_recency_halflife_days: 'Meia-vida de recência (dias)',
  skill_default_course_grade: 'Nota padrão de curso',
  skill_practice_evidence_factor: 'Fator de evidência: prática',
  skill_quiz_evidence_factor: 'Fator de evidência: quiz',
};

function numVal(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function TalentHubClient() {
  const sb = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Record<string, number>>({});
  const [matching, setMatching] = useState<Setting[]>([]);
  const [engine, setEngine] = useState<Setting[]>([]);
  const [taxonomy, setTaxonomy] = useState<Taxo[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [retagging, setRetagging] = useState<string | null>(null);
  const [addPick, setAddPick] = useState<Record<string, string>>({});

  async function loadConfig() {
    const { data } = await sb.rpc('nl_admin_talent_config');
    if (data) {
      setOverview((data.overview || {}) as Record<string, number>);
      setMatching((data.matching || []) as Setting[]);
      setEngine((data.skills_engine || []) as Setting[]);
      setTaxonomy((data.taxonomy || []) as Taxo[]);
    }
  }
  async function loadCourses() {
    const { data } = await sb.rpc('nl_admin_course_skills_overview');
    if (Array.isArray(data)) setCourses(data as CourseRow[]);
  }
  async function loadAll() {
    setLoading(true);
    try { await Promise.all([loadConfig(), loadCourses()]); } catch { /* */ } finally { setLoading(false); }
  }
  useEffect(() => { loadAll(); }, []);

  async function saveSetting(key: string) {
    const value = edited[key];
    if (value === undefined) return;
    setSavingKey(key);
    try {
      const { error } = await sb.rpc('nl_admin_talent_setting_set', { p_key: key, p_value: value });
      if (error) throw error;
      toast.success(`${LABELS[key] || key} guardado`);
      setEdited((e) => { const n = { ...e }; delete n[key]; return n; });
      setMatching((rs) => rs.map((r) => r.key === key ? { ...r, value } : r));
      setEngine((rs) => rs.map((r) => r.key === key ? { ...r, value } : r));
    } catch (e) { toast.error('Erro ao guardar'); }
    finally { setSavingKey(null); }
  }

  async function addSkill(courseId: string) {
    const skillId = addPick[courseId];
    if (!skillId) return;
    const { error } = await sb.rpc('nl_admin_course_skill_upsert', { p_course_id: courseId, p_skill_id: skillId, p_weight: 2, p_target_level: 2 });
    if (error) { toast.error('Erro ao adicionar'); return; }
    toast.success('Skill adicionada');
    setAddPick((p) => ({ ...p, [courseId]: '' }));
    loadCourses();
  }
  async function removeSkill(courseId: string, skillId: string) {
    const { error } = await sb.rpc('nl_admin_course_skill_delete', { p_course_id: courseId, p_skill_id: skillId });
    if (error) { toast.error('Erro ao remover'); return; }
    loadCourses();
  }
  async function retag(courseId: string) {
    setRetagging(courseId);
    try {
      const { error } = await sb.rpc('nl_admin_course_retag_skills', { p_course_id: courseId });
      if (error) throw error;
      toast.success('Re-tag IA disparado — a recarregar…');
      setTimeout(() => { loadCourses(); setRetagging(null); }, 7000);
    } catch { toast.error('Erro no re-tag'); setRetagging(null); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  const ov = [
    { icon: Briefcase, label: 'Vagas abertas', value: `${overview.jobs_open ?? 0}/${overview.jobs_total ?? 0}`, c: 'text-violet-600' },
    { icon: Users, label: 'Talentos disponíveis', value: `${overview.talent_available ?? 0}/${overview.talent_total ?? 0}`, c: 'text-emerald-600' },
    { icon: Award, label: 'Colocações', value: overview.placements ?? 0, c: 'text-amber-600' },
    { icon: GraduationCap, label: 'Cursos com skills', value: `${overview.courses_with_skills ?? 0}/${overview.courses_total ?? 0}`, c: 'text-blue-600' },
    { icon: ShieldCheck, label: 'Matches por aprovar', value: overview.pending_match_approvals ?? 0, c: 'text-fuchsia-600' },
  ];

  function SettingRow(s: Setting) {
    const dirty = edited[s.key] !== undefined;
    return (
      <div key={s.key} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-800">{LABELS[s.key] || s.key}</div>
          <div className="font-mono text-[11px] text-slate-400">{s.key}</div>
        </div>
        <input
          value={edited[s.key] !== undefined ? edited[s.key] : numVal(s.value)}
          onChange={(e) => setEdited((ed) => ({ ...ed, [s.key]: e.target.value }))}
          className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-right text-sm font-mono focus:border-violet-400 focus:outline-none" />
        <button onClick={() => saveSetting(s.key)} disabled={!dirty || savingKey === s.key}
          className="rounded-lg bg-violet-600 px-2.5 py-1.5 text-white disabled:opacity-40 hover:bg-violet-700">
          {savingKey === s.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ov.map((o, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <o.icon className={`h-5 w-5 ${o.c}`} />
            <div className="mt-2 text-2xl font-bold text-slate-900">{o.value}</div>
            <div className="text-xs text-slate-500">{o.label}</div>
          </div>
        ))}
      </div>

      {/* Matching + Skills engine */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-violet-600" /><h2 className="t-h3 text-slate-900">Pesos do matching</h2></div>
          <p className="mb-3 text-xs text-slate-500">Como cada fator pesa no score candidato↔vaga. Tudo config, sem hardcode.</p>
          <div className="space-y-2">{matching.map(SettingRow)}</div>
        </section>
        <section>
          <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-600" /><h2 className="t-h3 text-slate-900">Motor de skills</h2></div>
          <p className="mb-3 text-xs text-slate-500">Quando uma skill valida e quanto pesa cada fonte de evidência (curso, prática, quiz).</p>
          <div className="space-y-2">{engine.map(SettingRow)}</div>
        </section>
      </div>

      {/* Course ↔ skill mapping */}
      <section>
        <div className="mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-blue-600" /><h2 className="t-h3 text-slate-900">Mapeamento competência ↔ curso</h2></div>
        <p className="mb-4 text-xs text-slate-500">Revê e ajusta as skills de cada curso (alimentam o matching). Usa “Re-tag IA” para deixar o agente propor a partir do conteúdo.</p>
        <div className="space-y-3">
          {courses.map((co) => (
            <div key={co.course_id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">{co.title}</div>
                  <div className="font-mono text-[11px] text-slate-400">{co.course_id}{!co.published && ' · rascunho'}</div>
                </div>
                <button onClick={() => retag(co.course_id)} disabled={retagging === co.course_id}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50">
                  {retagging === co.course_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Re-tag IA
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {co.skills.length === 0 && <span className="text-xs text-slate-400">Sem skills</span>}
                {co.skills.map((s) => (
                  <span key={s.skill_id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
                    <span className="font-medium text-slate-700">{s.label}</span>
                    <span className="text-slate-400">w{s.weight}/L{s.target_level}</span>
                    <button onClick={() => removeSkill(co.course_id, s.skill_id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="h-3 w-3" /></button>
                  </span>
                ))}
                <span className="inline-flex items-center gap-1">
                  <select value={addPick[co.course_id] || ''} onChange={(e) => setAddPick((p) => ({ ...p, [co.course_id]: e.target.value }))}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-violet-400 focus:outline-none">
                    <option value="">+ skill…</option>
                    {taxonomy.filter((t) => !co.skills.some((s) => s.skill_id === t.id)).map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                  <button onClick={() => addSkill(co.course_id)} disabled={!addPick[co.course_id]}
                    className="rounded-lg bg-slate-800 p-1.5 text-white disabled:opacity-30 hover:bg-slate-900"><Plus className="h-3 w-3" /></button>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shortcuts */}
      <section>
        <h2 className="t-h3 mb-3 text-slate-900">Gerir noutras áreas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/admin/competencias', label: 'Taxonomia de skills', d: 'Criar / editar competências' },
            { href: '/admin/agentes', label: 'Agentes & aprovações', d: 'Aprovar matches propostos' },
            { href: '/admin/jobs', label: 'Vagas', d: 'Gestão de vagas' },
            { href: '/admin/ai-routing', label: 'Routing de IA', d: 'Modelo do tagger de skills' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">{l.label}</span>
                <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-violet-500" />
              </div>
              <div className="mt-1 text-xs text-slate-500">{l.d}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
