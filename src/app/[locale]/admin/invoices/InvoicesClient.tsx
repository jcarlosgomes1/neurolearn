'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useState, useTransition } from 'react';
import { createInvoiceAction, listInvoicesAction } from '../revenue/actions';
import { FileText, Plus, X, Loader2, Download } from 'lucide-react';

function fmt(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(cents / 100);
}

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700', issued: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800', overdue: 'bg-amber-100 text-amber-800',
  void: 'bg-slate-200 text-slate-600', refunded: 'bg-rose-100 text-rose-700',
  partial_refund: 'bg-orange-100 text-orange-700',
};

export function InvoicesClient({ initial }: { initial: any[] }) {
  const [invoices, setInvoices] = useState(initial);
  const [creating, setCreating] = useState(false);

  async function reload() {
    const r = await listInvoicesAction();
    if (r?.ok && Array.isArray(r.invoices)) setInvoices(r.invoices);
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">
      <AdminPageHeader
        emoji="🧾"
        title="Invoices"
        description="Facturas emitidas pela plataforma. VAT calculado por país automaticamente."
        actions={
          <button onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
            <Plus className="h-4 w-4" /> Nova invoice
          </button>
        }
      />

      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">Sem invoices</h3>
          <button onClick={() => setCreating(true)} className="text-sm text-brand-600 hover:underline">Criar a primeira →</button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-3 py-2 font-medium text-slate-600 text-xs uppercase">Number</th>
              <th className="text-left px-3 py-2 font-medium text-slate-600 text-xs uppercase">Bill to</th>
              <th className="text-right px-3 py-2 font-medium text-slate-600 text-xs uppercase">Total</th>
              <th className="text-left px-3 py-2 font-medium text-slate-600 text-xs uppercase">VAT</th>
              <th className="text-left px-3 py-2 font-medium text-slate-600 text-xs uppercase">Status</th>
              <th className="text-left px-3 py-2 font-medium text-slate-600 text-xs uppercase">Issued</th>
            </tr></thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs">{inv.invoice_number}</td>
                  <td className="px-3 py-2 text-slate-900">{inv.bill_to_name}<div className="text-[10px] text-slate-500">{inv.bill_to_country_code}</div></td>
                  <td className="px-3 py-2 text-right font-semibold">{fmt(inv.total_cents, inv.currency)}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{inv.vat_pct}% · {fmt(inv.vat_cents, inv.currency)}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLOR[inv.status] || 'bg-slate-100'}`}>{inv.status}</span></td>
                  <td className="px-3 py-2 text-xs text-slate-500">{inv.issued_at ? new Date(inv.issued_at).toLocaleDateString('pt-PT') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && <CreateInvoiceModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); reload(); }} />}
    </div>
  );
}

function CreateInvoiceModal({ onClose, onCreated }: any) {
  const [form, setForm] = useState({
    bill_to_name: '', bill_to_email: '', bill_to_address: '', bill_to_tax_id: '',
    bill_to_country_code: 'PT', subtotal_cents: 0, currency: 'EUR',
    reference_kind: '', reference_id: '',
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!form.bill_to_name || !form.bill_to_email || !form.subtotal_cents) {
      return setError('Campos obrigatórios em falta');
    }
    startTransition(async () => {
      const r = await createInvoiceAction(form);
      if (r?.ok) onCreated();
      else setError(r?.error || 'erro');
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-semibold text-slate-900">Nova invoice</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome</label>
              <input type="text" value={form.bill_to_name} onChange={(e) => setForm({...form, bill_to_name: e.target.value})}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={form.bill_to_email} onChange={(e) => setForm({...form, bill_to_email: e.target.value})}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Morada</label>
            <input type="text" value={form.bill_to_address} onChange={(e) => setForm({...form, bill_to_address: e.target.value})}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">NIF/VAT</label>
              <input type="text" value={form.bill_to_tax_id} onChange={(e) => setForm({...form, bill_to_tax_id: e.target.value})}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">País</label>
              <select value={form.bill_to_country_code} onChange={(e) => setForm({...form, bill_to_country_code: e.target.value})}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white">
                {['PT','ES','FR','DE','IT','NL','BE','GB','US','BR'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subtotal (cents)</label>
              <input type="number" value={form.subtotal_cents} onChange={(e) => setForm({...form, subtotal_cents: parseInt(e.target.value) || 0})}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Moeda</label>
              <select value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white">
                {['EUR','USD','GBP','BRL'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {error && <div className="p-2 bg-rose-50 border border-rose-200 rounded text-sm text-rose-700">{error}</div>}
        </div>
        <div className="border-t border-slate-100 p-4 flex justify-end gap-2 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
          <button onClick={submit} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Emitir
          </button>
        </div>
      </div>
    </div>
  );
}
