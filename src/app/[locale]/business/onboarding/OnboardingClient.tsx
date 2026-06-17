'use client';

import { useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
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

function formatMoney(cents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export function OnboardingClient({ locale, plans, selectedPlanId, selectedCycle, userEmail }: {
  locale: string; plans: Plan[]; selectedPlanId?: string; selectedCycle: string; userEmail: string;
}) {
  const t = useTranslations();
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
    if (!orgName.trim()) { toast.error(t('bo.err_name')); return; }
    if (!planId) { toast.error(t('bo.err_plan')); return; }
    startTransition(async () => {
      const sb = createClient();
      const { data: orgData, error: orgErr } = await sb.rpc('nl_create_organization', {
        p_name: orgName, p_legal_name: legalName || null, p_country_code: country,
      });
      if (orgErr || !(orgData as any)?.ok) { toast.error(orgErr?.message || (orgData as any)?.error || t('bo.err_create')); return; }
      const orgId = (orgData as any).org_id;
      const slug = (orgData as any).slug;
      
      const { error: subErr } = await sb.rpc('nl_admin_org_subscription_assign', {
        p_org_id: orgId, p_plan_id: planId, p_billing_cycle: cycle,
        p_seats_purchased: seats, p_status: selectedPlan?.trial_days ? 'trial' : 'manual',
        p_trial_days: selectedPlan?.trial_days || null, p_period_days: 30,
      });
      if (subErr) {
        toast.warning(t('bo.warn_pending'));
      } else {
        toast.success(t('bo.created', { detail: selectedPlan?.trial_days ? t('bo.trial_detail', { days: selectedPlan.trial_days }) : t('bo.sub_active') }));
      }
      router.push(`/${locale}/empresa/${slug}` as any);
    });
  }
  
  if (plans.length === 0) {
    return (
      <div className="min-h-[60vh] max-w-2xl mx-auto px-6 py-20 text-center">
        <Sparkles className="h-10 w-10 mx-auto text-brand-600 mb-3" />
        <h1 className="text-2xl font-bold text-slate-900">{t('bo.no_plans_h')}</h1>
        <p className="text-sm text-slate-500 mt-2">{t('bo.no_plans_p')}</p>
        <Link href={`/contacto` as any} className="inline-flex items-center gap-2 mt-4 text-sm text-brand-600 hover:underline">{t('bo.contact')} →</Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div className="text-center">
        <Building2 className="h-10 w-10 mx-auto text-brand-600 mb-2" />
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('bo.h1')}</h1>
        <p className="text-sm text-slate-500 mt-1">{step === 1 ? t('bo.step1') : t('bo.step2')}</p>
      </div>
      
      <div className="flex items-center gap-2 max-w-xs mx-auto">
        <div className={`flex-1 h-1.5 rounded ${step >= 1 ? 'bg-brand-600' : 'bg-slate-200'}`} />
        <div className={`flex-1 h-1.5 rounded ${step >= 2 ? 'bg-brand-600' : 'bg-slate-200'}`} />
      </div>
      
      {step === 1 ? (
        <>
          <div className="flex bg-slate-100 rounded-full p-1 max-w-xs mx-auto text-sm font-medium">
            <button onClick={() => setCycle('monthly')} className={`flex-1 px-3 py-1.5 rounded-full ${cycle === 'monthly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>{t('bo.monthly')}</button>
            <button onClick={() => setCycle('annual')} className={`flex-1 px-3 py-1.5 rounded-full ${cycle === 'annual' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>{t('bo.annual')}</button>
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
                        {p.trial_days > 0 && <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{t('bo.trial_detail', { days: p.trial_days })}</span>}
                      </div>
                      {p.tagline && <p className="text-xs text-slate-500 mt-0.5">{p.tagline}</p>}
                      <div className="mt-2 text-sm font-medium text-slate-700">
                        {flat != null && flat > 0 && <>{formatMoney(flat / (cycle === 'annual' ? 12 : 1), p.currency, locale)}{t('bo.per_month')}</>}
                        {seat != null && seat > 0 && <span> + {formatMoney(seat / (cycle === 'annual' ? 12 : 1), p.currency, locale)}{t('bo.per_seat')}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          <button onClick={() => setStep(2)} disabled={!planId} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-50">
            {t('bo.continue')} <ArrowRight className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3">
            <Field label={t('bo.f_orgname')}>
              <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder={t('bo.f_orgname_ph')} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-400 outline-none" />
            </Field>
            <Field label={t('bo.f_legalname')}>
              <input type="text" value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder={t('bo.f_legalname_ph')} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('bo.f_country')}>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white">
                  <option value="PT">{t('bo.c_PT')}</option>
                  <option value="ES">{t('bo.c_ES')}</option>
                  <option value="FR">{t('bo.c_FR')}</option>
                  <option value="BR">{t('bo.c_BR')}</option>
                  <option value="GB">{t('bo.c_GB')}</option>
                  <option value="US">{t('bo.c_US')}</option>
                  <option value="DE">{t('bo.c_DE')}</option>
                  <option value="IT">{t('bo.c_IT')}</option>
                </select>
              </Field>
              <Field label={t('bo.f_seats')}>
                <input type="number" min={selectedPlan?.min_seats || 1} value={seats} onChange={(e) => setSeats(Number(e.target.value) || 1)} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200" />
                {selectedPlan?.min_seats && <p className="text-[10px] text-slate-500 mt-0.5">{t('bo.min_seats', { n: selectedPlan.min_seats })}</p>}
              </Field>
            </div>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
            <strong>{t('bo.plan_label')}</strong> {selectedPlan?.name} · {cycle === 'monthly' ? t('bo.monthly') : t('bo.annual')}
            {selectedPlan?.trial_days ? <> · {t('bo.days_free', { days: selectedPlan.trial_days })}</> : null}
            <br />{t('bo.account_email')} {userEmail}
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} disabled={isPending} className="px-4 py-2.5 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">← {t('btn.back')}</button>
            <button onClick={handleCreate} disabled={isPending || !orgName} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:opacity-90 text-white font-semibold disabled:opacity-50">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {t('bo.create_company')}
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
