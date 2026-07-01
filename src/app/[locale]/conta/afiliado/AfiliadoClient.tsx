'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations } from 'next-intl';
import { Users, Copy, DollarSign, TrendingUp, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

function fmt(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
}

export function AfiliadoClient({ initial, baseUrl }: { initial: any; baseUrl: string }) {
  const t = useTranslations();
  const [data, setData] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState(false);
  const [method, setMethod] = useState('iban');
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const sb = createClient();
    const { data: d } = await sb.rpc('nl_affiliate_my_dashboard');
    setData(d);
  }

  function signup() {
    startTransition(async () => {
      const sb = createClient();
      assertNotPeekClient();
      const { data: d, error } = await sb.rpc('nl_affiliate_signup');
      if (error || !(d as any)?.ok) setError(error?.message || t('aff.error'));
      else reload();
    });
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  function savePayment() {
    setError(null);
    if (!details.trim()) return setError(t('aff.fill_details'));
    startTransition(async () => {
      const sb = createClient();
      let parsedDetails: any = { value: details };
      try { parsedDetails = JSON.parse(details); } catch {}
      assertNotPeekClient();
      await sb.rpc('nl_affiliate_update_payment', { p_method: method, p_details: parsedDetails });
      setPaymentForm(false);
      reload();
    });
  }

  if (!data?.has_account) {
    return (
      <div className="space-y-6">
        <AppPageHeader title={t('aff.hero_title', { pct: data?.default_pct ?? 10 })} description={t('aff.hero_sub', { days: data?.cookie_days ?? 60 })} />
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <h2 className="font-bold text-slate-900 text-xl mb-4">{t('aff.how_title')}</h2>
          <ol className="space-y-3 text-slate-700 text-sm">
            <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span> {t('aff.step1')}</li>
            <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span> {t('aff.step2')}</li>
            <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span> {t('aff.step3')}</li>
            <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span> {t('aff.step4', { days: data?.cookie_days ?? 60, pct: data?.default_pct ?? 10 })}</li>
            <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">5</span> {t('aff.step5', { amount: fmt(data?.min_payout_cents ?? 5000) })}</li>
          </ol>
          {error && <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">{error}</div>}
          <button onClick={signup} disabled={pending}
            className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-700 hover:opacity-90 text-white font-semibold rounded-lg disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('aff.activate')}
          </button>
        </div>
      </div>
    );
  }

  const aff = data.affiliate;
  const refLink = `${baseUrl}/?ref=${aff.code}`;
  const pct = aff.commission_pct ?? data.default_pct;

  return (
    <div className="space-y-6">
      <AppPageHeader title={t('aff.program')} description={<>{t('aff.code_label')}<code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-900">{aff.code}</code>{t('aff.commission_suffix', { pct })}</>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={<Users className="h-4 w-4 text-blue-600" />} label={t('aff.kpi_clicks')} value={String(aff.total_clicks)} />
        <KPI icon={<Users className="h-4 w-4 text-brand-600" />} label={t('aff.kpi_signups')} value={String(aff.total_signups)} />
        <KPI icon={<TrendingUp className="h-4 w-4 text-emerald-600" />} label={t('aff.kpi_paying')} value={String(aff.total_paid_signups)} />
        <KPI icon={<DollarSign className="h-4 w-4 text-emerald-700" />} label={t('aff.kpi_earned')} value={fmt(aff.total_earned_cents)} sub={t('aff.kpi_paid', { amount: fmt(aff.total_paid_cents) })} />
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-900 mb-3">{t('aff.your_link')}</h2>
        <div className="flex gap-2 items-center mb-3">
          <input type="text" value={refLink} readOnly className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50" />
          <button onClick={() => copy(refLink, 'link')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg">
            {copied === 'link' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied === 'link' ? t('aff.copied') : t('aff.copy')}
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(t('aff.share_text'))}&url=${encodeURIComponent(refLink)}`} target="_blank" rel="noopener" className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5"><ExternalLink className="h-3 w-3" /> Twitter/X</a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(refLink)}`} target="_blank" rel="noopener" className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5"><ExternalLink className="h-3 w-3" /> LinkedIn</a>
          <a href={`https://wa.me/?text=${encodeURIComponent(t('aff.share_text_wa') + refLink)}`} target="_blank" rel="noopener" className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5"><ExternalLink className="h-3 w-3" /> WhatsApp</a>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-semibold text-slate-900">{t('aff.payout_account')}</h2>
          {!paymentForm && <button onClick={() => { setPaymentForm(true); setMethod(aff.payment_method || 'iban'); setDetails(aff.payment_details ? JSON.stringify(aff.payment_details) : ''); }} className="text-xs text-brand-600 hover:underline">{t('aff.edit')}</button>}
        </div>
        {paymentForm ? (
          <div className="space-y-2">
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="iban">{t('aff.method_iban')}</option>
              <option value="paypal">PayPal</option>
              <option value="wise">Wise</option>
            </select>
            <input type="text" value={details} onChange={(e) => setDetails(e.target.value)}
              placeholder={method === 'iban' ? 'PT50…' : method === 'paypal' ? 'email@example.com' : t('aff.ph_handle')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            {error && <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">{error}</div>}
            <div className="flex gap-2">
              <button onClick={savePayment} disabled={pending} className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">{t('aff.save')}</button>
              <button onClick={() => setPaymentForm(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs">{t('btn.cancel')}</button>
            </div>
          </div>
        ) : aff.payment_method ? (
          <p className="text-sm text-slate-600">{aff.payment_method.toUpperCase()}: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{JSON.stringify(aff.payment_details)}</code></p>
        ) : (
          <p className="text-sm text-slate-500">{t('aff.no_method')}</p>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-900 mb-3">{t('aff.attributions_title')}</h2>
        {data.attributions.length === 0 ? (
          <p className="text-sm text-slate-500">{t('aff.no_attributions')}</p>
        ) : (
          <div className="space-y-2">
            {data.attributions.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">{a.reference_kind}</div>
                  <div className="text-xs text-slate-500">{new Date(a.attributed_at).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-700">{fmt(a.commission_cents, a.currency)}</div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KPI({ icon, label, value, sub }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-wider font-semibold">{icon}{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
