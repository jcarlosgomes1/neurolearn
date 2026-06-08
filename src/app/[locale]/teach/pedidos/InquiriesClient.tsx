'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Building2, Users, Clock, Euro, Calendar, Check, X, Loader2, Send, FileText } from 'lucide-react';

interface Inquiry {
  id: string; org_id: string; instructor_id: string | null; service_id: string | null;
  message: string | null; expected_participants: number | null; expected_duration_hours: number | null;
  preferred_dates: any; budget_cents: number | null; budget_currency: string | null;
  format: string | null; location: string | null;
  status: string; quoted_price_cents: number | null; quoted_currency: string | null;
  quoted_at: string | null; quoted_notes: string | null; quoted_valid_until: string | null;
  created_at: string; cancellation_reason: string | null;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Por responder',  cls: 'bg-amber-100 text-amber-700 border-amber-300' },
  quoted:     { label: 'Cotação enviada', cls: 'bg-blue-100 text-blue-700 border-blue-300' },
  accepted:   { label: 'Aceite',         cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  declined:   { label: 'Recusado',       cls: 'bg-rose-100 text-rose-700 border-rose-300' },
  scheduled:  { label: 'Agendado',       cls: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
  completed:  { label: 'Concluído',      cls: 'bg-slate-200 text-slate-700 border-slate-300' },
  cancelled:  { label: 'Cancelado',      cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export function InquiriesClient({ items, orgsMap, svcMap }: { items: Inquiry[]; orgsMap: Record<string, string>; svcMap: Record<string, string> }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [quoting, setQuoting] = useState<string | null>(null);
  const [declining, setDeclining] = useState<string | null>(null);
  const [quoteForm, setQuoteForm] = useState({ price_euros: 0, notes: '', valid_until: '' });
  const [declineReason, setDeclineReason] = useState('');

  async function quote(id: string) {
    if (quoteForm.price_euros <= 0) { toast.error('Preço inválido'); return; }
    setBusy(id);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_my_corporate_inquiry_quote', {
        p_id: id,
        p_quoted_price_cents: Math.round(quoteForm.price_euros * 100),
        p_quoted_currency: 'EUR',
        p_quoted_notes: quoteForm.notes.trim() || null,
        p_quoted_valid_until: quoteForm.valid_until ? new Date(quoteForm.valid_until).toISOString() : null,
      });
      if (error) throw error;
      toast.success('Cotação enviada à empresa');
      setQuoting(null);
      setQuoteForm({ price_euros: 0, notes: '', valid_until: '' });
      router.refresh();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
    finally { setBusy(null); }
  }

  async function decline(id: string) {
    setBusy(id);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_my_corporate_inquiry_decline', { p_id: id, p_reason: declineReason.trim() || null });
      if (error) throw error;
      toast.success('Pedido recusado');
      setDeclining(null);
      setDeclineReason('');
      router.refresh();
    } catch (e: any) { toast.error(e?.message || 'Erro'); }
    finally { setBusy(null); }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <h2 className="font-bold text-slate-900 text-lg">Sem pedidos ainda</h2>
        <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">Cria os teus serviços em /teach/servicos para que as empresas te encontrem.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((it) => {
        const st = STATUS_META[it.status] || STATUS_META.pending;
        const isQuoting = quoting === it.id;
        const isDeclining = declining === it.id;
        return (
          <article key={it.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <header className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-sm text-slate-900 truncate">{orgsMap[it.org_id] || 'Empresa'}</span>
                {it.service_id && svcMap[it.service_id] && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-600">{svcMap[it.service_id]}</span>
                  </>
                )}
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${st.cls}`}>{st.label}</span>
            </header>
            <div className="p-5 space-y-3">
              {it.message && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Mensagem</div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{it.message}</p>
                </div>
              )}
              <div className="grid sm:grid-cols-4 gap-2 text-xs">
                {it.expected_participants && <Detail icon={Users} label="Participantes" value={String(it.expected_participants)} />}
                {it.expected_duration_hours && <Detail icon={Clock} label="Duração" value={`${it.expected_duration_hours}h`} />}
                {it.budget_cents && <Detail icon={Euro} label="Orçamento" value={`${(it.budget_cents / 100).toFixed(0)} ${it.budget_currency || 'EUR'}`} />}
                {it.format && <Detail icon={Building2} label="Formato" value={it.format} />}
              </div>
              {it.quoted_price_cents && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-[10px] uppercase font-bold text-blue-700 mb-1 flex items-center gap-1"><FileText className="h-3 w-3" /> Cotação enviada</div>
                  <div className="text-lg font-bold text-blue-900">{(it.quoted_price_cents / 100).toFixed(2)} {it.quoted_currency || 'EUR'}</div>
                  {it.quoted_notes && <p className="text-xs text-blue-800 mt-1 whitespace-pre-wrap">{it.quoted_notes}</p>}
                  {it.quoted_valid_until && <p className="text-[10px] text-blue-600 mt-1">Válida até {new Date(it.quoted_valid_until).toLocaleDateString('pt-PT')}</p>}
                </div>
              )}
              {it.cancellation_reason && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800">
                  <div className="text-[10px] uppercase font-bold text-rose-700 mb-1">Razão recusa</div>
                  {it.cancellation_reason}
                </div>
              )}
              {it.status === 'pending' && !isQuoting && !isDeclining && (
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button onClick={() => setDeclining(it.id)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg">
                    <X className="h-3.5 w-3.5" /> Recusar
                  </button>
                  <button onClick={() => { setQuoting(it.id); setQuoteForm({ price_euros: (it.budget_cents || 0) / 100 || 0, notes: '', valid_until: '' }); }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm">
                    <Send className="h-3.5 w-3.5" /> Cotar
                  </button>
                </div>
              )}
              {isQuoting && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-blue-700 mb-1 block">Preço (€)</label>
                      <input type="number" min="0" step="50" value={quoteForm.price_euros} onChange={(e) => setQuoteForm((p) => ({ ...p, price_euros: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-blue-700 mb-1 block">Válida até</label>
                      <input type="date" value={quoteForm.valid_until} onChange={(e) => setQuoteForm((p) => ({ ...p, valid_until: e.target.value }))}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                  <textarea value={quoteForm.notes} onChange={(e) => setQuoteForm((p) => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Notas opcionais (o que está incluído, condições, etc.)"
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:border-blue-500 outline-none resize-y" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setQuoting(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900">Cancelar</button>
                    <button onClick={() => quote(it.id)} disabled={busy === it.id} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                      {busy === it.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Enviar cotação
                    </button>
                  </div>
                </div>
              )}
              {isDeclining && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-3">
                  <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} rows={2} placeholder="Razão (opcional) — a empresa vê isto"
                    className="w-full px-3 py-2 border border-rose-200 rounded-lg text-sm focus:border-rose-500 outline-none resize-y" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setDeclining(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900">Voltar</button>
                    <button onClick={() => decline(it.id)} disabled={busy === it.id} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                      {busy === it.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Recusar
                    </button>
                  </div>
                </div>
              )}
            </div>
            <footer className="px-5 py-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>{new Date(it.created_at).toLocaleString('pt-PT')}</span>
            </footer>
          </article>
        );
      })}
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
      <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 flex items-center gap-1"><Icon className="h-3 w-3" /> {label}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Inbox(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>; }
