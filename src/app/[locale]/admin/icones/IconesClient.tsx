'use client';

import { useMemo, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Search, Plus, Save, Trash2, Loader2 } from 'lucide-react';

interface Glyph { route: string; emoji: string }
interface Labels { search: string; route: string; emoji: string; add: string; saved: string; deleted: string; empty: string; hint: string }

export function IconesClient({ initial, labels }: { initial: Glyph[]; labels: Labels }) {
  const [rows, setRows] = useState<Glyph[]>(initial);
  const [search, setSearch] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [newRow, setNewRow] = useState({ route: '', emoji: '' });
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? rows.filter((r) => r.route.toLowerCase().includes(q)) : rows;
  }, [rows, search]);

  function setEmoji(route: string, value: string) {
    setEdits((p) => ({ ...p, [route]: value }));
  }

  function save(route: string) {
    const emoji = (edits[route] ?? '').trim();
    if (!emoji) { toast.error('Emoji vazio'); return; }
    startTransition(async () => {
      try {
        const sb = createClient();
        const { error } = await sb.rpc('nl_admin_glyph_upsert', { p_route: route, p_emoji: emoji });
        if (error) throw error;
        setRows((rs) => rs.map((r) => (r.route === route ? { ...r, emoji } : r)));
        setEdits((p) => { const n = { ...p }; delete n[route]; return n; });
        toast.success(labels.saved);
      } catch (err: any) { toast.error(err?.message || 'Erro'); }
    });
  }

  function del(route: string) {
    if (!confirm('Remover o ícone da rota ' + route + '?')) return;
    startTransition(async () => {
      try {
        const sb = createClient();
        const { error } = await sb.rpc('nl_admin_glyph_delete', { p_route: route });
        if (error) throw error;
        setRows((rs) => rs.filter((r) => r.route !== route));
        setEdits((p) => { const n = { ...p }; delete n[route]; return n; });
        toast.success(labels.deleted);
      } catch (err: any) { toast.error(err?.message || 'Erro'); }
    });
  }

  function create() {
    const route = newRow.route.trim();
    const emoji = newRow.emoji.trim();
    if (!route.startsWith('/')) { toast.error('A rota deve começar por /'); return; }
    if (!emoji) { toast.error('Emoji obrigatório'); return; }
    startTransition(async () => {
      try {
        const sb = createClient();
        const { error } = await sb.rpc('nl_admin_glyph_upsert', { p_route: route, p_emoji: emoji });
        if (error) throw error;
        setRows((rs) => {
          const without = rs.filter((r) => r.route !== route);
          return [...without, { route, emoji }].sort((a, b) => a.route.localeCompare(b.route));
        });
        setNewRow({ route: '', emoji: '' });
        setCreating(false);
        toast.success(labels.saved);
      } catch (err: any) { toast.error(err?.message || 'Erro'); }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl border border-slate-200 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={labels.search}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky-500" />
        </div>
        <button onClick={() => setCreating(!creating)}
          className="px-4 py-2 bg-gradient-to-br from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 shadow-sm">
          <Plus className="h-4 w-4" /> {labels.add}
        </button>
      </div>

      <p className="text-xs text-slate-500 px-1">{labels.hint}</p>

      {creating && (
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-2xl p-4 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 block">{labels.route}</label>
            <input value={newRow.route} onChange={(e) => setNewRow((p) => ({ ...p, route: e.target.value }))} placeholder="/admin/cursos"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-sky-500" />
          </div>
          <div className="w-24">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 block">{labels.emoji}</label>
            <input value={newRow.emoji} onChange={(e) => setNewRow((p) => ({ ...p, emoji: e.target.value }))} maxLength={8} placeholder="📚"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xl text-center outline-none focus:border-sky-500" />
          </div>
          <button onClick={create} disabled={isPending}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {labels.add}
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500">{labels.empty}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {filtered.map((r) => {
            const val = edits[r.route] ?? r.emoji;
            const dirty = edits[r.route] !== undefined && edits[r.route] !== r.emoji;
            return (
              <div key={r.route} className="flex items-center gap-3 p-3 hover:bg-slate-50/40 group">
                <span className="text-2xl w-9 text-center flex-shrink-0 leading-none">{val || '📄'}</span>
                <code className="text-xs font-mono text-slate-700 flex-1 min-w-0 truncate">{r.route}</code>
                <input value={val} onChange={(e) => setEmoji(r.route, e.target.value)} maxLength={8}
                  className={'w-20 px-2 py-1.5 border rounded text-lg text-center outline-none focus:border-sky-500 ' + (dirty ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200')} />
                <button onClick={() => save(r.route)} disabled={!dirty || isPending}
                  className="p-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-0 disabled:pointer-events-none transition-opacity" title="Guardar">
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => del(r.route)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Remover">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
