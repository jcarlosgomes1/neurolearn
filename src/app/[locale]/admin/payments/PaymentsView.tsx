'use client';

import { useEffect, useState, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ReadinessCheck { check_name: string; status: string; detail: string }
interface PricingPlan {
  id: string; name: string; description: string | null; interval: string;
  price_cents: number; currency: string; stripe_price_id: string | null;
  stripe_product_id: string | null; features: string[]; active: boolean; sort_order: number;
}
interface Transaction { id: string; user_email: string | null; amount_cents: number; currency: string; status: string; subscription_plan: string | null; course_id: string | null; created_at: string }
interface PaymentAttempt { id: string; user_email: string | null; amount_cents: number | null; status: string; failure_reason: string | null; created_at: string }

function fmtPrice(cents: number, currency = 'eur'): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function PaymentsView() {
  const [readiness, setReadiness] = useState<ReadinessCheck[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [attempts, setAttempts] = useState<PaymentAttempt[]>([]);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [planDraft, setPlanDraft] = useState<Partial<PricingPlan>>({});

  const loadAll = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const [rRes, pRes, tRes, aRes, statusRes] = await Promise.all([
      sb.rpc('nl_stripe_readiness'),
      sb.from('nl_pricing_plans').select('*').order('sort_order'),
      sb.from('nl_transactions').select('id, user_email, amount_cents, currency, status, subscription_plan, course_id, created_at').order('created_at', { ascending: false }).limit(20),
      sb.from('nl_payment_attempts').select('id, user_email, amount_cents, status, failure_reason, created_at').order('created_at', { ascending: false }).limit(20),
      fetch(`${SUPABASE_URL}/functions/v1/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status' }) }).then(r => r.json()).catch(() => ({ stripe_configured: false })),
    ]);
    setReadiness((rRes.data as ReadinessCheck[]) || []);
    setPlans((pRes.data as PricingPlan[]) || []);
    setTransactions((tRes.data as Transaction[]) || []);
    setAttempts((aRes.data as PaymentAttempt[]) || []);
    setStripeConfigured(statusRes.stripe_configured ?? false);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  function startEdit(plan: PricingPlan) {
    setEditingPlan(plan.id);
    setPlanDraft({ ...plan });
  }
  async function savePlan() {
    if (!editingPlan) return;
    const sb = createClient();
    const { error } = await sb.from('nl_pricing_plans').update({
      stripe_price_id: planDraft.stripe_price_id?.trim() || null,
      stripe_product_id: planDraft.stripe_product_id?.trim() || null,
      price_cents: planDraft.price_cents,
      active: planDraft.active,
      updated_at: new Date().toISOString(),
    }).eq('id', editingPlan);
    if (error) toast.error(error.message);
    else { toast.success('Plano actualizado'); setEditingPlan(null); await loadAll(); }
  }

  const readyCount = readiness.filter(r => r.status === 'ok').length;
  const totalChecks = readiness.length;
  const pctReady = totalChecks > 0 ? Math.round((readyCount / totalChecks) * 100) : 0;
  const stripeReady = stripeConfigured && readyCount === totalChecks;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link href={'/admin' as any} className="text-sm text-brand-600 hover:underline">← Cockpit</Link>
      <div className="mt-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">💳 Payments</h1>
        <p className="text-sm text-slate-500 mt-1">Configuração de pagamentos via Stripe. Esta página fica pronta para activares quando tiveres conta Stripe.</p>
      </div>

      {/* Status Banner */}
      <div className={`mt-6 rounded-2xl p-5 border-2 ${stripeReady ? 'bg-emerald-50 border-emerald-200' : stripeConfigured ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-900 text-lg">
              {stripeReady ? '✅ Pagamentos activos' : stripeConfigured ? '⚠ Stripe ligado mas configuração incompleta' : '🔧 Modo preparação — não activado'}
            </h2>
            <p className="text-sm text-slate-700 mt-1">
              {stripeReady && 'Tudo configurado. Os pagamentos via Stripe estão a funcionar.'}
              {stripeConfigured && !stripeReady && 'STRIPE_SECRET_KEY existe mas faltam configurações abaixo.'}
              {!stripeConfigured && 'Toda a infra-estrutura está pronta. Quando quiseres ligar, segue os passos abaixo.'}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Readiness</div>
            <div className="text-3xl font-bold tabular-nums">{pctReady}%</div>
            <div className="text-xs text-slate-500">{readyCount} / {totalChecks} checks</div>
          </div>
        </div>
      </div>

      {/* Setup Steps quando não está ligado */}
      {!stripeConfigured && (
        <section className="mt-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <h3 className="font-bold text-slate-900 mb-3">🚀 Passos para activar (futuro)</h3>
          <ol className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">1</span><div><strong>Cria conta Stripe</strong> em stripe.com (modo PT). Activa conta business com VAT e IBAN.</div></li>
            <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">2</span><div><strong>Cria Products + Prices</strong> no Stripe Dashboard (3 produtos: monthly, annual, lifetime) e copia os <code className="text-xs bg-slate-100 px-1 rounded">price_xxx</code> IDs para os planos abaixo.</div></li>
            <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">3</span><div><strong>Adiciona secrets em Supabase:</strong> <code className="text-xs bg-slate-100 px-1 rounded">STRIPE_SECRET_KEY</code> e <code className="text-xs bg-slate-100 px-1 rounded">STRIPE_WEBHOOK_SECRET</code>.</div></li>
            <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">4</span><div><strong>Webhook no Stripe Dashboard:</strong> URL <code className="text-xs bg-slate-100 px-1 rounded break-all">https://obpezocujzdaznrdgwoo.supabase.co/functions/v1/stripe-webhook</code></div></li>
            <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">5</span><div><strong>Eventos a subscrever:</strong> <code className="text-xs bg-slate-100 px-1 rounded">checkout.session.completed</code>, <code className="text-xs bg-slate-100 px-1 rounded">customer.subscription.*</code>, <code className="text-xs bg-slate-100 px-1 rounded">charge.refunded</code>, <code className="text-xs bg-slate-100 px-1 rounded">payment_intent.payment_failed</code>.</div></li>
            <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">6</span><div><strong>Preenche company info</strong> em <code className="text-xs bg-slate-100 px-1 rounded">nl_platform_config</code> (company_name, vat_number, company_address, support_email).</div></li>
          </ol>
        </section>
      )}

      {/* Readiness Checklist */}
      <section className="mt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">📋 Checklist de configuração</h2>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-slate-400">A carregar...</div>
          ) : readiness.map((r, i) => (
            <div key={r.check_name} className={`px-4 py-3 flex items-center gap-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
              <span className={`text-lg ${r.status === 'ok' ? 'text-emerald-500' : r.status === 'pending' ? 'text-amber-500' : 'text-rose-500'}`}>
                {r.status === 'ok' ? '✓' : r.status === 'pending' ? '⏳' : '✗'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 capitalize">{r.check_name.replace(/_/g, ' ')}</div>
                <div className="text-xs text-slate-500 truncate font-mono">{r.detail}</div>
              </div>
            </div>
          ))}
          {/* Stripe secret check separado pois vem de runtime */}
          <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-3">
            <span className={`text-lg ${stripeConfigured ? 'text-emerald-500' : 'text-slate-300'}`}>
              {stripeConfigured ? '✓' : '○'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900">Stripe secret key</div>
              <div className="text-xs text-slate-500">{stripeConfigured ? 'STRIPE_SECRET_KEY configurada' : 'Não configurada (modo teste)'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-900 mb-3">💰 Planos de subscrição</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {plans.map((p) => {
            const isEditing = editingPlan === p.id;
            return (
              <div key={p.id} className={`bg-white rounded-2xl border-2 ${isEditing ? 'border-brand-400' : 'border-slate-200'} p-5`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-500 capitalize">{p.interval === 'one_time' ? 'one-off' : `por ${p.interval === 'month' ? 'mês' : 'ano'}`}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${p.stripe_price_id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.stripe_price_id ? 'configurado' : 'sem price_id'}
                  </span>
                </div>

                {isEditing ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <label className="text-xs text-slate-500 font-semibold">Preço (cêntimos)</label>
                      <input type="number" value={planDraft.price_cents || 0} onChange={(e) => setPlanDraft({ ...planDraft, price_cents: parseInt(e.target.value) || 0 })} className="w-full p-1.5 border border-slate-200 rounded text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-semibold">stripe_price_id</label>
                      <input value={planDraft.stripe_price_id || ''} onChange={(e) => setPlanDraft({ ...planDraft, stripe_price_id: e.target.value })} placeholder="price_xxx" className="w-full p-1.5 border border-slate-200 rounded text-xs font-mono" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-semibold">stripe_product_id</label>
                      <input value={planDraft.stripe_product_id || ''} onChange={(e) => setPlanDraft({ ...planDraft, stripe_product_id: e.target.value })} placeholder="prod_xxx" className="w-full p-1.5 border border-slate-200 rounded text-xs font-mono" />
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={planDraft.active ?? false} onChange={(e) => setPlanDraft({ ...planDraft, active: e.target.checked })} className="accent-brand-600" />
                      Plano activo
                    </label>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => setEditingPlan(null)} className="text-xs px-3 py-1.5 text-slate-600">Cancelar</button>
                      <button onClick={savePlan} className="flex-1 text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded font-semibold">Guardar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-slate-900 mb-2 tabular-nums">{fmtPrice(p.price_cents, p.currency)}</div>
                    {p.description && <p className="text-xs text-slate-600 mb-3">{p.description}</p>}
                    <div className="text-[10px] font-mono text-slate-400 break-all">{p.stripe_price_id || '— vazio —'}</div>
                    <button onClick={() => startEdit(p)} className="mt-3 w-full text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded font-medium">Editar</button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent transactions */}
      <section className="mt-8 grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-3">💸 Últimas transacções ({transactions.length})</h2>
          {transactions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">Sem transacções (esperado — Stripe não está activo).</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {transactions.map((t) => (
                <div key={t.id} className="p-3 flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.status === 'succeeded' ? 'bg-emerald-50 text-emerald-700' : t.status === 'refunded' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>{t.status}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{t.user_email || '?'}</div>
                    <div className="text-xs text-slate-500">{t.subscription_plan || t.course_id || '—'} · {fmtDate(t.created_at)}</div>
                  </div>
                  <div className="text-sm font-bold tabular-nums">{fmtPrice(t.amount_cents, t.currency)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-3">⚠ Tentativas falhadas ({attempts.filter(a => a.status === 'failed').length})</h2>
          {attempts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">Sem tentativas registadas.</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {attempts.map((a) => (
                <div key={a.id} className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${a.status === 'failed' ? 'bg-rose-100 text-rose-700' : a.status === 'succeeded' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{a.status}</span>
                    <span className="text-xs text-slate-500">{fmtDate(a.created_at)}</span>
                    {a.amount_cents && <span className="text-xs font-semibold tabular-nums ml-auto">{fmtPrice(a.amount_cents)}</span>}
                  </div>
                  {a.user_email && <div className="text-sm text-slate-700 truncate">{a.user_email}</div>}
                  {a.failure_reason && <div className="text-xs text-rose-600 mt-0.5 truncate">{a.failure_reason}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
