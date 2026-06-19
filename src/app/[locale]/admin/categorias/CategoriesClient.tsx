'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Loader2, Star, Eye, EyeOff } from 'lucide-react';

type Cat = {
  slug: string;
  parent: string | null;
  icon: string | null;
  sort: number;
  active: boolean;
  featured_b2c: boolean;
  track: string | null;
  name: string;
  course_count: number;
};

export function CategoriesClient({ initial, lang }: { initial: Cat[]; lang: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<Cat[]>(initial);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function setField(slug: string, field: keyof Cat, value: unknown) {
    setRows((rs) => rs.map((r) => (r.slug === slug ? { ...r, [field]: value } : r)));
    setDirty((d) => { const n = new Set(d); n.add(slug); return n; });
  }

  async function save() {
    if (dirty.size === 0) return;
    setSaving(true);
    const sb = createClient();
    let ok = 0; let fail = 0;
    for (const slug of Array.from(dirty)) {
      const r = rows.find((x) => x.slug === slug);
      if (!r) continue;
      const { data, error } = await sb.rpc('nl_admin_category_update', {
        p_slug: r.slug,
        p_active: r.active,
        p_featured_b2c: r.featured_b2c,
        p_sort: r.sort,
        p_icon: r.icon || '',
      });
      if (error || (data && (data as { ok?: boolean }).ok === false)) fail++; else ok++;
    }
    setSaving(false);
    if (fail === 0) {
      toast.success(`Guardado (${ok})`);
      setDirty(new Set());
      router.refresh();
    } else {
      toast.error(`${fail} falha(s), ${ok} guardada(s)`);
    }
  }

  const tops = rows.filter((r) => !r.parent).sort((a, b) => a.sort - b.sort);
  const subsOf = (slug: string) => rows.filter((r) => r.parent === slug).sort((a, b) => a.sort - b.sort);

  const renderRow = (c: Cat, isSub = false) => (
    <div key={c.slug} className={`flex flex-wrap items-center gap-3 py-3 ${isSub ? 'pl-5 sm:pl-8' : ''}`}>
      <div className="flex-1 min-w-[140px]">
        <div className="font-medium text-slate-900">{isSub ? '↳ ' : ''}{c.name}</div>
        <div className="text-xs text-slate-500 font-mono">{c.slug} · {c.course_count} curso(s){c.track ? ` · ${c.track}` : ''}</div>
      </div>
      <input
        type="number"
        value={c.sort}
        onChange={(e) => setField(c.slug, 'sort', parseInt(e.target.value, 10) || 0)}
        className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-brand-500"
        title="Ordem"
      />
      <input
        type="text"
        value={c.icon || ''}
        onChange={(e) => setField(c.slug, 'icon', e.target.value)}
        placeholder="ícone"
        className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-brand-500"
        title="Nome do ícone (lucide)"
      />
      <button
        type="button"
        onClick={() => setField(c.slug, 'active', !c.active)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border ${c.active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
      >
        {c.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        {c.active ? 'Ativa' : 'Oculta'}
      </button>
      <button
        type="button"
        onClick={() => setField(c.slug, 'featured_b2c', !c.featured_b2c)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border ${c.featured_b2c ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
        title="Mostrar em destaque no catálogo público"
      >
        <Star className={`h-3.5 w-3.5 ${c.featured_b2c ? 'fill-current' : ''}`} />
        Destaque
      </button>
    </div>
  );

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 px-4 sm:px-6">
        {tops.map((top) => (
          <div key={top.slug} className="py-1">
            {renderRow(top)}
            {subsOf(top.slug).map((s) => renderRow(s, true))}
          </div>
        ))}
        {rows.length === 0 && <div className="py-8 text-center text-sm text-slate-500">Sem categorias.</div>}
      </div>

      <div className="sticky bottom-4 mt-4 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving || dirty.size === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {dirty.size > 0 ? `Guardar (${dirty.size})` : 'Guardado'}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">Os nomes editam-se em Conteúdo &rsaquo; Traduções (chave category.slug). Ativar/ocultar e destaque controlam o que aparece no catálogo público.</p>
    </div>
  );
}
