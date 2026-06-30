'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Code2, FileText, ListChecks, Users, Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react';
import { generateCodeExerciseAction, generateOpenExerciseAction } from './actions';
import { runWithTests } from '@/lib/codeRunner';

type Check = { type: string; value?: string; weight?: number; message?: string };
type Exercise = { id: string; course_id: string; kind: string; title_md: string; prompt_md: string; starter_code: string | null; auto_checks: Check[]; max_score: number; status: string; submissions: number; language?: string | null; tests?: string | null; solution_md?: string | null; source?: string | null };

const KIND_ICON: Record<string, any> = { code: Code2, freeform: FileText, checklist: ListChecks };

export function PracticeAdmin() {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ course_id: '', kind: 'code', title: '', prompt: '', starter: '', checks: '', max_score: '100', language: 'python', tests: '' });
  const [gen, setGen] = useState({ course_id: '', topic: '', language: 'python', difficulty: 'intermédio', kind: 'code' });
  const [generating, setGenerating] = useState(false);
  const [showGen, setShowGen] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  async function generate() {
    if (!gen.course_id.trim() || !gen.topic.trim()) { toast.error(t('practiceadmin.required')); return; }
    setGenerating(true);
    try {
      const r = gen.kind === 'open'
        ? await generateOpenExerciseAction({ course_id: gen.course_id, topic: gen.topic, difficulty: gen.difficulty })
        : await generateCodeExerciseAction({ course_id: gen.course_id, topic: gen.topic, language: gen.language, difficulty: gen.difficulty });
      if (!r.ok) { toast.error(r.error || t('practiceadmin.error')); return; }
      toast.success('Rascunho gerado — revê e aprova.');
      setGen({ course_id: '', topic: '', language: 'python', difficulty: 'intermédio', kind: gen.kind });
      setShowGen(false);
      await load();
    } catch { toast.error(t('practiceadmin.error')); }
    finally { setGenerating(false); }
  }

  async function verifyAndPublish(e: Exercise) {
    setVerifying(e.id);
    try {
      const r = await runWithTests((e.language || 'python'), e.solution_md || '', e.tests || null);
      if (!r.passed) { toast.error('A solução não passou os testes — não publicado. ' + (r.error || '')); return; }
      const { data, error } = await supabase.rpc('nl_admin_practice_approve', { p_id: e.id, p_verified: true });
      if (error || !(data as { ok?: boolean })?.ok) throw error || new Error('fail');
      toast.success('Verificado e publicado.');
      await load();
    } catch { toast.error('Falha ao publicar.'); }
    finally { setVerifying(null); }
  }

  async function approveOpen(e: Exercise) {
    setVerifying(e.id);
    try {
      const { data, error } = await supabase.rpc('nl_admin_practice_approve', { p_id: e.id, p_verified: true });
      if (error || !(data as { ok?: boolean })?.ok) throw error || new Error('fail');
      toast.success('Aprovado e publicado.');
      await load();
    } catch { toast.error('Falha ao aprovar.'); }
    finally { setVerifying(null); }
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase.rpc('nl_admin_practice_list');
      const d = data as { ok?: boolean; exercises?: Exercise[] };
      if (d?.ok && Array.isArray(d.exercises)) setRows(d.exercises);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!draft.course_id.trim() || !draft.title.trim() || !draft.prompt.trim()) { toast.error(t('practiceadmin.required')); return; }
    setSaving(true);
    try {
      let checks: Check[] = [];
      if (draft.checks.trim()) {
        try { checks = JSON.parse(draft.checks); } catch { toast.error(t('practiceadmin.bad_json')); setSaving(false); return; }
      }
      const { data, error } = await supabase.rpc('nl_admin_practice_upsert', {
        p_id: null, p_course_id: draft.course_id, p_kind: draft.kind, p_title: draft.title, p_prompt: draft.prompt,
        p_starter: draft.starter || null, p_auto_checks: checks, p_max_score: Number(draft.max_score) || 100, p_status: 'approved',
        p_language: draft.kind === 'code' ? draft.language : 'python', p_tests: draft.kind === 'code' ? (draft.tests || null) : null,
      });
      if (error || !(data as { ok?: boolean })?.ok) throw error || new Error('fail');
      toast.success(t('practiceadmin.created'));
      setCreating(false);
      setDraft({ course_id: '', kind: 'code', title: '', prompt: '', starter: '', checks: '', max_score: '100', language: 'python', tests: '' });
      await load();
    } catch { toast.error(t('practiceadmin.error')); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Gerar exercício (Premium)</h3>
          </div>
          <button onClick={() => setShowGen((v) => !v)} className="text-xs font-medium text-amber-700 hover:underline">{showGen ? 'Fechar' : 'Abrir'}</button>
        </div>
        {showGen && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select value={gen.kind} onChange={(ev) => setGen((g) => ({ ...g, kind: ev.target.value }))}
                className="rounded-lg border border-amber-200 px-3 py-2 text-sm">
                <option value="code">Código</option><option value="open">Resposta aberta</option>
              </select>
              {gen.kind === 'code' ? (
                <select value={gen.language} onChange={(ev) => setGen((g) => ({ ...g, language: ev.target.value }))}
                  className="rounded-lg border border-amber-200 px-3 py-2 text-sm">
                  <option value="python">Python</option><option value="javascript">JavaScript</option>
                </select>
              ) : <div />}
            </div>
            <input value={gen.course_id} onChange={(ev) => setGen((g) => ({ ...g, course_id: ev.target.value }))} placeholder={t('practiceadmin.course_id')}
              className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" />
            <input value={gen.topic} onChange={(ev) => setGen((g) => ({ ...g, topic: ev.target.value }))} placeholder="Tópico da aula"
              className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" />
            <select value={gen.difficulty} onChange={(ev) => setGen((g) => ({ ...g, difficulty: ev.target.value }))}
              className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm">
              <option value="iniciante">Iniciante</option><option value="intermédio">Intermédio</option><option value="avançado">Avançado</option>
            </select>
            <button onClick={generate} disabled={generating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-amber-700">
              {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> A gerar…</> : <><Sparkles className="h-4 w-4" /> Gerar rascunho</>}
            </button>
            <p className="text-[11px] text-amber-700/80">Gera em rascunho. Código: publica após a solução passar os testes. Resposta aberta: revê e aprova.</p>
          </div>
        )}
      </div>

      {!creating ? (
        <button onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700">
          <Plus className="h-4 w-4" /> {t('practiceadmin.new')}
        </button>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input value={draft.course_id} onChange={(e) => setDraft((d) => ({ ...d, course_id: e.target.value }))} placeholder={t('practiceadmin.course_id')}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <select value={draft.kind} onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="code">code</option><option value="freeform">freeform</option><option value="checklist">checklist</option>
            </select>
            <input value={draft.max_score} onChange={(e) => setDraft((d) => ({ ...d, max_score: e.target.value }))} placeholder="max" type="number"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder={t('practiceadmin.title_ph')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <textarea value={draft.prompt} onChange={(e) => setDraft((d) => ({ ...d, prompt: e.target.value }))} placeholder={t('practiceadmin.prompt_ph')} rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none" />
          <textarea value={draft.starter} onChange={(e) => setDraft((d) => ({ ...d, starter: e.target.value }))} placeholder={t('practiceadmin.starter_ph')} rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono resize-none" />
          {draft.kind === 'code' && (
            <>
              <div>
                <label className="text-xs text-slate-500">Linguagem da sandbox</label>
                <select value={draft.language} onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1">
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Testes (corre após o código do aluno; falha = exceção/assert)</label>
                <textarea value={draft.tests} onChange={(e) => setDraft((d) => ({ ...d, tests: e.target.value }))}
                  placeholder={draft.language === 'python' ? 'assert soma(2,3) == 5' : 'if (soma(2,3) !== 5) throw new Error("falhou");'} rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono resize-none mt-1" />
              </div>
            </>
          )}
          <div>
            <label className="text-xs text-slate-500">{t('practiceadmin.checks_ph')}</label>
            <textarea value={draft.checks} onChange={(e) => setDraft((d) => ({ ...d, checks: e.target.value }))}
              placeholder='[{"type":"contains","value":"def","weight":1,"message":"..."}]' rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono resize-none mt-1" />
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t('practiceadmin.create')}
            </button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">{t('practiceadmin.cancel')}</button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">{t('practiceadmin.empty')}</div>
      ) : rows.map((e) => {
        const Icon = KIND_ICON[e.kind] || Code2;
        return (
          <div key={e.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-900">{e.title_md}</h3>
                <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{e.kind}</span>
                <span className="text-xs font-mono text-slate-400">{e.course_id}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{e.prompt_md}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {e.submissions}</span>
                <span>{(e.auto_checks?.length || 0)} checks</span>
                <span>{e.max_score} pts</span>
                {e.language && <span className="font-mono">{e.language}</span>}
                {e.source === 'ai' && <span className="text-amber-600 font-medium">IA</span>}
                <span className={e.status === 'approved' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>{e.status}</span>
              </div>
              {e.status === 'draft' && e.kind === 'code' && (e.tests || e.solution_md) && (
                <button onClick={() => verifyAndPublish(e)} disabled={verifying === e.id}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium disabled:opacity-50 hover:bg-emerald-700">
                  {verifying === e.id ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> A verificar…</> : <><ShieldCheck className="h-3.5 w-3.5" /> Verificar e publicar</>}
                </button>
              )}
              {e.status === 'draft' && e.kind === 'code' && !e.tests && !e.solution_md && (
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-amber-600"><AlertTriangle className="h-3 w-3" /> Sem testes/solução para verificar</p>
              )}
              {e.status === 'draft' && e.kind !== 'code' && (
                <button onClick={() => approveOpen(e)} disabled={verifying === e.id}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium disabled:opacity-50 hover:bg-emerald-700">
                  {verifying === e.id ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> A aprovar…</> : <><ShieldCheck className="h-3.5 w-3.5" /> Aprovar</>}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
