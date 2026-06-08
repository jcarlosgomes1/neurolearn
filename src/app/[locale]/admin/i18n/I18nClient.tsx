'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Search, Filter, Plus, Save, Trash2, Loader2, Check, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Item {
  key: string; namespace: string;
  pt: string | null; en: string | null; es: string | null; fr: string | null;
  langs_count: number; updated_at: string;
}

interface Labels {
  all_namespaces: string; search_placeholder: string; only_incomplete: string;
  new_key: string; empty: string; saved: string; deleted: string;
}

const LANGS = ['pt', 'en', 'es', 'fr'] as const;
const FLAGS = { pt: '🇵🇹', en: '🇬🇧', es: '🇪🇸', fr: '🇫🇷' };

export function I18nClient({ namespaces, initialItems, initialTotal, labels }: {
  namespaces: Array<{ namespace: string; key_count: number; last_updated: string }>;
  initialItems: Item[];
  initialTotal: number;
  labels: Labels;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [ns, setNs] = useState<string>('');
  const [search, setSearch] = useState('');
  const [incomplete, setIncomplete] = useState(false);
  const [page, setPage] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [edits, setEdits] = useState<Record<string, { pt?: string; en?: string; es?: string; fr?: string; namespace?: string }>>({});
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState({ key: '', namespace: 'ui', pt: '', en: '', es: '', fr: '' });

  const PAGE_SIZE = 50;

  async function fetchPage(opts?: Partial<{ ns: string; search: string; incomplete: boolean; page: number }>) {
    const _ns = opts?.ns ?? ns;
    const _search = opts?.search ?? search;
    const _incomplete = opts?.incomplete ?? incomplete;
    const _page = opts?.page ?? page;
    const sb = createClient();
    const [{ data: rows }, { data: count }] = await Promise.all([
      sb.rpc('nl_admin_i18n_list', {
        p_namespace: _ns || null, p_search: _search || null, p_only_incomplete: _incomplete,
        p_limit: PAGE_SIZE, p_offset: _page * PAGE_SIZE,
      }),
      sb.rpc('nl_admin_i18n_count', {
        p_namespace: _ns || null, p_search: _search || null, p_only_incomplete: _incomplete,
      }),
    ]);
    setItems(Array.isArray(rows) ? rows : []);
    setTotal(Number(count) || 0);
    setEdits({});
  }

  function applyFilters() {
    startTransition(() => { setPage(0); fetchPage({ page: 0 }); });
  }

  function setEdit(key: string, lang: 'pt' | 'en' | 'es' | 'fr', value: string) {
    setEdits((prev) => ({ ...prev, [key]: { ...prev[key], [lang]: value } }));
  }

  async function save(item: Item) {
    const e = edits[item.key];
    if (!e) return;
    startTransition(async () => {
      try {
        const sb = createClient();
        const values: Record<string, string> = {};
        for (const l of LANGS) {
          if (e[l] !== undefined && e[l] !== item[l]) values[l] = e[l] as string;
        }
        if (Object.keys(values).length === 0) return;
        const { error } = await sb.rpc('nl_admin_i18n_upsert', {
          p_key: item.key, p_namespace: e.namespace || item.namespace || 'ui',
          p_values: values,
        });
        if (error) throw error;
        toast.success(labels.saved);
        await fetchPage();
      } catch (err: any) {
        toast.error(err?.message || 'Erro');
      }
    });
  }

  async function del(item: Item) {
    if (!confirm(`Apagar key "${item.key}"? Esta acção remove a tradução em TODAS as línguas.`)) return;
    startTransition(async () => {
      try {
        const sb = createClient();
        const { error } = await sb.rpc('nl_admin_i18n_delete', { p_key: item.key });
        if (error) throw error;
        toast.success(labels.deleted);
        await fetchPage();
      } catch (err: any) {
        toast.error(err?.message || 'Erro');
      }
    });
  }

  async function createKey() {
    if (!newKey.key.trim()) { toast.error('Key obrigatória'); return; }
    startTransition(async () => {
      try {
        const sb = createClient();
        const values: Record<string, string> = {};
        for (const l of LANGS) if (newKey[l].trim()) values[l] = newKey[l];
        if (Object.keys(values).length === 0) { toast.error('Pelo menos 1 valor obrigatório'); return; }
        const { error } = await sb.rpc('nl_admin_i18n_upsert', {
          p_key: newKey.key.trim(), p_namespace: newKey.namespace || 'ui', p_values: values,
        });
        if (error) throw error;
        toast.success(labels.saved);
        setCreating(false);
        setNewKey({ key: '', namespace: 'ui', pt: '', en: '', es: '', fr: '' });
        await fetchPage();
      } catch (err: any) {
        toast.error(err?.message || 'Erro');
      }
    });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      {/* Filtros + actions */}
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl border border-slate-200 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder={labels.search_placeholder}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500" />
        </div>
        <select
          value={ns}
          onChange={(e) => { setNs(e.target.value); startTransition(() => { setPage(0); fetchPage({ ns: e.target.value, page: 0 }); }); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-sky-500">
          <option value="">{labels.all_namespaces}</option>
          {namespaces.map((n) => (
            <option key={n.namespace} value={n.namespace}>{n.namespace} ({n.key_count})</option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={incomplete}
            onChange={(e) => { setIncomplete(e.target.checked); startTransition(() => { setPage(0); fetchPage({ incomplete: e.target.checked, page: 0 }); }); }}
            className="h-4 w-4 rounded text-amber-600" />
          {labels.only_incomplete}
        </label>
        <button
          onClick={applyFilters}
          disabled={isPending}
          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50">
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Filter className="h-3.5 w-3.5" />}
          Aplicar
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setCreating(!creating)}
          className="px-4 py-2 bg-gradient-to-br from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 shadow-sm">
          <Plus className="h-4 w-4" /> {labels.new_key}
        </button>
      </div>

      {/* Nova key inline */}
      {creating && (
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-2xl p-4 space-y-3">
          <div className="grid sm:grid-cols-3 gap-2">
            <input
              value={newKey.key}
              onChange={(e) => setNewKey((p) => ({ ...p, key: e.target.value }))}
              placeholder="ex: home.hero.title"
              className="sm:col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-sky-500" />
            <input
              value={newKey.namespace}
              onChange={(e) => setNewKey((p) => ({ ...p, namespace: e.target.value }))}
              placeholder="namespace (default: ui)"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {LANGS.map((l) => (
              <div key={l}>
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 flex items-center gap-1">
                  {FLAGS[l]} {l.toUpperCase()}
                </label>
                <input
                  value={newKey[l]}
                  onChange={(e) => setNewKey((p) => ({ ...p, [l]: e.target.value }))}
                  placeholder={`Valor em ${l.toUpperCase()}…`}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setCreating(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900">Cancelar</button>
            <button onClick={createKey} disabled={isPending} className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50">
              <Save className="h-3.5 w-3.5" /> Criar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="text-xs text-slate-500 px-1">{total} traduções · página {page + 1}/{totalPages}</div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500">
          {labels.empty}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {items.map((it) => {
            const e = edits[it.key] || {};
            const dirty = LANGS.some((l) => e[l] !== undefined && e[l] !== it[l]);
            return (
              <div key={it.key} className="p-4 hover:bg-slate-50/40 group">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <code className="text-xs font-mono font-semibold text-slate-700 truncate">{it.key}</code>
                    {it.namespace && it.namespace !== 'ui' && (
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">{it.namespace}</span>
                    )}
                    {it.langs_count < 4 && (
                      <span className="inline-flex items-center gap-1 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                        <AlertCircle className="h-2.5 w-2.5" /> {it.langs_count}/4
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {dirty && (
                      <button onClick={() => save(it)} disabled={isPending} className="p-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200" title="Guardar">
                        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    <button onClick={() => del(it)} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {LANGS.map((l) => {
                    const current = e[l] !== undefined ? e[l]! : (it[l] || '');
                    const filled = !!it[l];
                    return (
                      <div key={l}>
                        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 flex items-center gap-1">
                          {FLAGS[l]} {l.toUpperCase()}
                          {filled && <Check className="h-2.5 w-2.5 text-emerald-500" />}
                        </label>
                        <textarea
                          value={current}
                          onChange={(ev) => setEdit(it.key, l, ev.target.value)}
                          rows={1}
                          placeholder={`Valor em ${l.toUpperCase()}…`}
                          className={`w-full px-2 py-1.5 border rounded text-xs outline-none focus:border-sky-500 resize-y leading-snug ${e[l] !== undefined && e[l] !== it[l] ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => { const np = Math.max(0, page - 1); setPage(np); startTransition(() => fetchPage({ page: np })); }}
            disabled={page === 0 || isPending}
            className="p-2 rounded-lg bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-slate-600 px-3">{page + 1} / {totalPages}</span>
          <button
            onClick={() => { const np = Math.min(totalPages - 1, page + 1); setPage(np); startTransition(() => fetchPage({ page: np })); }}
            disabled={page >= totalPages - 1 || isPending}
            className="p-2 rounded-lg bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
