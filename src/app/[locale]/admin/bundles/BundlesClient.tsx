'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, Plus, Edit, X, Loader2, Trash2, ToggleLeft, ToggleRight, Star } from 'lucide-react';
import { AgentSuggestionsRail } from '@/components/primitives/AgentSuggestionsRail';

function fmt(c: number, cur = 'EUR') { return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: cur }).format(c/100); }

export function BundlesClient({ initial, courses }: { initial: any[]; courses: any[] }) {
  const [bundles, setBundles] = useState(initial);
  const [editing, setEditing] = useState<any | null>(null);
  const [pending, startTransition] = useTransition();

  async function reload() {
    const sb = createClient();
    const { data } = await sb.rpc('nl_admin_bundles_list');
    setBundles((data as any)?.bundles || []);
  }

  function togglePublished(b: any) {
    startTransition(async () => {
      const sb = createClient();
      await sb.rpc('nl_admin_bundle_upsert', { p_id: b.id, p_data: { course_ids: b.course_ids, price_cents: b.price_cents, published: !b.published } });
      reload();
    });
  }

  function remove(id: string) {
    if (!confirm('Eliminar bundle?')) return;
    startTransition(async () => {
      const sb = createClient();
      await sb.from('nl_course_bundles').delete().eq('id', id);
      reload();
    });
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="📦"
        title="Bundles"
        description="Empacotamento de cursos com desconto. Aumenta basket size 30-50%."
        actions={
          <button onClick={() => setEditing({})}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
            <Plus className="h-4 w-4" /> Novo bundle
          </button>
        }
      />

      <AgentSuggestionsRail surface="bundles" onAfterDecide={reload} />

      {bundles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">Sem bundles</h3>
          <button onClick={() => setEditing({})} className="text-sm text-brand-600 hover:underline">Criar o primeiro →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {bundles.map((b) => (
            <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">{b.title}</h3>
                  {b.featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                  {b.discount_pct > 0 && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-semibold rounded">−{Math.round(b.discount_pct)}%</span>}
                  <code className="text-[10px] text-slate-400 font-mono">{b.slug}</code>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{b.description}</p>
                <div className="text-[10px] text-slate-400 mt-1">{b.course_ids?.length || 0} cursos · {b.enrollments_count || 0} inscritos</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900">{fmt(b.price_cents, b.currency)}</div>
                {b.original_total_cents > 0 && <div className="text-[10px] text-slate-500 line-through">{fmt(b.original_total_cents, b.currency)}</div>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => togglePublished(b)} className="p-2 text-slate-400 hover:text-emerald-600">
                  {b.published ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button onClick={() => setEditing(b)} className="p-2 text-slate-400 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(b.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <BundleModal bundle={editing} courses={courses} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

function BundleModal({ bundle, courses, onClose, onSaved }: any) {
  const isNew = !bundle.id;
  const [form, setForm] = useState({
    slug: bundle.slug || '',
    title: bundle.title || '',
    description: bundle.description || '',
    cover_url: bundle.cover_url || '',
    course_ids: bundle.course_ids || [],
    price_cents: bundle.price_cents || 0,
    currency: bundle.currency || 'EUR',
    published: bundle.published ?? false,
    featured: bundle.featured ?? false,
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedCourses = courses.filter((c: any) => form.course_ids.includes(c.id));
  const totalOriginal = selectedCourses.reduce((sum: number, c: any) => sum + c.price_cents, 0);
  const discount = totalOriginal > 0 ? Math.round((totalOriginal - form.price_cents) / totalOriginal * 100) : 0;

  function toggleCourse(id: string) {
    setForm({ ...form, course_ids: form.course_ids.includes(id) ? form.course_ids.filter((i: string) => i !== id) : [...form.course_ids, id] });
  }

  function submit() {
    setError(null);
    if (isNew && !form.slug.trim()) return setError('Slug obrigatório');
    if (form.course_ids.length < 2) return setError('Mínimo 2 cursos no bundle');
    if (!form.price_cents) return setError('Preço obrigatório');
    startTransition(async () => {
      const sb = createClient();
      const { error: err } = await sb.rpc('nl_admin_bundle_upsert', { p_id: bundle.id || null, p_data: form });
      if (err) setError(err.message);
      else onSaved();
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-slate-900">{isNew ? 'Novo bundle' : 'Editar bundle'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})} disabled={!isNew}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm disabled:bg-slate-100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Título</label>
              <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Cursos no bundle (min 2)</label>
            <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
              {courses.map((c: any) => (
                <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50">
                  <input type="checkbox" checked={form.course_ids.includes(c.id)} onChange={() => toggleCourse(c.id)} className="rounded" />
                  <span className="text-lg">{c.emoji || '📘'}</span>
                  <span className="flex-1 text-sm">{c.title}</span>
                  <span className="text-xs font-mono text-slate-500">{fmt(c.price_cents)}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Preço bundle (cents)</label>
              <input type="number" value={form.price_cents} onChange={(e) => setForm({...form, price_cents: parseInt(e.target.value) || 0})}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
            </div>
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded">
              <div className="text-[10px] text-emerald-700 uppercase">Total individual</div>
              <div className="text-sm font-bold">{fmt(totalOriginal)}</div>
              {discount > 0 && <div className="text-xs text-emerald-700 font-semibold">−{discount}% poupança</div>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({...form, published: e.target.checked})} /> Publicado
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({...form, featured: e.target.checked})} /> Featured
            </label>
          </div>
          {error && <div className="p-2 bg-rose-50 border border-rose-200 rounded text-sm text-rose-700">{error}</div>}
        </div>
        <div className="border-t border-slate-100 p-4 flex justify-end gap-2 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
          <button onClick={submit} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
