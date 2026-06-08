'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Plus, Save, Trash2, Github, FileCode, ExternalLink, Download, Box, Loader2, Edit3, X } from 'lucide-react';

interface Resource {
  id: string; course_id: string; module_index: number; lesson_index: number;
  resource_type: string; url: string; label: string; description: string | null;
  sort_order: number; required: boolean;
}

const TYPES = [
  { value: 'github_repo', label: 'Repositório GitHub', icon: Github },
  { value: 'notebook_python', label: 'Notebook Python (Colab)', icon: FileCode },
  { value: 'notebook_jupyter', label: 'Notebook Jupyter', icon: FileCode },
  { value: 'external_link', label: 'Link externo', icon: ExternalLink },
  { value: 'file_download', label: 'Download ficheiro', icon: Download },
  { value: 'sandbox_code', label: 'Sandbox código (CodeSandbox/StackBlitz)', icon: Box },
];

interface Module { title?: string; lessons?: Array<{ title?: string }> }

export function RecursosClient({ courseId, modules, initial }: { courseId: string; modules: Module[]; initial: Resource[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Resource[]>(initial);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ moduleIdx: number; lessonIdx: number; existing?: Resource } | null>(null);
  const [form, setForm] = useState({
    resource_type: 'github_repo', url: '', label: '', description: '', required: false,
  });

  const grouped = useMemo(() => {
    const acc: Record<string, Resource[]> = {};
    for (const r of items) {
      const k = `${r.module_index}-${r.lesson_index}`;
      if (!acc[k]) acc[k] = [];
      acc[k].push(r);
    }
    return acc;
  }, [items]);

  function startNew(moduleIdx: number, lessonIdx: number) {
    setEditing({ moduleIdx, lessonIdx });
    setForm({ resource_type: 'github_repo', url: '', label: '', description: '', required: false });
  }
  function startEdit(r: Resource) {
    setEditing({ moduleIdx: r.module_index, lessonIdx: r.lesson_index, existing: r });
    setForm({ resource_type: r.resource_type, url: r.url, label: r.label, description: r.description || '', required: r.required });
  }
  function cancel() { setEditing(null); }

  async function save() {
    if (!editing) return;
    if (!form.url.trim() || !form.label.trim()) { toast.error('Label e URL obrigatórios'); return; }
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_lesson_resource_upsert', {
        p_id: editing.existing?.id || null,
        p_course_id: courseId,
        p_module_index: editing.moduleIdx,
        p_lesson_index: editing.lessonIdx,
        p_resource_type: form.resource_type,
        p_url: form.url.trim(),
        p_label: form.label.trim(),
        p_description: form.description.trim() || null,
        p_sort_order: 0,
        p_required: form.required,
      });
      if (error) throw error;
      toast.success(editing.existing ? 'Recurso atualizado' : 'Recurso adicionado');
      setEditing(null);
      await refresh();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
    finally { setBusy(false); }
  }

  async function del(r: Resource) {
    if (!confirm(`Apagar "${r.label}"?`)) return;
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_lesson_resource_delete', { p_id: r.id });
      if (error) throw error;
      toast.success('Apagado');
      await refresh();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
    finally { setBusy(false); }
  }

  async function refresh() {
    const sb = createClient();
    const { data } = await sb.rpc('nl_admin_course_resources_grouped', { p_course_id: courseId });
    setItems(Array.isArray(data) ? data : []);
    router.refresh();
  }

  if (modules.length === 0) {
    return <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">Este curso ainda não tem módulos.</div>;
  }

  return (
    <div className="space-y-5">
      {modules.map((mod, modIdx) => (
        <section key={modIdx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <header className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Módulo {modIdx + 1}</div>
            <h2 className="font-bold text-slate-900 text-sm">{mod.title || `Módulo ${modIdx + 1}`}</h2>
          </header>
          <div className="divide-y divide-slate-100">
            {(mod.lessons || []).map((lesson, lessonIdx) => {
              const key = `${modIdx}-${lessonIdx}`;
              const lessonItems = grouped[key] || [];
              const isEditing = editing?.moduleIdx === modIdx && editing?.lessonIdx === lessonIdx;
              return (
                <div key={lessonIdx} className="p-4 hover:bg-slate-50/40">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Lição {lessonIdx + 1}</div>
                      <h3 className="font-semibold text-sm text-slate-900 truncate">{lesson.title || `Lição ${lessonIdx + 1}`}</h3>
                    </div>
                    {!isEditing && (
                      <button onClick={() => startNew(modIdx, lessonIdx)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg shadow-sm">
                        <Plus className="h-3 w-3" /> Adicionar
                      </button>
                    )}
                  </div>

                  {lessonItems.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {lessonItems.map((r) => {
                        const meta = TYPES.find((t) => t.value === r.resource_type) || TYPES[3];
                        const Icon = meta.icon;
                        return (
                          <div key={r.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 group">
                            <div className="h-8 w-8 rounded bg-white border border-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-slate-900 truncate">{r.label}</span>
                                {r.required && <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase">Obrig.</span>}
                              </div>
                              <a href={r.url} target="_blank" rel="noopener" className="text-[10px] text-violet-600 hover:underline truncate block">{r.url}</a>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                              <button onClick={() => startEdit(r)} className="p-1.5 text-slate-400 hover:text-violet-700 hover:bg-violet-50 rounded"><Edit3 className="h-3.5 w-3.5" /></button>
                              <button onClick={() => del(r)} className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isEditing && (
                    <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 space-y-2 mt-2">
                      <div className="grid sm:grid-cols-2 gap-2">
                        <select value={form.resource_type} onChange={(e) => setForm((p) => ({ ...p, resource_type: e.target.value }))}
                          className="px-3 py-2 border border-slate-200 rounded text-sm bg-white outline-none focus:border-violet-500">
                          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <input value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} placeholder="Label (ex: Repositório base)"
                          className="px-3 py-2 border border-slate-200 rounded text-sm outline-none focus:border-violet-500" />
                      </div>
                      <input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="URL (https://...)"
                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm font-mono outline-none focus:border-violet-500" />
                      <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Descrição (opcional)"
                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none focus:border-violet-500 resize-y" />
                      <div className="flex items-center justify-between">
                        <label className="inline-flex items-center gap-2 text-xs">
                          <input type="checkbox" checked={form.required} onChange={(e) => setForm((p) => ({ ...p, required: e.target.checked }))}
                            className="h-4 w-4 rounded text-rose-600" />
                          Obrigatório
                        </label>
                        <div className="flex items-center gap-2">
                          <button onClick={cancel} className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"><X className="h-3 w-3" /> Cancelar</button>
                          <button onClick={save} disabled={busy} className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded shadow-sm disabled:opacity-50">
                            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Guardar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
