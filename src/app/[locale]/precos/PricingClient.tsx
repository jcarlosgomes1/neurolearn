'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

interface Plan {
  id: string; name: string; tagline?: string; description?: string; badge?: string; color?: string;
  currency: string; billing_model: string;
  flat_fee_monthly_cents?: number; flat_fee_annual_cents?: number;
  price_per_seat_monthly_cents?: number; price_per_seat_annual_cents?: number;
  min_seats?: number; max_seats?: number; trial_days: number; annual_discount_pct?: number;
  features: Record<string, boolean>; quotas: Record<string, number | null>;
}

interface Addon {
  id: string; name: string; description?: string; feature_key: string; unit_type: string;
  price_monthly_cents?: number; price_annual_cents?: number; price_per_unit_cents?: number;
  currency: string;
}

const FEATURE_LABELS: Record<string,string> = {
  catalog_access: 'Catálogo B2C',
  talent_search: 'Talent Search',
  talent_post_jobs: 'Publicar vagas',
  subdomain: 'Sub-domínio',
  custom_domain: 'Domínio próprio',
  white_label_emails: 'E-mails white-label',
  sso: 'SSO (SAML/OIDC)',
  scim: 'SCIM provisioning',
  api_access: 'API access',
  scheduling: 'Scheduling nativo',
  analytics_advanced: 'Analytics avançadas',
  dpa_template: 'DPA template',
  priority_support: 'Suporte prioritário',
};

