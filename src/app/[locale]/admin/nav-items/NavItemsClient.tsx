'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Plus, Trash2, Save, GripVertical, Eye, EyeOff, ExternalLink as ExtIcon } from 'lucide-react';

const LOCATIONS = [
  { key: 'header', label: 'Header (menu principal)', accent: 'from-violet-500 to-indigo-600' },
  { key: 'footer_platform', label: 'Footer · Plataforma', accent: 'from-emerald-500 to-teal-600' },
  { key: 'footer_company', label: 'Footer · Empresa', accent: 'from-blue-500 to-cyan-600' },
  { key: 'footer_legal', label: 'Footer · Legal', accent: 'from-amber-500 to-orange-600' },
  { key: 'user_menu', label: 'User menu (autenticados)', accent: 'from-fuchsia-500 to-pink-600' },
];

export function NavItemsClient({ items }: { items: any[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [activeLoc, setActiveLoc] = useState<string>('footer_platform');
  const filtered = useMemo(() => items.filter((i) => i.location === activeLoc), [items, activeLoc]);

  async function upsert(payload: any) {
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_nav_item_upsert', {
        p_id: payload.id || null,
        p_location: payload.location,
        p_href: payload.href,
        p_i18n_key: payload.i18n_key || null,
        p_label_override: payload.label_override || null,
        p_icon: payload.icon || null,
        p_visibility: payload.visibility || 'public',
        p_sort_order: payload.sort_order ?? 0,
        p_enabled: payload.enabled ?? true,
        p_external: payload.external ?? false,
        p_badge: payload.badge || null,
      });
      if (error) throw error;
      toast.success('Guardado');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (!confirm('Remover esta ligação?')) return;
    try {
      const sb = createClient();
      await sb.rpc('nl_admin_nav_item_delete', { p_id: id });
      toast.success('Removido');
      router.refresh();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
  }
  function newItem() {
    upsert({ location: activeLoc, href: '/', i18n_key: '', sort_order: (filtered.length + 1) * 10, enabled: true });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        {LOCATIONS.map((l) => (
          <button
            key={l.key}
            onClick={() => setActiveLoc(l.key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeLoc === l.key ? `bg-gradient-to-br ${l.accent} text-white shadow-sm` : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {l.label}
            <span className="ml-2 text-[10px] opacity-80">{items.filter((i) => i.location === l.key).length}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-end mb-3">
        <button onClick={newItem} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg">
          <Plus className="h-4 w-4" /> Nova ligação
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">Sem ligações nesta secção.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((it) => <Row key={it.id} item={it} onSave={upsert} onDelete={remove} />)}
          </div>
        )}
      </div>
    </>
  );
}

function Row({ item, onSave, onDelete }: { item: any; onSave: (i: any) => void; onDelete: (id: string) => void }) {
  const [edit, setEdit] = useState(item);
  const [dirty, setDirty] = useState(false);
  function set(k: string, v: any) {
    setEdit((p: any) => ({ ...p, [k]: v }));
    setDirty(true);
  }
  return (
    <div className="p-3 flex items-center gap-2 hover:bg-slate-50/60">
      <GripVertical className="h-4 w-4 text-slate-300 flex-shrink-0" />
      <input value={edit.i18n_key || ''} onChange={(e) => set('i18n_key', e.target.value)} placeholder="i18n.key"
        className="px-2 py-1.5 border border-slate-200 rounded text-xs w-32 font-mono outline-none focus:border-amber-500" />
      <input value={edit.label_override || ''} onChange={(e) => set('label_override', e.target.value)} placeholder="Label (override)"
        className="px-2 py-1.5 border border-slate-200 rounded text-xs w-32 outline-none focus:border-amber-500" />
      <input value={edit.href || ''} onChange={(e) => set('href', e.target.value)} placeholder="/path ou https://"
        className="px-2 py-1.5 border border-slate-200 rounded text-xs flex-1 min-w-[140px] font-mono outline-none focus:border-amber-500" />
      <input type="number" value={edit.sort_order ?? 0} onChange={(e) => set('sort_order', Number(e.target.value))}
        className="px-2 py-1.5 border border-slate-200 rounded text-xs w-14 outline-none focus:border-amber-500" />
      <select value={edit.visibility || 'public'} onChange={(e) => set('visibility', e.target.value)}
        className="px-2 py-1.5 border border-slate-200 rounded text-xs outline-none focus:border-amber-500">
        <option value="public">Pública</option>
        <option value="authenticated">Auth</option>
        <option value="anonymous">Anónimos</option>
        <option value="admin">Admin</option>
      </select>
      <button onClick={() => set('enabled', !edit.enabled)} title={edit.enabled ? 'Ativa' : 'Desativada'}
        className={`p-1.5 rounded-lg ${edit.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
        {edit.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </button>
      <button onClick={() => set('external', !edit.external)} title="Link externo"
        className={`p-1.5 rounded-lg ${edit.external ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
        <ExtIcon className="h-3.5 w-3.5" />
      </button>
      {dirty && (
        <button onClick={() => { onSave(edit); setDirty(false); }}
          className="p-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200" title="Guardar">
          <Save className="h-3.5 w-3.5" />
        </button>
      )}
      <button onClick={() => onDelete(item.id)}
        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
