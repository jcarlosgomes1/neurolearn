'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Save, X } from 'lucide-react';

interface Clause {
  id: string; code: string; lang: string; title: string; body_md: string;
  scope: string; is_base: boolean; default_on: boolean; version: number; active: boolean; sort_order: number;
}
interface Draft {
  id: string | null; code: string; lang: string; title: string; body_md: string;
  scope: string; is_base: boolean; default_on: boolean; active: boolean; sort_order: number;
}
const EMPTY: Draft = { id: null, code: '', lang: 'pt', title: '', body_md: '', scope: 'both', is_base: false, default_on: false, active: true, sort_order: 0 };
const LANGS = ['pt', 'en', 'es', 'fr'];
const SCOPES: [string, string][] = [['both', 'Candidatura + Curso'], ['application', 'Só candidatura'], ['course', 'Só curso']];

export function ClausesClient() {
  const [items, setItems] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_terms_clauses_list');
      if (error) throw error;
      const res = data as { ok: boolean; items?: Clause[] };
      setItems(res?.items || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!draft || !draft.code.trim() || !draft.title.trim() || !draft.body_md.trim()) return;
    setSaving(true);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_terms_clause_upsert', {
        p_id: draft.id, p_code: draft.code.trim(), p_lang: draft.lang, p_title: draft.title.trim(),
        p_body_md: draft.body_md.trim(), p_scope: draft.scope, p_is_base: draft.is_base,
        p_default_on: draft.default_on, p_sort_order: draft.sort_order || 0, p_active: draft.active,
      });
      if (error) throw error;
      if (!(data as { ok: boolean })?.ok) throw new Error('rpc');
      toast.success('Cláusula guardada');
      setDraft(null);
      await load();
    } catch { toast.error('Não foi possível guardar.'); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm('Eliminar esta cláusula?')) return;
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_terms_clause_delete', { p_id: id });
      if (error) throw error;
      toast.success('Cláusula eliminada');
      await load();
    } catch { toast.error('Não foi possível eliminar.'); }
  }

  const scopeLabel = (s: string) => (SCOPES.find((x) => x[0] === s)?.[1]) || s;

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{items.length} cláusula(s)</p>
        <button onClick={() => setDraft({ ...EMPTY })} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-sm font-medium px-3.5 py-2 hover:bg-slate-800">
          <Plus className="w-4 h-4" />Nova cláusula
        </button>
      </div>

      {draft && (
        <div className="mb-5 rounded-2xl border border-violet-200 bg-violet-50/40 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Código</label>
              <input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="ex: revenue_share" disabled={!!draft.id}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Idioma</label>
              <select value={draft.lang} onChange={(e) => setDraft({ ...draft, lang: e.target.value })} disabled={!!draft.id}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-200">
                {LANGS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Título</label>
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-200" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Texto (markdown)</label>
            <textarea value={draft.body_md} onChange={(e) => setDraft({ ...draft, body_md: e.target.value })} rows={5}
              className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-200 resize-y" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Aplica-se a</label>
              <select value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-200">
                {SCOPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Ordem</label>
              <input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-200" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={draft.is_base} onChange={(e) => setDraft({ ...draft, is_base: e.target.checked })} className="rounded" />Base (obrigatória)</label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={draft.default_on} onChange={(e) => setDraft({ ...draft, default_on: e.target.checked })} className="rounded" />Pré-ativada em novos cursos</label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="rounded" />Ativa</label>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button onClick={save} disabled={saving || !draft.code.trim() || !draft.title.trim() || !draft.body_md.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 disabled:opacity-50 hover:bg-slate-800">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Guardar
            </button>
            <button onClick={() => setDraft(null)} className="inline-flex items-center gap-1 text-sm text-slate-500 px-2 py-2 hover:text-slate-700"><X className="w-4 h-4" />Cancelar</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-500 text-sm">Sem cláusulas. Cria a primeira.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">{c.title}</span>
                    <span className="text-[10px] font-mono uppercase rounded bg-slate-100 text-slate-500 px-1.5 py-0.5">{c.code}</span>
                    <span className="text-[10px] uppercase rounded bg-slate-100 text-slate-500 px-1.5 py-0.5">{c.lang}</span>
                    <span className="text-[10px] rounded bg-violet-50 text-violet-600 px-1.5 py-0.5">{scopeLabel(c.scope)}</span>
                    {c.is_base && <span className="text-[10px] rounded bg-amber-50 text-amber-600 px-1.5 py-0.5">Base</span>}
                    {c.default_on && <span className="text-[10px] rounded bg-emerald-50 text-emerald-600 px-1.5 py-0.5">Pré-ativada</span>}
                    {!c.active && <span className="text-[10px] rounded bg-rose-50 text-rose-600 px-1.5 py-0.5">Inativa</span>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2 whitespace-pre-wrap">{c.body_md}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  <button onClick={() => setDraft({ id: c.id, code: c.code, lang: c.lang, title: c.title, body_md: c.body_md, scope: c.scope, is_base: c.is_base, default_on: c.default_on, active: c.active, sort_order: c.sort_order })} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
