'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { Package, Sparkles, Check, AlertCircle } from 'lucide-react';

function fmt(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(cents / 100);
}

const BILLING_LABEL: Record<string, string> = {
  one_time: 'pagamento único', monthly: '/mês', yearly: '/ano',
  per_seat_monthly: '/seat/mês', per_unit: '/unidade',
};

export function UpgradesClient({ orgId, orgName, orgSlug, memberRole, features, addons, active, locale }: any) {
  const canBuy = ['owner', 'admin'].includes(memberRole);
  const activeAddonIds = new Set(active.map((a: any) => a.addon_id));

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="bg-gradient-to-br from-violet-600 to-brand-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6" />
            <span className="text-sm font-semibold uppercase tracking-wider">Upgrades & Add-ons</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Personaliza a {orgName}</h1>
          <p className="text-lg text-violet-100 max-w-2xl">Adiciona features extra à tua empresa. Cancela a qualquer momento.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {active.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Add-ons activos</h2>
            <div className="space-y-2">
              {active.map((s: any) => (
                <div key={s.id} className="bg-white border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{s.nl_pricing_addons?.name}</div>
                    <div className="text-xs text-slate-500">Quantidade: {s.quantity} · {fmt(s.total_paid_cents)} total pago</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Add-ons disponíveis</h2>
        
        {addons.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Sem add-ons disponíveis</h3>
            <p className="text-sm text-slate-500">O admin ainda não publicou add-ons.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {addons.map((a: any) => {
              const isActive = activeAddonIds.has(a.id);
              return (
                <div key={a.id} className={`bg-white border rounded-2xl p-5 flex flex-col ${isActive ? 'border-emerald-300' : 'border-slate-200'} ${a.highlight ? 'ring-2 ring-amber-200' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] uppercase tracking-wider rounded">{a.category}</span>
                    {a.highlight && <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-semibold rounded">{a.highlight}</span>}
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{a.name}</h3>
                  {a.description && <p className="text-sm text-slate-600 mb-4 flex-1">{a.description}</p>}
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-slate-900">{fmt(a.price_cents, a.currency)}</div>
                    <div className="text-xs text-slate-500">{BILLING_LABEL[a.billing_type] || a.billing_type}</div>
                  </div>
                  {isActive ? (
                    <button disabled className="w-full px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg inline-flex items-center justify-center gap-1.5">
                      <Check className="h-4 w-4" /> Activo
                    </button>
                  ) : canBuy ? (
                    <a href={`mailto:hello@neurolearn.app?subject=Add-on: ${encodeURIComponent(a.name)}&body=Empresa: ${encodeURIComponent(orgName)}%0AAdd-on: ${encodeURIComponent(a.name)}%0APreço: ${a.price_cents/100} ${a.currency}`}
                      className="w-full px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg text-center block">
                      Pedir activação
                    </a>
                  ) : (
                    <div className="text-xs text-slate-500 text-center">Pede ao owner/admin</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-amber-900">
            Checkout automático Stripe a chegar. Por agora, o teu pedido envia um email à equipa e nós activamos manualmente em &lt;1h em horário comercial.
          </p>
        </div>
      </div>
    </main>
  );
}
