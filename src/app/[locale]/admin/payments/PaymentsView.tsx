'use client';

import { useEffect, useState, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

interface ReadinessCheck { check_name: string; status: string; detail: string }
interface PricingPlan {
  id: string; name: string; description: string | null; interval: string;
  price_cents: number; currency: string; stripe_price_id: string | null;
  stripe_product_id: string | null; features: string[]; active: boolean; sort_order: number;
}
interface Transaction { id: string; user_email: string | null; amount_cents: number; currency: string; status: string; subscription_plan: string | null; course_id: string | null; created_at: string }
interface PaymentAttempt { id: string; user_email: string | null; amount_cents: number | null; status: string; failure_reason: string | null; created_at: string }

function localeToBcp(locale: string): string {
  if (locale === 'pt') return 'pt-PT';
  if (locale === 'en') return 'en-GB';
  if (locale === 'es') return 'es-ES';
  if (locale === 'fr') return 'fr-FR';
  return 'pt-PT';
}

export function PaymentsView() {
  const t = useTranslations();
  const locale = useLocale();
  const bcp = localeToBcp(locale);

  function fmtPrice(cents: number, currency = 'eur'): string {
    return new Intl.NumberFormat(bcp, { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
  }
  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString(bcp, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

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
    else { toast.success(t('pay.toast_updated')); setEditingPlan(null); await loadAll(); }
  }

  const readyCount = readiness.filter(r => r.status === 'ok').length;
  const totalChecks = readiness.length;
  const pctReady = totalChecks > 0 ? Math.round((readyCount / totalChecks) * 100) : 0;
  const stripeReady = stripeConfigured && readyCount === totalChecks;

  function intervalLabel(interval: string): string {
    if (interval === 'one_time') return t('pay.plan_one_off');
    if (interval === 'month') return t('pay.plan_per_month');
    if (interval === 'year') return t('pay.plan_per_year');
    return interval;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link href={'/admin' as any} className="text-sm text-brand-600 hover:underline">{t('pay.back')}</Link>
      <div className="mt-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('pay.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('pay.subtitle')}</p>
      </div>

      <div className={`mt-6 rounded-2xl p-5 border-2 ${stripeReady ? 'bg-emerald-50 border-emerald-200' : stripeConfigured ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-900 text-lg">
              {stripeReady ? t('pay.banner_active_title') : stripeConfigured ? t('pay.banner_partial_title') : t('pay.banner_prep_title')}
            </h2>
            <p className="text-sm text-slate-700 mt-1">
              {stripeReady && t('pay.banner_active')}
              {stripeConfigured && !stripeReady && t('pay.banner_partial')}
              {!stripeConfigured && t('pay.banner_prep')}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{t('pay.readiness')}</div>
            <div className="text-3xl font-bold tabular-nums">{pctReady}%</div>
            <div className="text-xs text-slate-500">{t('pay.checks', { n: readyCount, total: totalChecks })}</div>
          </div>
        </div>
      </div>

      {!stripeConfigured && (
        <section className="mt-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <h3 className="font-bold text-slate-900 mb-3">{t('pay.setup_title')}</h3>
          <ol className="space-y-3 text-sm text-slate-700">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <li key={step} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">{step}</span>
                <div>{t(`pay.setup_${step}` as any)}</div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">{t('pay.checklist_title')}</h2>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-slate-400">{t('pay.loading')}</div>
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
          <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-3">
            <span className={`text-lg ${stripeConfigured ? 'text-emerald-500' : 'text-slate-300'}`}>
              {stripeConfigured ? '✓' : '○'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900">{t('pay.stripe_secret_key')}</div>
              <div className="text-xs text-slate-500">{stripeConfigured ? t('pay.secret_configured') : t('pay.secret_not_configured')}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-900 mb-3">{t('pay.plans_title')}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {plans.map((p) => {
            const isEditing = editingPlan === p.id;
            return (
              <div key={p.id} className={`bg-white rounded-2xl border-2 ${isEditing ? 'border-brand-400' : 'border-slate-200'} p-5`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-500">{intervalLabel(p.interval)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${p.stripe_price_id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.stripe_price_id ? t('pay.plan_configured') : t('pay.plan_no_priceid')}
                  </span>
                </div>

                {isEditing ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <label className="text-xs text-slate-500 font-semibold">{t('pay.field_price_cents')}</label>
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
                      {t('pay.active_plan')}
                    </label>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => setEditingPlan(null)} className="text-xs px-3 py-1.5 text-slate-600">{t('pay.btn_cancel')}</button>
                      <button onClick={savePlan} className="flex-1 text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded font-semibold">{t('pay.btn_save')}</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-slate-900 mb-2 tabular-nums">{fmtPrice(p.price_cents, p.currency)}</div>
                    {p.description && <p className="text-xs text-slate-600 mb-3">{p.description}</p>}
                    <div className="text-[10px] font-mono text-slate-400 break-all">{p.stripe_price_id || t('pay.empty_priceid')}</div>
                    <button onClick={() => startEdit(p)} className="mt-3 w-full text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded font-medium">{t('pay.btn_edit')}</button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-3">{t('pay.transactions_title', { n: transactions.length })}</h2>
          {transactions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">{t('pay.no_transactions')}</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {transactions.map((tr) => (
                <div key={tr.id} className="p-3 flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tr.status === 'succeeded' ? 'bg-emerald-50 text-emerald-700' : tr.status === 'refunded' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>{tr.status}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{tr.user_email || '?'}</div>
                    <div className="text-xs text-slate-500">{tr.subscription_plan || tr.course_id || '—'} · {fmtDate(tr.created_at)}</div>
                  </div>
                  <div className="text-sm font-bold tabular-nums">{fmtPrice(tr.amount_cents, tr.currency)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-3">{t('pay.attempts_title', { n: attempts.filter(a => a.status === 'failed').length })}</h2>
          {attempts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">{t('pay.no_attempts')}</div>
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
