'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Building2, ArrowRight, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface Plan {
  id: string; name: string; tagline?: string; trial_days: number;
  flat_fee_monthly_cents?: number; flat_fee_annual_cents?: number;
  price_per_seat_monthly_cents?: number; price_per_seat_annual_cents?: number;
  min_seats?: number; currency: string;
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export function OnboardingClient({ locale, plans, selectedPlanId, selectedCycle, userEmail }: {
  locale: string; plans: Plan[]; selectedPlanId?: string; selectedCycle: string; userEmail: string;
}) {
  const [step, setStep] = useState<1|2>(1);
  const [planId, setPlanId] = useState(selectedPlanId || plans[0]?.id || '');
  const [cycle, setCycle] = useState(selectedCycle as 'monthly'|'annual');
  const [orgName, setOrgName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [country, setCountry] = useState('PT');
  const [seats, setSeats] = useState(10);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const selectedPlan = plans.find((p) => p.id === planId);
  
  function handleCreate() {
    if (!orgName.trim()) { toast.error('Nome obrigatório'); return; }
    if (!planId) { toast.error('Escolhe um plano'); return; }
    startTransition(async () => {
      const sb = createClient();
      // 1. Criar org
      const { data: orgData, error: orgErr } = await sb.rpc('nl_org_create', {
        p_name: orgName, p_legal_name: legalName || null, p_country_code: country,
      });
      if (orgErr || !(orgData as any)?.ok) { toast.error(orgErr?.message || (orgData as any)?.error || 'Falhou criar empresa'); return; }
      const orgId = (orgData as any).org_id;
      const slug = (orgData as any).slug;
      
      // 2. Atribuir sub (trial se plano tem trial_days)
      const { error: subErr } = await sb.rpc('nl_admin_org_subscription_assign', {
        p_org_id: orgId, p_plan_id: planId, p_billing_cycle: cycle,
        p_seats_purchased: seats, p_status: selectedPlan?.trial_days ? 'trial' : 'manual',
        p_trial_days: selectedPlan?.trial_days || null, p_period_days: 30,
      });
      if (subErr) {
        // Não bloqueia — empresa criada, sub pode ser atribuída depois manualmente
        toast.warning('Empresa criada, mas subscrição ficou pendente (admin tem que aprovar)');
      } else {
        toast.success(`Empresa criada · ${selectedPlan?.trial_days ? `${selectedPlan.trial_days}d trial` : 'sub activa'}`);
      }
      router.push(`/${locale}/empresa/${slug}` as any);
    });
  }
  
  if (plans.length === 0) {
    return (
      <div className="min-h-[60vh] max-w-2xl mx-auto px-6 py-20 text-center">
        <Sparkles className="h-10 w-10 mx-auto text-brand-600 mb-3" />
        <h1 className="text-2xl font-bold text-slate-900">Planos em preparação</h1>
        <p className="text-sm text-slate-500 mt-2">Volta em breve ou fala connosco.</p>
        <Link href={`/contacto` as any} className="inline-flex items-center gap-2 mt-4 text-sm text-brand-600 hover:underline">Contactar →</Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div className="text-center">
        <Building2 className="h-10 w-10 mx-auto text-brand-600 mb-2" />
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Começar com NeuroLearn</h1>
        <p className="text-sm text-slate-500 mt-1">{step === 1 ? 'Escolhe o plano' : 'Cria a tua empresa'}</p>
      </div>
      
      <div className="flex items-center gap-2 max-w-xs mx-auto">
        <div className={`flex-1 h-1.5 rounded ${step >= 1 ? 'bg-brand-600' : 'bg-slate-200'}`} />
        <div className={`flex-1 h-1.5 rounded ${step >= 2 ? 'bg-brand-600' : 'bg-slate-200'}`} />
      </div>
      
      {step === 1 ? (
        <>
          <div className="flex bg-slate-100 rounded-full p-1 max-w-xs mx-auto text-sm font-medium">
            <button onClick={() => setCycle('monthly')} className={`flex-1 px-3 py-1.5 rounded-full ${cycle === 'monthly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Mensal</button>
            <button onClick={() => setCycle('annual')} className={`flex-1 px-3 py-1.5 rounded-full ${cycle === 'annual' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Anual</button>
          </div>
          
          <div className="space-y-2">
            {plans.map((p) => {
              const flat = cycle === 'annual' ? p.flat_fee_annual_cents : p.flat_fee_monthly_cents;
              const seat = cycle === 'annual' ? p.price_per_seat_annual_cents : p.price_per_seat_monthly_cents;
              const selected = planId === p.id;
              return (
                <button key={p.id} onClick={() => setPlanId(p.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selected ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${selected ? 'bg-brand-600 border-brand-600' : 'border-slate-300'}`}>
                      {selected && <CheckCircle2 className="h-full w-full text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{p.name}</h3>
                        {p.trial_days > 0 && <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{p.trial_days}d trial</span>}
                      </div>
                      {p.tagline && <p className="text-xs text-slate-500 mt-0.5">{p.tagline}</p>}
                      <div className="mt-2 text-sm font-medium text-slate-700">
                        {flat != null && flat > 0 && <>{formatMoney(flat / (cycle === 'annual' ? 12 : 1), p.currency)}/mês</>}
                        {seat != null && seat > 0 && <span> + {formatMoney(seat / (cycle === 'annual' ? 12 : 1), p.currency)}/seat</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          <button onClick={() => setStep(2)} disabled={!planId} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-50">
            Continuar <ArrowRight className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3">
            <Field label="Nome da empresa *">
              <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Lda" className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-400 outline-none" />
            </Field>
            <Field label="Razão social (opcional)">
              <input type="text" value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Acme – Sociedade Unipessoal Lda" className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="País">
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white">
                  <option value="PT">Portugal</option>
                  <option value="ES">Espanha</option>
                  <option value="FR">França</option>
                  <option value="BR">Brasil</option>
                  <option value="GB">Reino Unido</option>
                  <option value="US">EUA</option>
                  <option value="DE">Alemanha</option>
                  <option value="IT">Itália</option>
                </select>
              </Field>
              <Field label="Seats iniciais">
                <input type="number" min={selectedPlan?.min_seats || 1} value={seats} onChange={(e) => setSeats(Number(e.target.value) || 1)} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200" />
                {selectedPlan?.min_seats && <p className="text-[10px] text-slate-500 mt-0.5">Min: {selectedPlan.min_seats}</p>}
              </Field>
            </div>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
            <strong>Plano:</strong> {selectedPlan?.name} · {cycle === 'monthly' ? 'Mensal' : 'Anual'}
            {selectedPlan?.trial_days ? <> · {selectedPlan.trial_days} dias grátis</> : null}
            <br />Email da conta: {userEmail}
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} disabled={isPending} className="px-4 py-2.5 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">← Voltar</button>
            <button onClick={handleCreate} disabled={isPending || !orgName} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:opacity-90 text-white font-semibold disabled:opacity-50">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Criar empresa
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-slate-600 block mb-1">{label}</label>{children}</div>;
}
