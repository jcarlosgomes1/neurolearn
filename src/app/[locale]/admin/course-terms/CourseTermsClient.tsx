'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Save, X, ChevronDown, Eye } from 'lucide-react';

interface Course { id: string; title: string; emoji?: string | null; instructor?: string | null; approval_status?: string | null }
interface ClauseToggle { code: string; title: string; scope: string; is_base: boolean; default_on: boolean; enabled: boolean }
interface Custom { id: string; title: string | null; body_md: string; sort_order: number }

export function CourseTermsClient() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [clauses, setClauses] = useState<ClauseToggle[]>([]);
  const [custom, setCustom] = useState<Custom[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [draft, setDraft] = useState<{ id: string | null; title: string; body_md: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_courses_min');
      if (error) throw error;
      const list = ((data as { items?: Course[] })?.items) || [];
      setCourses(list);
      if (list.length > 0) setSelectedId((p) => p || list[0].id);
    } catch { setCourses([]); }
    finally { setLoading(false); }
  }, []);

  const loadTerms = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setLoadingTerms(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_course_terms_get', { p_course_id: courseId });
      if (error) throw error;
      const res = data as { ok: boolean; clauses?: ClauseToggle[]; custom?: Custom[] };
      setClauses(res?.clauses || []);
      setCustom(res?.custom || []);
    } catch { setClauses([]); setCustom([]); }
    finally { setLoadingTerms(false); }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => { if (selectedId) { setPreview(null); loadTerms(selectedId); } }, [selectedId, loadTerms]);

  async function toggle(code: string, enabled: boolean) {
    setClauses((prev) => prev.map((c) => c.code === code ? { ...c, enabled } : c));
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_course_terms_toggle', { p_course_id: selectedId, p_clause_code: code, p_enabled: enabled });
      if (error) throw error;
    } catch { toast.error('Não foi possível atualizar.'); loadTerms(selectedId); }
  }

  async function saveCustom() {
    if (!draft || !draft.body_md.trim()) return;
    setSaving(true);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_course_terms_custom_save', { p_course_id: selectedId, p_id: draft.id, p_title: draft.title.trim() || null, p_body_md: draft.body_md.trim() });
      if (error) throw error;
      toast.success('Cláusula guardada');
      setDraft(null);
      await loadTerms(selectedId);
    } catch { toast.error('Não foi possível guardar.'); }
    finally { setSaving(false); }
  }

  async function removeCustom(id: string) {
    if (!confirm('Eliminar esta cláusula específica?')) return;
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_course_terms_custom_delete', { p_id: id });
      if (error) throw error;
      toast.success('Eliminada');
      await loadTerms(selectedId);
    } catch { toast.error('Não foi possível eliminar.'); }
  }

  async function showPreview() {
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_instructor_terms_compose', { p_scope: 'course', p_course_id: selectedId, p_lang: 'pt' });
      if (error) throw error;
      setPreview(((data as { body_md?: string })?.body_md) || '(vazio)');
    } catch { toast.error('Não foi possível compor.'); }
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (courses.length === 0) return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-500 text-sm">Sem cursos.</div>;

  return (
    <div>
      <div className="mb-6 max-w-md">
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Curso</label>
        <div className="relative">
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-200">
            {courses.map((c) => <option key={c.id} value={c.id}>{(c.emoji ? c.emoji + ' ' : '') + c.title}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {loadingTerms ? (
        <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-slate-800 mb-2">Cláusulas aplicáveis</h2>
            <p className="text-xs text-slate-400 mb-3">As cláusulas base aplicam-se sempre e não aparecem aqui.</p>
            {clauses.length === 0 ? (
              <p className="text-sm text-slate-400">Não há cláusulas opcionais. Cria-as na biblioteca.</p>
            ) : (
              <ul className="space-y-2">
                {clauses.map((c) => (
                  <li key={c.code} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-slate-800">{c.title}</span>
                      <span className="ml-2 text-[10px] font-mono uppercase rounded bg-slate-100 text-slate-500 px-1.5 py-0.5">{c.code}</span>
                      {c.default_on ? <span className="ml-1 text-[10px] rounded bg-emerald-50 text-emerald-600 px-1.5 py-0.5">sugerida</span> : null}
                    </div>
                    <button onClick={() => toggle(c.code, !c.enabled)} role="switch" aria-checked={c.enabled}
                      className={c.enabled ? 'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors bg-violet-600' : 'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors bg-slate-200'}>
                      <span className={c.enabled ? 'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform translate-x-5' : 'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform translate-x-0.5'} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-800">Cláusulas específicas deste curso</h2>
              <button onClick={() => setDraft({ id: null, title: '', body_md: '' })} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 px-2.5 py-1.5 hover:bg-slate-50"><Plus className="w-3.5 h-3.5 text-violet-500" />Adicionar</button>
            </div>
            {draft && (
              <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50/40 p-3 space-y-2">
                <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Título (opcional)"
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-200" />
                <textarea value={draft.body_md} onChange={(e) => setDraft({ ...draft, body_md: e.target.value })} rows={4} placeholder="Texto da cláusula (markdown)…"
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-200 resize-y" />
                <div className="flex items-center gap-2">
                  <button onClick={saveCustom} disabled={saving || !draft.body_md.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium px-3.5 py-1.5 disabled:opacity-50 hover:bg-slate-800">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Guardar</button>
                  <button onClick={() => setDraft(null)} className="inline-flex items-center gap-1 text-sm text-slate-500 px-2 py-1.5 hover:text-slate-700"><X className="w-4 h-4" />Cancelar</button>
                </div>
              </div>
            )}
            {custom.length === 0 && !draft ? (
              <p className="text-sm text-slate-400">Nenhuma cláusula específica.</p>
            ) : (
              <ul className="space-y-2">
                {custom.map((c) => (
                  <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {c.title ? <p className="text-sm font-semibold text-slate-900">{c.title}</p> : null}
                        <p className="text-xs text-slate-500 whitespace-pre-wrap line-clamp-3">{c.body_md}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1">
                        <button onClick={() => setDraft({ id: c.id, title: c.title || '', body_md: c.body_md })} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => removeCustom(c.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <button onClick={showPreview} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 px-3 py-1.5 hover:bg-slate-50"><Eye className="w-4 h-4 text-violet-500" />Ver texto composto</button>
            {preview !== null && (
              <pre className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 whitespace-pre-wrap font-sans max-h-96 overflow-auto">{preview}</pre>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
