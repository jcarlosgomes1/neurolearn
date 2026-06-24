'use client';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useEffect, useState, useTransition } from 'react';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, Save, GripVertical, Plus, X, Check } from 'lucide-react';
import { toast } from 'sonner';

export function LearningPathEditorClient({ pathId }: { pathId: string }) {
  const [path, setPath] = useState<any>(null);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [_, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    try {
      const sb = createClient();
      // Get path detail
      const { data: paths } = await sb.rpc('nl_admin_learning_paths_list');
      const p = (paths as any[])?.find((x: any) => x.id === pathId);
      setPath(p);

      // Get current courses in path
      const { data: courses } = await sb.from('nl_courses').select('id, title, emoji, level, duration, published').eq('published', true).order('title');
      setAllCourses(courses || []);

      const { data: pc } = await sb.from('nl_learning_path_courses').select('course_id, sort_order').eq('path_id', pathId).order('sort_order');
      setSelected((pc || []).map((x: any) => x.course_id));
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [pathId]);

  function toggle(id: string) {
    setSelected((arr) => arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  }

  function move(idx: number, dir: -1 | 1) {
    setSelected((arr) => {
      const next = [...arr];
      const t = idx + dir;
      if (t < 0 || t >= next.length) return arr;
      [next[idx], next[t]] = [next[t], next[idx]];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_learning_path_set_courses', {
        p_path_id: pathId,
        p_course_ids: selected,
      });
      if (error) throw error;
      toast.success('Cursos guardados');
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setSaving(false); }
  }

  if (loading) return <div className="text-slate-400 text-sm">A carregar...</div>;
  if (!path) return <div className="text-rose-600">Percurso não encontrado.</div>;

  const orderedCourses = selected.map((id) => allCourses.find((c) => c.id === id)).filter(Boolean);
  const availableCourses = allCourses.filter((c) => !selected.includes(c.id));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <AdminPageHeader backHref="/admin/learning-paths" backLabel="Percursos" title={path.title} description={path.subtitle || undefined} />
        </div>
        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? <><Check className="h-4 w-4" /> A guardar...</> : <><Save className="h-4 w-4" /> Guardar ordem</>}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/admin/learning-paths/${pathId}/gaps` as any} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-violet-100 hover:text-violet-700 hover:ring-violet-200 transition-colors"><span className="text-sm leading-none">📊</span> Gaps</Link>
        <Link href={'/admin/cursos' as any} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-violet-100 hover:text-violet-700 hover:ring-violet-200 transition-colors"><span className="text-sm leading-none">📚</span> Cursos</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cursos no percurso */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">No percurso ({orderedCourses.length})</h2>
          {orderedCourses.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
              Adiciona cursos da coluna ao lado →
            </div>
          ) : (
            <div className="space-y-1.5">
              {orderedCourses.map((c, idx) => (
                <div key={c.id} className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center gap-2 group hover:border-brand-300 transition-colors">
                  <div className="flex flex-col">
                    <button onClick={() => move(idx, -1)} disabled={idx === 0}
                      className="p-0.5 text-slate-300 hover:text-slate-700 disabled:opacity-30" aria-label="Subir">▲</button>
                    <button onClick={() => move(idx, 1)} disabled={idx === orderedCourses.length - 1}
                      className="p-0.5 text-slate-300 hover:text-slate-700 disabled:opacity-30" aria-label="Descer">▼</button>
                  </div>
                  <span className="w-6 text-xs font-bold text-slate-400">{idx + 1}.</span>
                  <span className="text-xl">{c.emoji || '📘'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{c.title}</div>
                    <div className="text-[10px] text-slate-500">{c.level} · {c.duration}</div>
                  </div>
                  <button onClick={() => toggle(c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-50 rounded transition-opacity" aria-label="Remover">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cursos disponíveis */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Disponíveis ({availableCourses.length})</h2>
          <div className="max-h-[600px] overflow-y-auto space-y-1.5 pr-1">
            {availableCourses.map((c) => (
              <button key={c.id} onClick={() => toggle(c.id)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 flex items-center gap-2 hover:border-brand-300 hover:bg-brand-50/30 transition-colors text-left">
                <span className="text-xl">{c.emoji || '📘'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{c.title}</div>
                  <div className="text-[10px] text-slate-500">{c.level} · {c.duration}</div>
                </div>
                <Plus className="h-3.5 w-3.5 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
