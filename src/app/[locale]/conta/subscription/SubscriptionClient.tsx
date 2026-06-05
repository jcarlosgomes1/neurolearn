'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';
import { Sparkles, Calendar, X, RotateCcw, Loader2 } from 'lucide-react';

function fmt(c: number) { return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(c/100); }

export function SubscriptionClient({ initial }: { initial: any }) {
  const [data, setData] = useState(initial);
  const [pending, startTransition] = useTransition();

  async function reload() {
    const sb = createClient();
    const { data: d } = await sb.rpc('nl_my_subscription');
    setData(d);
  }

  function cancel() {
    if (!confirm('Cancelar subscrição no fim do período actual?')) return;
    startTransition(async () => {
      const sb = createClient();
      await sb.rpc('nl_subscription_cancel');
      reload();
    });
  }

  function reactivate() {
    startTransition(async () => {
      const sb = createClient();
      await sb.rpc('nl_subscription_reactivate');
      reload();
    });
  }

  const sub = data?.subscription;

  if (!sub) {
    return (
      <main className="bg-slate-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <Sparkles className="h-12 w-12 text-violet-500 mx-auto mb-3" />
            <h1 className="font-bold text-slate-900 text-xl mb-2">Sem subscrição activa</h1>
            <p className="text-sm text-slate-600 mb-4">Acesso ilimitado a todos os cursos a partir de {fmt(data?.monthly_cents || 1990)}/mês.</p>
            <Link href={'/precos/all-access' as any} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-brand-700 text-white font-semibold rounded-lg">
              <Sparkles className="h-4 w-4" /> Ver planos All-Access
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Sparkles className="h-6 w-6 text-violet-600" /> A tua subscrição</h1>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-4">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-xl">{sub.tier === 'all_access' ? 'All-Access' : sub.tier}</h2>
              <p className="text-sm text-slate-500">Cobrança {sub.billing_cycle === 'monthly' ? 'mensal' : 'anual'}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              sub.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
              sub.status === 'past_due' ? 'bg-amber-100 text-amber-800' :
              sub.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
              'bg-slate-100 text-slate-600'
            }`}>{sub.status}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Período actual</div>
              <div className="text-sm font-medium">{new Date(sub.current_period_start).toLocaleDateString('pt-PT')} → {new Date(sub.current_period_end).toLocaleDateString('pt-PT')}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Próxima cobrança</div>
              <div className="text-sm font-medium">
                {sub.cancel_at_period_end ? <span className="text-rose-600">Cancelada</span> : new Date(sub.current_period_end).toLocaleDateString('pt-PT')}
              </div>
            </div>
          </div>

          {sub.status === 'active' && (
            <div className="border-t border-slate-100 pt-4">
              {sub.cancel_at_period_end ? (
                <button onClick={reactivate} disabled={pending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <RotateCcw className="h-4 w-4" /> Reactivar
                </button>
              ) : (
                <button onClick={cancel} disabled={pending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-sm font-semibold rounded-lg disabled:opacity-50">
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <X className="h-4 w-4" /> Cancelar subscrição
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          Para alterar método de pagamento ou tier, contacta suporte: <a href="mailto:hello@neurolearn.app" className="underline">hello@neurolearn.app</a>
        </div>
      </div>
    </main>
  );
}
