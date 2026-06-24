'use client';

import { useState, useTransition } from 'react';
import { quoteInquiryAction, completeInquiryAction, listInquiriesForInstructorAction } from '../corporate-actions';
import { Inbox, Clock, CheckCircle, XCircle, Send, Loader2, X, Building2, Calendar, Users, MapPin } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

const STATUS_BADGES: Record<string, { label: string; className: string; icon: any }> = {
  pending: { label: 'Aguarda orçamento', className: 'bg-amber-100 text-amber-800', icon: Clock },
  quoted: { label: 'Orçamento enviado', className: 'bg-blue-100 text-blue-800', icon: Send },
  accepted: { label: 'Aceite', className: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  scheduled: { label: 'Agendado', className: 'bg-violet-100 text-violet-800', icon: Calendar },
  in_delivery: { label: 'Em entrega', className: 'bg-violet-100 text-violet-800', icon: Calendar },
  completed: { label: 'Concluído', className: 'bg-slate-100 text-slate-700', icon: CheckCircle },
  cancelled: { label: 'Cancelado', className: 'bg-slate-100 text-slate-500', icon: XCircle },
  rejected: { label: 'Recusado', className: 'bg-red-100 text-red-700', icon: XCircle },
};

function fmt(cents?: number | null, currency = 'EUR') {
  if (cents == null) return '—';
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(cents / 100);
}

export function PedidosInstructorClient({ locale, inquiries: initial }: { locale: string; inquiries: any[] }) {
  const [inquiries, setInquiries] = useState(initial);
  const [filter, setFilter] = useState<string>('');
  const [quotingId, setQuotingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = filter ? inquiries.filter(i => i.status === filter) : inquiries;

  async function reload() {
    const r = await listInquiriesForInstructorAction(filter || undefined);
    if (r.ok) setInquiries(r.inquiries);
  }

  async function handleComplete(id: string) {
    const notes = prompt('Notas de entrega (opcional):') || '';
    if (!confirm('Marcar formação como concluída?')) return;
    startTransition(async () => {
      const r = await completeInquiryAction(id, notes);
      if (r.ok) reload();
      else alert('Erro: ' + (r.error || 'unknown'));
    });
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AppPageHeader title="Pedidos Corporate" description="Empresas que pediram orçamento para os teus serviços." />

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[['', 'Todos'], ['pending', 'Pendentes'], ['quoted', 'Cotados'], ['accepted', 'Aceites'], ['completed', 'Concluídos']].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k as string)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap ${filter === k ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">Sem pedidos</h3>
          <p className="text-sm text-slate-500">Quando uma empresa pedir orçamento aos teus serviços, aparece aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((i) => {
            const badge = STATUS_BADGES[i.status] || STATUS_BADGES.pending;
            const Icon = badge.icon;
            return (
              <div key={i.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div className="flex items-center gap-3">
                    {i.org_logo ? (
                      <img src={i.org_logo} alt={i.org_name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center font-bold">
                        {i.org_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-slate-900">{i.org_name}</div>
                      {i.service_title && <div className="text-xs text-slate-500">{i.service_title}</div>}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                    <Icon className="h-3 w-3" /> {badge.label}
                  </span>
                </div>
                
                <p className="text-sm text-slate-700 mb-3 whitespace-pre-wrap">{i.message}</p>
                
                <div className="flex flex-wrap gap-3 text-xs text-slate-600 mb-3">
                  {i.expected_participants && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {i.expected_participants} pessoas</span>}
                  {i.expected_duration_hours && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {i.expected_duration_hours}h</span>}
                  {i.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {i.location}</span>}
                  {i.budget_cents && <span className="px-2 py-0.5 bg-slate-100 rounded">Budget: {fmt(i.budget_cents, i.budget_currency)}</span>}
                </div>
                
                {i.quoted_price_cents && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm mb-3">
                    <div className="font-semibold text-blue-900">Orçamento enviado: {fmt(i.quoted_price_cents, i.quoted_currency)}</div>
                    {i.quoted_notes && <div className="text-blue-700 mt-1">{i.quoted_notes}</div>}
                    {i.quoted_valid_until && <div className="text-xs text-blue-600 mt-1">Válido até {new Date(i.quoted_valid_until).toLocaleDateString(locale)}</div>}
                  </div>
                )}
                
                {i.status === 'accepted' && i.instructor_payout_cents && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm mb-3">
                    <div className="font-semibold text-emerald-900">Vais receber: {fmt(i.instructor_payout_cents, i.quoted_currency)}</div>
                    <div className="text-xs text-emerald-700">Plataforma fee: {fmt(i.platform_fee_cents, i.quoted_currency)} ({i.platform_fee_pct}%)</div>
                  </div>
                )}
                
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  {(i.status === 'pending') && (
                    <button onClick={() => setQuotingId(i.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
                      <Send className="h-4 w-4" /> Enviar orçamento
                    </button>
                  )}
                  {(i.status === 'quoted') && (
                    <button onClick={() => setQuotingId(i.id)}
                      className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">
                      Re-cotar
                    </button>
                  )}
                  {['accepted', 'scheduled', 'in_delivery'].includes(i.status) && (
                    <button onClick={() => handleComplete(i.id)} disabled={pending}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                      <CheckCircle className="h-4 w-4" /> Marcar concluído
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {quotingId && (
        <QuoteModal inquiryId={quotingId} 
          onClose={() => setQuotingId(null)} 
          onDone={() => { setQuotingId(null); reload(); }} />
      )}
    </div>
  );
}

function QuoteModal({ inquiryId, onClose, onDone }: { inquiryId: string; onClose: () => void; onDone: () => void }) {
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [notes, setNotes] = useState('');
  const [validDays, setValidDays] = useState(14);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    const cents = Math.round(parseFloat(price) * 100);
    if (!cents || cents <= 0) return setError('Preço inválido');
    startTransition(async () => {
      const r = await quoteInquiryAction(inquiryId, cents, currency, notes, validDays);
      if (r.ok) onDone();
      else setError(r.error || 'erro');
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl">
        <div className="border-b border-slate-100 p-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Enviar orçamento</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Preço total</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="1500" step="0.01" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Moeda</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
                <option>EUR</option><option>USD</option><option>GBP</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {price && parseFloat(price) > 0 && 
              `Recebes: ${(parseFloat(price) * 0.75).toFixed(2)} ${currency} · Plataforma: ${(parseFloat(price) * 0.25).toFixed(2)} ${currency} (25%)`}
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas / Inclui</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg" rows={3} 
              placeholder="O orçamento inclui materiais, gravação, follow-up Q&A..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Válido durante (dias)</label>
            <input type="number" value={validDays} onChange={(e) => setValidDays(parseInt(e.target.value) || 14)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg" min="1" />
          </div>
          {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
        </div>
        <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
          <button onClick={submit} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar orçamento
          </button>
        </div>
      </div>
    </div>
  );
}
