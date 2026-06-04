'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { FileText, Plus, X, Save, Loader2, Euro, AlertCircle, RefreshCw } from 'lucide-react';
import { assignSubscriptionAction, listSubscriptionsAction, syncStripeAction } from './actions';

interface Sub {
  subscription_id: string; org_id: string; org_name: string; org_slug: string;
  plan_id: string; plan_name: string; status: string; billing_cycle: string;
  seats_purchased: number; seats_used: number;
  trial_ends_at: string | null; current_period_end: string | null;
  ai_cost_period_cents: number; overage_period_cents: number;
  created_at: string;
}

interface Plan { id: string; name: string; currency: string; }
interface Org { id: string; name: string; slug: string; }

const STATUS_COLOR: Record<string,string> = {
  trial: 'bg-amber-100 text-amber-700',
  active: 'bg-emerald-100 text-emerald-700',
  past_due: 'bg-red-100 text-red-700',
  paused: 'bg-slate-100 text-slate-700',
  manual: 'bg-indigo-100 text-indigo-700',
};

export function SubscriptionsClient({ initial, plans, orgs }: { initial: Sub[]; plans: Plan[]; orgs: Org[] }) {
  const [items, setItems] = useState<Sub[]>(initial);
  const [showAssign, setShowAssign] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [syncing, setSyncing] = useState(false);
  
  async function refresh() {
    const r = await listSubscriptionsAction();
    if (r.ok) setItems((r.data as Sub[]) || []);
  }
  
  function handleSyncStripe() {
    if (!confirm('Sincronizar planos e addons com Stripe? Vai criar/actualizar Products e Prices na Stripe.')) return;
    setSyncing(true);
    startTransition(async () => {
      const r = await syncStripeAction();
      if (r.ok) toast.success(`Sincronizado: ${(r.data as any).synced_plans} planos · ${(r.data as any).synced_addons} addons`);
      else toast.error(r.error || 'Falhou');
      setSyncing(false);
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><FileText className="h-6 w-6 text-brand-600" /> Subscrições</h1>
          <p className="text-sm text-slate-500 mt-1">Todas as empresas com sub activa. Atribuição manual + sync com Stripe.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSyncStripe} disabled={syncing} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 text-sm border border-slate-200">
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync Stripe
          </button>
          <button onClick={() => setShowAssign(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">
            <Plus className="h-3.5 w-3.5" /> Atribuir sub manual
          </button>
        </div>
      </div>
      
      {plans.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>Sem planos definidos. <a href="/admin/billing/planos" className="underline font-semibold">Cria pelo menos 1 plano</a> antes de atribuir subs.</div>
        </div>
      )}
      
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Sem subscrições activas. Atribui manualmente para arrancar.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs uppercase tracking-wider">Empresa</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs uppercase tracking-wider">Plano</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium text-slate-600 text-xs uppercase tracking-wider">Seats</th>
                  <th className="text-right px-4 py-2.5 font-medium text-slate-600 text-xs uppercase tracking-wider">Custo IA</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs uppercase tracking-wider">Renova</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((s) => (
                  <tr key={s.subscription_id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-900">{s.org_name}</div>
                      <div className="text-xs text-slate-400">/{s.org_slug}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{s.plan_name || s.plan_id}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[s.status] || 'bg-slate-100 text-slate-500'}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-700">{s.seats_used}/{s.seats_purchased}</td>
                    <td className="px-4 py-2.5 text-right text-slate-700">
                      {s.ai_cost_period_cents > 0 && <span className="inline-flex items-center gap-1"><Euro className="h-3 w-3" />{(s.ai_cost_period_cents/100).toFixed(2)}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString('pt-PT') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {showAssign && <AssignDialog orgs={orgs} plans={plans} onClose={() => setShowAssign(false)} onDone={refresh} />}
    </div>
  );
}

function AssignDialog({ orgs, plans, onClose, onDone }: { orgs: Org[]; plans: Plan[]; onClose: () => void; onDone: () => Promise<void> }) {
  const [orgId, setOrgId] = useState(orgs[0]?.id || '');
  const [planId, setPlanId] = useState(plans[0]?.id || '');
  const [cycle, setCycle] = useState('monthly');
  const [seats, setSeats] = useState(10);
  const [status, setStatus] = useState('manual');
  const [trialDays, setTrialDays] = useState(0);
  const [isPending, startTransition] = useTransition();
  
  function handleSave() {
    if (!orgId || !planId) { toast.error('Empresa e plano obrigatórios'); return; }
    startTransition(async () => {
      const r = await assignSubscriptionAction({
        org_id: orgId, plan_id: planId, billing_cycle: cycle,
        seats_purchased: seats, status, trial_days: trialDays > 0 ? trialDays : undefined,
      });
      if (r.ok) { toast.success('Sub atribuída'); await onDone(); onClose(); }
      else toast.error(r.error || 'Falhou');
    });
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Atribuir subscrição manual</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-md"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <Field label="Empresa">
            <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className="w-full text-sm px-2 py-1.5 rounded border border-slate-200 bg-white">
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </Field>
          <Field label="Plano">
            <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="w-full text-sm px-2 py-1.5 rounded border border-slate-200 bg-white">
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Ciclo">
              <select value={cycle} onChange={(e) => setCycle(e.target.value)} className="w-full text-sm px-2 py-1.5 rounded border border-slate-200 bg-white">
                <option value="monthly">Mensal</option>
                <option value="annual">Anual</option>
                <option value="custom">Custom</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full text-sm px-2 py-1.5 rounded border border-slate-200 bg-white">
                <option value="manual">Manual</option>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </Field>
            <Field label="Seats"><input type="number" min={1} value={seats} onChange={(e) => setSeats(Number(e.target.value) || 1)} className="w-full text-sm px-2 py-1.5 rounded border border-slate-200" /></Field>
            <Field label="Trial dias"><input type="number" min={0} value={trialDays} onChange={(e) => setTrialDays(Number(e.target.value) || 0)} className="w-full text-sm px-2 py-1.5 rounded border border-slate-200" /></Field>
          </div>
        </div>
        <div className="border-t border-slate-100 p-3 flex gap-2 justify-end">
          <button onClick={onClose} disabled={isPending} className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={isPending} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Atribuir
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-slate-600 block mb-1">{label}</label>{children}</div>;
}
