'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, X, Save } from 'lucide-react';
import { upsertAddonAction, deleteAddonAction, listAddonsAction } from '../actions';

interface Addon {
  id: string; name: string; description?: string; feature_key: string;
  unit_type: string; currency: string;
  price_monthly_cents?: number; price_annual_cents?: number; price_per_unit_cents?: number;
  configuration: Record<string, unknown>;
  sort_order: number; enabled: boolean; public_visible: boolean;
}

const UNIT_TYPES = [
  { v: 'flat', l: 'Flat /mês (preço fixo)' },
  { v: 'per_seat', l: 'Per-seat (preço × seats)' },
  { v: 'per_gb', l: 'Per-GB (storage)' },
  { v: 'per_course', l: 'Per-course (consumo)' },
  { v: 'per_use', l: 'Per-use (transacção)' },
  { v: 'per_placement', l: 'Per-placement (talent fee)' },
];

const EMPTY: Addon = { id: '', name: '', feature_key: '', unit_type: 'flat', currency: 'EUR', configuration: {}, sort_order: 0, enabled: true, public_visible: true };

export function AddonsEditor({ initial }: { initial: Addon[] }) {
  const [items, setItems] = useState<Addon[]>(initial);
  const [editing, setEditing] = useState<Addon | null>(null);
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    const r = await listAddonsAction();
    if (r.ok) setItems((r.data as Addon[]) || []);
  }
  function handleSave() {
    if (!editing || !editing.id || !editing.name || !editing.feature_key) {
      toast.error('id, name e feature_key obrigatórios'); return;
    }
    startTransition(async () => {
      const r = await upsertAddonAction(editing as unknown as Record<string, unknown>);
      if (r.ok) { toast.success('Add-on guardado'); setEditing(null); await refresh(); }
      else toast.error(r.error || 'Falhou');
    });
  }
  function handleDelete(a: Addon) {
    if (!confirm(`Apagar "${a.name}"?`)) return;
    startTransition(async () => {
      const r = await deleteAddonAction(a.id);
      if (r.ok) { toast.success('Apagado'); await refresh(); }
      else toast.error(r.error || 'Falhou');
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Plus className="h-6 w-6 text-emerald-600" /> Add-ons</h1>
          <p className="text-sm text-slate-500 mt-1">Funcionalidades extra vendíveis à parte: catálogo, talent, SSO, etc.</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY, sort_order: items.length })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">
          <Plus className="h-3.5 w-3.5" /> Novo add-on
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Sem add-ons. Exemplos: "Catalog Access" (per-seat) · "Talent Search" (flat) · "Custom Domain" (flat) · "Storage extra" (per-gb).
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900">{a.name}</h3>
                  <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{a.id}</code>
                  <code className="text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-700">{a.feature_key}</code>
                  <span className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{a.unit_type}</span>
                  {!a.enabled && <span className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">desligado</span>}
                </div>
                {a.description && <p className="text-xs text-slate-500 mt-1">{a.description}</p>}
                <div className="text-xs text-slate-600 mt-2 flex flex-wrap gap-3">
                  {a.price_monthly_cents != null && <span><strong>{(a.price_monthly_cents/100).toFixed(2)} {a.currency}</strong>/mês</span>}
                  {a.price_annual_cents != null && <span><strong>{(a.price_annual_cents/100).toFixed(2)} {a.currency}</strong>/ano</span>}
                  {a.price_per_unit_cents != null && <span><strong>{(a.price_per_unit_cents/100).toFixed(2)} {a.currency}</strong>/{a.unit_type.replace('per_','')}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing({ ...EMPTY, ...a, configuration: a.configuration || {} })} className="text-xs px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 font-medium">Editar</button>
                <button onClick={() => handleDelete(a)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">{editing.id ? 'Editar add-on' : 'Novo add-on'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-slate-100 rounded-md"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <Field label="ID*"><input type="text" value={editing.id} onChange={(e) => setEditing({ ...editing, id: e.target.value })} className="w-full text-sm font-mono px-2 py-1.5 rounded border border-slate-200" placeholder="catalog_access" /></Field>
              <Field label="Nome*"><input type="text" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full text-sm px-2 py-1.5 rounded border border-slate-200" placeholder="Acesso ao Catálogo" /></Field>
              <Field label="Feature key*"><input type="text" value={editing.feature_key} onChange={(e) => setEditing({ ...editing, feature_key: e.target.value })} className="w-full text-sm font-mono px-2 py-1.5 rounded border border-slate-200" placeholder="catalog_access" /></Field>
              <Field label="Descrição"><textarea rows={2} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full text-sm px-2 py-1.5 rounded border border-slate-200 resize-none" /></Field>
              <Field label="Modelo de preço">
                <select value={editing.unit_type} onChange={(e) => setEditing({ ...editing, unit_type: e.target.value })} className="w-full text-sm px-2 py-1.5 rounded border border-slate-200 bg-white">
                  {UNIT_TYPES.map((u) => <option key={u.v} value={u.v}>{u.l}</option>)}
                </select>
              </Field>
              <Field label="Moeda"><input type="text" maxLength={3} value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value.toUpperCase() })} className="w-full text-sm font-mono px-2 py-1.5 rounded border border-slate-200" /></Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Preço /mês (cents)"><input type="number" value={editing.price_monthly_cents ?? ''} onChange={(e) => setEditing({ ...editing, price_monthly_cents: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full text-sm font-mono px-2 py-1.5 rounded border border-slate-200" /></Field>
                <Field label="Preço /ano (cents)"><input type="number" value={editing.price_annual_cents ?? ''} onChange={(e) => setEditing({ ...editing, price_annual_cents: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full text-sm font-mono px-2 py-1.5 rounded border border-slate-200" /></Field>
                <Field label="Por unidade (cents)"><input type="number" value={editing.price_per_unit_cents ?? ''} onChange={(e) => setEditing({ ...editing, price_per_unit_cents: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full text-sm font-mono px-2 py-1.5 rounded border border-slate-200" /></Field>
              </div>
              <Field label="Ordem"><input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })} className="w-full text-sm px-2 py-1.5 rounded border border-slate-200" /></Field>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} className="rounded" /> Activo</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={editing.public_visible} onChange={(e) => setEditing({ ...editing, public_visible: e.target.checked })} className="rounded" /> Visível em /precos</label>
            </div>
            <div className="border-t border-slate-100 p-3 flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} disabled={isPending} className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">Cancelar</button>
              <button onClick={handleSave} disabled={isPending} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50">
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-slate-600 block mb-1">{label}</label>{children}</div>;
}
