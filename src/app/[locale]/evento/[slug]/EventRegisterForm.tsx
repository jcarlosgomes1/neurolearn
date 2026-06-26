'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function EventRegisterForm({ slug, locale, consentText, successText }: { slug: string; locale: string; consentText: string; successText: string }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [interesse, setInteresse] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    setErr('');
    if (!email || !email.includes('@')) { setErr('Indica um email válido.'); return; }
    setBusy(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_event_register', { p_slug: slug, p_nome: nome, p_email: email, p_empresa: empresa, p_interesse: interesse, p_consent: consent, p_consent_text: consentText, p_locale: locale });
      if (error || !(data as any)?.ok) throw new Error('reg');
      setDone(true);
    } catch { setErr('Não foi possível concluir a inscrição. Tenta novamente.'); }
    finally { setBusy(false); }
  }

  if (done) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center">
        <div className="text-emerald-700 font-semibold">Inscrição confirmada!</div>
        <p className="mt-1 text-sm text-emerald-700/80">{successText || 'Recebemos a tua inscrição. Em breve terás novidades.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
      <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Empresa (opcional)" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
      <input value={interesse} onChange={(e) => setInteresse(e.target.value)} placeholder="O que procuras? (opcional)" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
      <label className="flex items-start gap-2 text-xs text-slate-500">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
        <span>{consentText || 'Aceito receber comunicações sobre este e outros eventos.'}</span>
      </label>
      {err && <div className="text-xs text-rose-600">{err}</div>}
      <button onClick={submit} disabled={busy} className="w-full rounded-xl bg-violet-600 text-white px-4 py-3 font-semibold hover:bg-violet-700 disabled:opacity-50">{busy ? 'A inscrever…' : 'Confirmar inscrição'}</button>
    </div>
  );
}