const QUOTA_LABELS: Record<string,string> = {
  ai_courses_per_month: 'cursos IA/mês',
  ai_proposals_per_month: 'propostas IA/mês',
  ingest_mb_per_month: 'MB ingest/mês',
  storage_gb: 'GB storage',
  max_courses: 'cursos máx',
  translations_per_month: 'traduções/mês',
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export function PricingClient({ locale, plans, addons }: { locale: string; plans: Plan[]; addons: Addon[] }) {
  const [annual, setAnnual] = useState(false);

  if (plans.length === 0) {
    return (
      <div className="min-h-[60vh] max-w-2xl mx-auto px-6 py-20 text-center">
        <Sparkles className="h-10 w-10 mx-auto text-brand-600 mb-3" />
        <h1 className="text-2xl font-bold text-slate-900">Preços em preparação</h1>
        <p className="text-sm text-slate-500 mt-2">Estamos a finalizar os planos. Volta em breve.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
            Forma a tua equipa.<br />
            <span className="text-brand-600">Sem fricção.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 mt-4">
            A IA gera o conteúdo a partir dos teus manuais internos. Tu defines a escala.
          </p>

          {/* Toggle monthly/annual */}
          <div className="inline-flex items-center bg-white border border-slate-200 rounded-full p-1 mt-8 shadow-sm">
            <button onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${!annual ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>
              Mensal
            </button>
            <button onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${annual ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>
              Anual
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {plans.map((plan) => <PlanCard key={plan.id} plan={plan} annual={annual} locale={locale} />)}
        </div>

        {/* Add-ons */}
        {addons.length > 0 && (
          <div className="mt-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Add-ons</h2>
              <p className="text-sm text-slate-500 mt-1">Acrescenta funcionalidades a qualquer plano.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {addons.map((a) => <AddonCard key={a.id} addon={a} annual={annual} />)}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-slate-900 rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold">Precisas de algo personalizado?</h2>
          <p className="text-slate-300 mt-2">Fala connosco para volumes &gt; 200 seats, SSO, SLA ou DPA personalizado.</p>
          <Link href={`/contacto` as any}
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100">
            Falar com vendas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, annual, locale }: { plan: Plan; annual: boolean; locale: string }) {
  const flat = annual ? plan.flat_fee_annual_cents : plan.flat_fee_monthly_cents;
  const seat = annual ? plan.price_per_seat_annual_cents : plan.price_per_seat_monthly_cents;
  const minSeats = plan.min_seats || 1;
  const featuresOn = Object.entries(plan.features || {}).filter(([, v]) => v === true).map(([k]) => k);
  
  const featured = plan.badge && plan.badge.length > 0;
  
  return (
    <div className={`relative bg-white rounded-2xl border ${featured ? 'border-brand-300 shadow-lg ring-1 ring-brand-200' : 'border-slate-200'} overflow-hidden`}>
      {featured && (
        <div className="absolute top-0 right-0 px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-bl-lg" 
          style={{ background: plan.color || '#6366f1', color: 'white' }}>
          {plan.badge}
        </div>
      )}
      <div className="p-6">
        <div className="w-1.5 h-8 rounded mb-3" style={{ background: plan.color || '#6366f1' }} />
        <h3 className="font-bold text-slate-900 text-xl">{plan.name}</h3>
        {plan.tagline && <p className="text-sm text-slate-500 mt-1">{plan.tagline}</p>}

        <div className="mt-6 mb-4">
          {flat != null && flat > 0 ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">{formatMoney(flat / (annual ? 12 : 1), plan.currency)}</span>
                <span className="text-sm text-slate-500">/mês</span>
              </div>
              {annual && <p className="text-xs text-slate-500 mt-1">Facturado {formatMoney(flat, plan.currency)} / ano</p>}
              {seat != null && seat > 0 && (
                <p className="text-xs text-slate-600 mt-2">+ {formatMoney(seat / (annual ? 12 : 1), plan.currency)} por seat / mês</p>
              )}
            </>
          ) : seat != null && seat > 0 ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">{formatMoney(seat / (annual ? 12 : 1), plan.currency)}</span>
                <span className="text-sm text-slate-500">/seat/mês</span>
              </div>
              {annual && <p className="text-xs text-slate-500 mt-1">Facturado anual</p>}
            </>
          ) : (
            <div className="text-2xl font-bold text-slate-900">Sob proposta</div>
          )}
          {minSeats > 1 && <p className="text-xs text-slate-500 mt-1">A partir de {minSeats} seats</p>}
        </div>

        {plan.trial_days > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-4 text-xs text-emerald-800 font-medium">
            ✨ {plan.trial_days} dias grátis · sem cartão
          </div>
        )}

        <Link href={`/business/onboarding?plan=${plan.id}` as any}
          className={`block w-full text-center px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
            featured
              ? 'bg-gradient-to-r from-brand-600 to-violet-600 hover:opacity-90 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}>
          {plan.trial_days > 0 ? 'Começar trial' : 'Começar'}
        </Link>

        {plan.description && <p className="text-xs text-slate-500 mt-4">{plan.description}</p>}
      </div>

      <div className="border-t border-slate-100 p-6 space-y-2 bg-slate-50">
        {Object.entries(plan.quotas || {})
          .filter(([, v]) => v != null)
          .slice(0, 4)
          .map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="text-slate-700"><strong>{v}</strong> {QUOTA_LABELS[k] || k}</span>
            </div>
          ))}
        {Object.entries(plan.quotas || {}).filter(([, v]) => v == null).map(([k]) => QUOTA_LABELS[k]).filter(Boolean).slice(0, 2).map((label) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-slate-700"><strong>Ilimitado</strong> {label}</span>
          </div>
        ))}
        {featuresOn.slice(0, 6).map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-slate-700">{FEATURE_LABELS[f] || f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddonCard({ addon, annual }: { addon: Addon; annual: boolean }) {
  const monthly = annual && addon.price_annual_cents ? addon.price_annual_cents / 12 : addon.price_monthly_cents;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h4 className="font-semibold text-slate-900">{addon.name}</h4>
      {addon.description && <p className="text-xs text-slate-500 mt-1">{addon.description}</p>}
      <div className="mt-3 text-sm text-slate-700">
        {monthly != null ? (
          <><strong>{formatMoney(monthly, addon.currency)}</strong>/mês {addon.unit_type !== 'flat' && <span className="text-xs text-slate-500">· {addon.unit_type.replace('per_','/')}</span>}</>
        ) : addon.price_per_unit_cents != null ? (
          <><strong>{formatMoney(addon.price_per_unit_cents, addon.currency)}</strong>/{addon.unit_type.replace('per_','')}</>
        ) : <span className="text-slate-500">Sob proposta</span>}
      </div>
    </div>
  );
}
