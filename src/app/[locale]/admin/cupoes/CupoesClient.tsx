'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useState, useTransition } from 'react';
import { upsertCouponAction, listCouponsAction } from '../monetizacao/actions';
import { Plus, X, Loader2, Tag, Edit, ToggleLeft, ToggleRight } from 'lucide-react';

const DISCOUNT_TYPES = ['percent', 'fixed', 'trial_extension', 'free_trial'];
const APPLIES_TO = ['all', 'b2c_course', 'b2c_subscription', 'b2b_subscription', 'b2b_addon', 'corporate_service'];

export function CupoesClient({ initial }: { initial: any[] }) {
  const [coupons, setCoupons] = useState(initial);
  const [editing, setEditing] = useState<any | null>(null);
  const [pending, startTransition] = useTransition();

  async function reload() {
    const r = await listCouponsAction();
    if (r.ok) setCoupons(r.coupons);
  }

  function toggle(c: any) {
    startTransition(async () => {
      await upsertCouponAction(c.id, { active: !c.active });
      reload();
    });
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <AdminPageHeader
        backHref="/admin"
        emoji="🎟️"
        title="Cupões"
        description="Códigos promocionais de desconto, extensões de trial, etc."
        actions={
          <button onClick={() => setEditing({})}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
            <Plus className="h-4 w-4" /> Novo cupão
          </button>
        }
      />

      {coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Tag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">Sem cupões</h3>
          <button onClick={() => setEditing({})} className="text-sm text-brand-600 hover:underline">Criar o primeiro →</button>
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="font-bold text-slate-900 font-mono text-sm bg-slate-100 px-2 py-0.5 rounded">{c.code}</code>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded">{c.discount_type}</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded">{c.applies_to}</span>
                  {!c.active && <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[10px] rounded">inactive</span>}
                </div>
                {c.name && <p className="text-xs text-slate-700 font-medium">{c.name}</p>}
                {c.description && <p className="text-xs text-slate-500">{c.description}</p>}
                <div className="text-[10px] text-slate-400 mt-1">
                  {c.current_redemptions}{c.max_redemptions ? `/${c.max_redemptions}` : ''} usos
                  {c.valid_until && ` · expira ${new Date(c.valid_until).toLocaleDateString('pt-PT')}`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900">
                  {c.discount_type === 'percent' ? `${c.discount_value}%` :
                   c.discount_type === 'fixed' ? `€${(c.discount_value/100).toFixed(2)}` :
                   `${c.discount_value} dias`}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggle(c)} className="p-2 text-slate-400 hover:text-emerald-600">
                  {c.active ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button onClick={() => setEditing(c)} className="p-2 text-slate-400 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <CouponModal coupon={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

function CouponModal({ coupon, onClose, onSaved }: { coupon: any; onClose: () => void; onSaved: () => void }) {
  const isNew = !coupon.id;
  const [form, setForm] = useState({
    code: coupon.code || '',
    name: coupon.name || '',
    description: coupon.description || '',
    discount_type: coupon.discount_type || 'percent',
    discount_value: coupon.discount_value || 10,
    applies_to: coupon.applies_to || 'all',
    max_redemptions: coupon.max_redemptions || '',
    max_per_user: coupon.max_per_user || 1,
    min_purchase_cents: coupon.min_purchase_cents || '',
    valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
    active: coupon.active ?? true,
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (isNew && !form.code.trim()) return setError('Código obrigatório');
    const payload = {
      ...form,
      code: form.code.toUpperCase(),
      discount_value: parseFloat(form.discount_value as any),
      max_redemptions: form.max_redemptions ? parseInt(form.max_redemptions as any) : null,
      min_purchase_cents: form.min_purchase_cents ? parseInt(form.min_purchase_cents as any) : null,
      valid_until: form.valid_until || null,
    };
    startTransition(async () => {
      const r = await upsertCouponAction(coupon.id || null, payload);
      if (r.ok) onSaved();
      else setError(r.error || 'erro');
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-semibold text-slate-900">{isNew ? 'Novo cupão' : 'Editar cupão'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Código</label>
            <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} disabled={!isNew}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm font-mono uppercase disabled:bg-slate-100" placeholder="LAUNCH2026" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome (interno)</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" placeholder="Black Friday 2026" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Aplica-se a</label>
              <select value={form.applies_to} onChange={(e) => setForm({ ...form, applies_to: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white">
                {APPLIES_TO.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
              <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white">
                {DISCOUNT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Valor {form.discount_type === 'percent' ? '(%)' : form.discount_type === 'fixed' ? '(cents)' : '(dias)'}
              </label>
              <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Max usos</label>
              <input type="number" value={form.max_redemptions} onChange={(e) => setForm({ ...form, max_redemptions: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" placeholder="∞" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Max/user</label>
              <input type="number" value={form.max_per_user} onChange={(e) => setForm({ ...form, max_per_user: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Min compra (cents)</label>
              <input type="number" value={form.min_purchase_cents} onChange={(e) => setForm({ ...form, min_purchase_cents: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" placeholder="—" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Expira em</label>
            <input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Activo
          </label>
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
