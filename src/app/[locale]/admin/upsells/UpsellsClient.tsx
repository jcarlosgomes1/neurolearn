'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useState, useTransition } from 'react';
import { detectUpsellSignalsAction, listUpsellSignalsAction, actUpsellSignalAction } from '../revenue/actions';
import { Sparkles, RefreshCw, Loader2, TrendingUp, Mail, X, Check, Users, DollarSign } from 'lucide-react';

function fmt(cents: number) { return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100); }

export function UpsellsClient({ initial }: { initial: any[] }) {
  const [signals, setSignals] = useState(initial);
  const [showActed, setShowActed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [acting, setActing] = useState<any | null>(null);

  async function reload(acted = showActed) {
    const r = await listUpsellSignalsAction(acted);
    if (r?.ok && Array.isArray(r.signals)) setSignals(r.signals);
  }

  function detect() {
    startTransition(async () => {
      const r = await detectUpsellSignalsAction();
      if (r?.ok) reload(false);
    });
  }

  function toggleView() {
    const next = !showActed;
    setShowActed(next);
    startTransition(() => reload(next));
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="✨"
        title="Upsell Signals"
        description="Empresas detectadas com 3+ users B2C — candidatos para plano B2B."
        actions={
          <div className="flex gap-2">
            <button onClick={toggleView} className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
              {showActed ? 'Ver pendentes' : 'Ver tratados'}
            </button>
            <button onClick={detect} disabled={pending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Detectar agora
            </button>
          </div>
        }
      />

      {signals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Sparkles className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">Sem sinais {showActed ? 'tratados' : 'pendentes'}</h3>
          <button onClick={detect} className="text-sm text-violet-600 hover:underline">Correr detecção →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((s) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">@{s.email_domain}</code>
                    <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-semibold rounded">{s.signal_kind}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-600 mt-1">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {s.user_count} users</span>
                    {s.total_spent_cents > 0 && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {fmt(s.total_spent_cents)}</span>}
                    <span>{new Date(s.detected_at).toLocaleDateString('pt-PT')}</span>
                  </div>
                  {s.outcome && <p className="text-xs text-slate-700 mt-2"><strong>Outcome:</strong> {s.outcome}</p>}
                  {s.notes && <p className="text-xs text-slate-500 mt-1">{s.notes}</p>}
                </div>
                {!s.acted_on && (
                  <div className="flex gap-1">
                    <a href={`mailto:owner@${s.email_domain}?subject=Plano corporate NeuroLearn&body=Olá,%0A%0ANotámos que ${s.user_count} membros da tua equipa estão a usar o NeuroLearn individualmente. Temos plano corporate com revshare configurável que poderia poupar tempo e dinheiro à equipa.%0A%0AInteressado/a em conversar?`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg">
                      <Mail className="h-3 w-3" /> Email
                    </a>
                    <button onClick={() => setActing({ ...s, action: 'contacted' })} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg">
                      ✓ Tratado
                    </button>
                    <button onClick={() => setActing({ ...s, action: 'dismissed' })} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg">
                      ✗ Ignorar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {acting && <ActModal signal={acting} onClose={() => setActing(null)} onDone={() => { setActing(null); reload(); }} />}
    </div>
  );
}

function ActModal({ signal, onClose, onDone }: any) {
  const [notes, setNotes] = useState('');
  const [pending, startTransition] = useTransition();
  function submit() {
    startTransition(async () => {
      await actUpsellSignalAction(signal.id, signal.action, notes);
      onDone();
    });
  }
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl">
        <div className="border-b border-slate-100 p-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Marcar como {signal.action === 'contacted' ? 'tratado' : 'ignorado'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-slate-600">Domínio: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{signal.email_domain}</code></p>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Notas internas…"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
        </div>
        <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
          <button onClick={submit} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
