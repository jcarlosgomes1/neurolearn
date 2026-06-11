'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useState, useTransition } from 'react';
import { listRefundsAction, resolveRefundAction } from '../revenue/actions';
import { RefreshCw, Loader2, Check, X, AlertCircle } from 'lucide-react';

function fmt(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(cents / 100);
}

export function RefundsClient({ initial }: { initial: any[] }) {
  const [refunds, setRefunds] = useState(initial);
  const [status, setStatus] = useState<string>('pending');
  const [pending, startTransition] = useTransition();

  async function reload(s = status) {
    const r = await listRefundsAction(s);
    if (r?.ok && Array.isArray(r.refunds)) setRefunds(r.refunds);
  }

  function changeStatus(s: string) {
    setStatus(s);
    startTransition(() => reload(s));
  }

  function resolve(id: string, action: 'approve' | 'reject') {
    const notes = prompt(`Notas (opcional) para ${action}:`);
    startTransition(async () => {
      await resolveRefundAction(id, action, notes || undefined);
      reload();
    });
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <AdminPageHeader
        backHref="/admin"
        emoji="💸"
        title="Refunds"
        description="Pedidos de reembolso. Janela definida em /admin/monetizacao."
        actions={
          <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden">
            {['pending','approved','rejected','processed'].map((s) => (
              <button key={s} onClick={() => changeStatus(s)}
                className={`px-3 py-1.5 text-xs font-medium ${status === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {s}
              </button>
            ))}
          </div>
        }
      />

      {refunds.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <RefreshCw className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">Sem refunds {status}</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {refunds.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900">{fmt(r.amount_cents, r.currency)}</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded">{r.reference_kind}</span>
                    <code className="text-[10px] text-slate-400 font-mono">{r.reference_id}</code>
                  </div>
                  <p className="text-sm text-slate-700"><strong>Razão:</strong> {r.reason}</p>
                  <p className="text-xs text-slate-500 mt-1">Pedido em {new Date(r.created_at).toLocaleString('pt-PT')}</p>
                  {r.notes && <p className="text-xs text-slate-600 mt-1 italic">"{r.notes}"</p>}
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-1">
                    <button onClick={() => resolve(r.id, 'approve')} disabled={pending}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                      <Check className="h-3 w-3" /> Aprovar
                    </button>
                    <button onClick={() => resolve(r.id, 'reject')} disabled={pending}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                      <X className="h-3 w-3" /> Rejeitar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <p className="text-amber-900">Aprovar marca o refund como aprovado e cria revenue event negativo. Processamento real do refund via Stripe vem com integração Stripe.</p>
      </div>
    </div>
  );
}
