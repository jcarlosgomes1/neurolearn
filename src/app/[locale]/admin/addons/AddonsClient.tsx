'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useState, useTransition } from 'react';
import { upsertAddonAction, deleteAddonAction, listAddonsAdminAction } from '../monetizacao/actions';
import { Plus, Edit, Trash2, X, Loader2, Package, ToggleLeft, ToggleRight } from 'lucide-react';

function fmt(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(cents / 100);
}

const CATEGORIES = ['ai', 'storage', 'seats', 'features', 'support', 'integration'];
const BILLING_TYPES = ['one_time', 'monthly', 'yearly', 'per_seat_monthly', 'per_unit'];
const APPLIES_TO = ['b2c', 'b2b', 'instructor', 'both'];

export function AddonsClient({ initial }: { initial: any[] }) {
  const [addons, setAddons] = useState(initial);
  const [editing, setEditing] = useState<any | null>(null);
  const [pending, startTransition] = useTransition();

  async function reload() {
    const r = await listAddonsAdminAction();
    if (r.ok) setAddons(r.addons || []);
  }

  function toggleActive(addon: any) {
    startTransition(async () => {
      await upsertAddonAction(addon.id, { active: !addon.active });
      reload();
    });
  }

  function remove(id: string) {
    if (!confirm('Eliminar add-on?')) return;
    startTransition(async () => {
      await deleteAddonAction(id);
      reload();
    });
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="🧩"
        title="Add-ons"
        description="Produtos extra que orgs e instrutores podem comprar (AI credits, seats, white-label, SSO, etc)."
        actions={
          <button onClick={() => setEditing({})}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
            <Plus className="h-4 w-4" /> Novo add-on
          </button>
        }
      />

      {addons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">Sem add-ons</h3>
          <button onClick={() => setEditing({})} className="text-sm text-brand-600 hover:underline">Criar o primeiro →</button>
        </div>
      ) : (
        <div className="space-y-2">
          {addons.map((a) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">{a.name}</h3>
                  {a.highlight && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-semibold rounded">{a.highlight}</span>}
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded">{a.category}</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded">{a.applies_to}</span>
                </div>
                {a.description && <p className="text-xs text-slate-500 line-clamp-1">{a.description}</p>}
                <code className="text-[10px] text-slate-400 font-mono">{a.slug}</code>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900">{fmt(a.price_cents, a.currency)}</div>
                <div className="text-[10px] text-slate-500">{a.billing_type}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleActive(a)} className="p-2 text-slate-400 hover:text-emerald-600">
                  {a.active ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button onClick={() => setEditing(a)} className="p-2 text-slate-400 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(a.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <AddonModal addon={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
      )}
    </div>
  );
}

function AddonModal({ addon, onClose, onSaved }: { addon: any; onClose: () => void; onSaved: () => void }) {
  const isNew = !addon.id;
  const [form, setForm] = useState({
    slug: addon.slug || '',
    name: addon.name || '',
    description: addon.description || '',
    category: addon.category || 'features',
    billing_type: addon.billing_type || 'monthly',
    price_cents: addon.price_cents || 1000,
    currency: addon.currency || 'EUR',
    applies_to: addon.applies_to || 'b2b',
    target_feature: addon.target_feature || '',
    target_increment: addon.target_increment || '',
    highlight: addon.highlight || '',
    sort_order: addon.sort_order || 0,
    active: addon.active ?? true,
    discoverable: addon.discoverable ?? true,
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (isNew && !form.slug.trim()) return setError('Slug obrigatório');
    startTransition(async () => {
      const r = await upsertAddonAction(addon.id || null, form);
      if (r.ok) onSaved();
      else setError(r.error || 'erro');
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-slate-900">{isNew ? 'Novo add-on' : 'Editar add-on'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} disabled={!isNew}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm disabled:bg-slate-100" placeholder="my-addon" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Categoria</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Aplica-se a</label>
              <select value={form.applies_to} onChange={(e) => setForm({ ...form, applies_to: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white">
                {APPLIES_TO.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Billing</label>
              <select value={form.billing_type} onChange={(e) => setForm({ ...form, billing_type: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white">
                {BILLING_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Preço (cents)</label>
              <input type="number" value={form.price_cents} onChange={(e) => setForm({ ...form, price_cents: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Feature alvo (opcional)</label>
              <input type="text" value={form.target_feature} onChange={(e) => setForm({ ...form, target_feature: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" placeholder="enable_white_label" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Incremento (opcional)</label>
              <input type="number" value={form.target_increment} onChange={(e) => setForm({ ...form, target_increment: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Highlight (badge)</label>
            <input type="text" value={form.highlight} onChange={(e) => setForm({ ...form, highlight: e.target.value })}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" placeholder="Most popular" />
          </div>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Activo
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.discoverable} onChange={(e) => setForm({ ...form, discoverable: e.target.checked })} />
              Discoverable
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
