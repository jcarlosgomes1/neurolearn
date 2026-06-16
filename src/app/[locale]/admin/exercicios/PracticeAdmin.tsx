'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Code2, FileText, ListChecks, Users } from 'lucide-react';

type Check = { type: string; value?: string; weight?: number; message?: string };
type Exercise = { id: string; course_id: string; kind: string; title_md: string; prompt_md: string; starter_code: string | null; auto_checks: Check[]; max_score: number; status: string; submissions: number };

const KIND_ICON: Record<string, any> = { code: Code2, freeform: FileText, checklist: ListChecks };

export function PracticeAdmin() {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ course_id: '', kind: 'code', title: '', prompt: '', starter: '', checks: '', max_score: '100', language: 'python', tests: '' });

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
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {e.submissions}</span>
                <span>{(e.auto_checks?.length || 0)} checks</span>
                <span>{e.max_score} pts</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
