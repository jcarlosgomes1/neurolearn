'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Copy, DollarSign, TrendingUp, ExternalLink, Loader2, AlertCircle, CheckCircle, Award } from 'lucide-react';

function fmt(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(cents / 100);
}

export function AfiliadoClient({ initial, baseUrl }: { initial: any; baseUrl: string }) {
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
      const { data: d, error } = await sb.rpc('nl_affiliate_signup');
      if (error || !(d as any)?.ok) setError(error?.message || 'erro');
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
    if (!details.trim()) return setError('Preenche os detalhes');
    startTransition(async () => {
      const sb = createClient();
      let parsedDetails: any = { value: details };
      try { parsedDetails = JSON.parse(details); } catch {}
      await sb.rpc('nl_affiliate_update_payment', { p_method: method, p_details: parsedDetails });
      setPaymentForm(false);
      reload();
    });
  }

  if (!data?.has_account) {
    return (
      <main className="bg-slate-50 min-h-screen">
        <section className="bg-gradient-to-br from-violet-600 to-brand-700 text-white">
          <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-6 w-6" />
              <span className="text-sm font-semibold uppercase tracking-wider text-violet-200">Programa de Afiliados</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-3">Ganha {data?.default_pct ?? 10}% em cada venda</h1>
            <p className="text-lg text-violet-100 max-w-2xl">Partilha o NeuroLearn e recebe comissão em todas as compras dos teus referidos durante {data?.cookie_days ?? 60} dias.</p>
          </div>
        </section>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-8">
            <h2 className="font-bold text-slate-900 text-xl mb-4">Como funciona</h2>
            <ol className="space-y-3 text-slate-700 text-sm">
              <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span> Crias a tua conta de afiliado (gratuito)</li>
              <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span> Recebes um link único com o teu código</li>
              <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span> Partilhas: redes sociais, blog, email, onde quiseres</li>
              <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span> Quando alguém compra após clicar (até {data?.cookie_days ?? 60} dias), ganhas {data?.default_pct ?? 10}%</li>
              <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0">5</span> Mínimo de {fmt(data?.min_payout_cents ?? 5000)} para receber payout</li>
            </ol>
            {error && <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">{error}</div>}
            <button onClick={signup} disabled={pending}
              className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-brand-700 hover:opacity-90 text-white font-semibold rounded-lg disabled:opacity-50">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Activar conta de afiliado
            </button>
          </div>
        </div>
      </main>
    );
  }

  const aff = data.affiliate;
  const refLink = `${baseUrl}/?ref=${aff.code}`;
  const pct = aff.commission_pct ?? data.default_pct;

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Award className="h-6 w-6 text-violet-600" /> Programa de Afiliados</h1>
          <p className="text-sm text-slate-500 mt-1">Código: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-900">{aff.code}</code> · {pct}% comissão</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KPI icon={<Users className="h-4 w-4 text-blue-600" />} label="Clicks" value={String(aff.total_clicks)} />
          <KPI icon={<Users className="h-4 w-4 text-violet-600" />} label="Signups" value={String(aff.total_signups)} />
          <KPI icon={<TrendingUp className="h-4 w-4 text-emerald-600" />} label="Paying" value={String(aff.total_paid_signups)} />
          <KPI icon={<DollarSign className="h-4 w-4 text-emerald-700" />} label="Earned" value={fmt(aff.total_earned_cents)} sub={`Paid: ${fmt(aff.total_paid_cents)}`} />
        </div>

        <section className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <h2 className="font-semibold text-slate-900 mb-3">O teu link único</h2>
          <div className="flex gap-2 items-center mb-3">
            <input type="text" value={refLink} readOnly className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50" />
            <button onClick={() => copy(refLink, 'link')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg">
              {copied === 'link' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied === 'link' ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Estou a aprender no NeuroLearn — dá uma vista de olhos:')}&url=${encodeURIComponent(refLink)}`} target="_blank" rel="noopener" className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5"><ExternalLink className="h-3 w-3" /> Twitter/X</a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(refLink)}`} target="_blank" rel="noopener" className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5"><ExternalLink className="h-3 w-3" /> LinkedIn</a>
            <a href={`https://wa.me/?text=${encodeURIComponent('Estou a aprender no NeuroLearn — ' + refLink)}`} target="_blank" rel="noopener" className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5"><ExternalLink className="h-3 w-3" /> WhatsApp</a>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-semibold text-slate-900">Conta de payout</h2>
            {!paymentForm && <button onClick={() => { setPaymentForm(true); setMethod(aff.payment_method || 'iban'); setDetails(aff.payment_details ? JSON.stringify(aff.payment_details) : ''); }} className="text-xs text-brand-600 hover:underline">Editar</button>}
          </div>
          {paymentForm ? (
            <div className="space-y-2">
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                <option value="iban">IBAN (transferência)</option>
                <option value="paypal">PayPal</option>
                <option value="wise">Wise</option>
              </select>
              <input type="text" value={details} onChange={(e) => setDetails(e.target.value)}
                placeholder={method === 'iban' ? 'PT50…' : method === 'paypal' ? 'email@example.com' : 'email/handle'}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              {error && <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">{error}</div>}
              <div className="flex gap-2">
                <button onClick={savePayment} disabled={pending} className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">Guardar</button>
                <button onClick={() => setPaymentForm(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs">Cancelar</button>
              </div>
            </div>
          ) : aff.payment_method ? (
            <p className="text-sm text-slate-600">{aff.payment_method.toUpperCase()}: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{JSON.stringify(aff.payment_details)}</code></p>
          ) : (
            <p className="text-sm text-slate-500">Sem método configurado.</p>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Atribuições recentes</h2>
          {data.attributions.length === 0 ? (
            <p className="text-sm text-slate-500">Ainda sem referências. Partilha o teu link!</p>
          ) : (
            <div className="space-y-2">
              {data.attributions.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900">{a.reference_kind}</div>
                    <div className="text-xs text-slate-500">{new Date(a.attributed_at).toLocaleDateString('pt-PT')}</div>
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
    </main>
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
