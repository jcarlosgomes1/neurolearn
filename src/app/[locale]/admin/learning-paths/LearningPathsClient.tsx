'use client';

import { useEffect, useState, useTransition } from 'react';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { Plus, Users, BookOpen, Clock, Eye, Trash2, X, Sparkles, Edit, Package } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonCard } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

export function LearningPathsClient() {
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ slug: '', title: '', subtitle: '', emoji: '🎓', difficulty: 'beginner', estimated_hours: 40, category: '' });
  const [slugLocked, setSlugLocked] = useState(false);
  const slugify = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const [_, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_learning_paths_list');
      if (!error && Array.isArray(data)) setPaths(data);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.title.trim() || !form.slug.trim()) { toast.error('Slug e título obrigatórios'); return; }
    setCreating(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_learning_path_upsert', {
        p_slug: form.slug.trim(),
        p_title: form.title.trim(),
        p_subtitle: form.subtitle.trim() || null,
        p_emoji: form.emoji,
        p_difficulty: form.difficulty,
        p_estimated_hours: form.estimated_hours,
        p_category: form.category.trim() || null,
      });
      if (error) throw error;
      toast.success('Percurso criado');
      setShowCreate(false);
      setForm({ slug: '', title: '', subtitle: '', emoji: '🎓', difficulty: 'beginner', estimated_hours: 40, category: '' });
      startTransition(load);
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setCreating(false); }
  }

  async function togglePublish(id: string, currentPublished: boolean) {
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_learning_path_upsert', {
        p_id: id, p_published: !currentPublished,
      });
      if (error) throw error;
      toast.success(currentPublished ? 'Despublicado' : 'Publicado');
      load();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
  }

  async function makeBundle(id: string) {
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_bundle_from_path', { p_path_id: id, p_discount_pct: 15 });
      if (error) throw error;
      const r = data as { ok: boolean; error?: string; price_cents?: number };
      if (!r.ok) { toast.error(r.error === 'path_has_no_courses' ? 'Percurso sem cursos' : (r.error || 'Erro')); return; }
      toast.success(`Bundle criado (\u221215%): \u20AC${(((r.price_cents) || 0) / 100).toFixed(2)}`);
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Apagar percurso "${title}"? Os cursos associados não serão apagados.`)) return;
    try {
      const sb = createClient();
      await sb.rpc('nl_admin_learning_path_delete', { p_id: id });
      toast.success('Apagado');
      load();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium">
          <Plus className="h-4 w-4" /> Novo percurso
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : paths.length === 0 ? (
        <EmptyState icon={<Sparkles className="h-6 w-6" />} title="Sem percursos ainda"
          description="Cria sequências curadas de cursos para guiar a aprendizagem dos teus alunos."
          cta={{ label: 'Criar primeiro percurso', onClick: () => setShowCreate(true) }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paths.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{p.emoji || '🎓'}</span>
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-semibold ${p.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.published ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Link href={`/admin/learning-paths/${p.id}` as any}
                    className="p-1 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded" aria-label="Editar">
                    <Edit className="h-3.5 w-3.5" />
                  </Link>
                  <button onClick={() => remove(p.id, p.title)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded" aria-label="Apagar">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 leading-tight">{p.title}</h3>
              {p.subtitle && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.subtitle}</p>}
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {p.course_count} {p.course_count === 1 ? 'curso' : 'cursos'}</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {p.enrollment_count}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.estimated_hours}h</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/admin/learning-paths/${p.id}` as any}
                  className="flex-1 text-center text-xs px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium">
                  Cursos
                </Link>
                <button onClick={() => togglePublish(p.id, p.published)}
                  className={`flex-1 text-center text-xs px-2 py-1.5 rounded font-medium ${p.published ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                  {p.published ? 'Despublicar' : 'Publicar'}
                </button>
                <button onClick={() => makeBundle(p.id)}
                  className="text-center text-xs px-2 py-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded font-medium inline-flex items-center gap-1" aria-label="Criar bundle">
                  <Package className="h-3 w-3" /> Bundle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal create */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">Novo percurso</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-[60px_1fr] gap-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Emoji</span>
                  <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} maxLength={4}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-center text-lg" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Slug (URL)</span>
                  <input value={form.slug} onChange={(e) => { setSlugLocked(true); setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }); }} placeholder="ai-fundamentals"
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 font-mono text-xs" />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Título</span>
                <input value={form.title} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, title: v, ...(slugLocked ? {} : { slug: slugify(v) }) })); }} placeholder="Fundamentos de IA"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Subtítulo</span>
                <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Tudo o que precisas saber"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Dificuldade</span>
                  <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="mt-1 w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400">
                    {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Horas</span>
                  <input type="number" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Categoria</span>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="ex.: Culinária, Gestão, Tecnologia…"
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
                </label>
              </div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button onClick={create} disabled={creating}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                {creating ? 'A criar...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
