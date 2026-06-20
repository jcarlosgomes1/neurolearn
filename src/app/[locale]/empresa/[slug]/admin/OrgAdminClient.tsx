'use client';

import { useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import { 
  Settings, Palette, FileText, Sparkles, Users, BookOpen, Briefcase,
  CreditCard, AlertCircle, Loader2, Save, ArrowLeft, Euro, ExternalLink
} from 'lucide-react';
import { updateBrandingAction, stripeCheckoutAction, stripePortalAction } from './actions';

interface Data {
  org: { id: string; name: string; slug: string; plan: string; seats_used: number; seats_purchased: number; trial_ends_at?: string };
  role: string;
  usage: {
    subscription: { plan_id: string; status: string; billing_cycle: string; current_period_end: string; trial_ends_at?: string } | null;
    quotas: Record<string, number | null>;
    features: Record<string, boolean>;
    period: { start: string; end: string; counters: Record<string, number>; overage_cents: number };
  } | null;
  counts: { courses: number; contents: number; proposals: number };
  branding: any;
  plans: Array<{ id: string; name: string; trial_days: number; flat_fee_monthly_cents?: number; flat_fee_annual_cents?: number; price_per_seat_monthly_cents?: number; currency: string }>;
}

const QUOTA_KEYS: Record<string, string> = {
  ai_courses_per_month: 'org.quota.ai_courses_per_month',
  ai_proposals_per_month: 'org.quota.ai_proposals_per_month',
  ingest_mb_per_month: 'org.quota.ingest_mb_per_month',
  storage_gb: 'org.quota.storage_gb',
  max_courses: 'org.quota.max_courses',
  translations_per_month: 'org.quota.translations_per_month',
};

export function OrgAdminClient({ slug, initial }: { slug: string; initial: Data }) {
  const t = useTranslations();
  const [tab, setTab] = useState<'overview'|'usage'|'billing'|'branding'>('overview');
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Link href={`/empresa/${slug}` as any} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> {t('org.admin.back')}
      </Link>
      
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-brand-600" /> {t('org.admin.title')} · {initial.org.name}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t('org.admin.subtitle')}</p>
      </div>
      
      <div className="flex bg-slate-100 rounded-lg p-1 text-sm font-medium overflow-x-auto">
        <button onClick={() => setTab('overview')} className={`flex-1 px-3 py-2 rounded ${tab === 'overview' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>{t('org.tab.overview')}</button>
        <button onClick={() => setTab('usage')} className={`flex-1 px-3 py-2 rounded ${tab === 'usage' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>{t('org.tab.usage')}</button>
        <button onClick={() => setTab('billing')} className={`flex-1 px-3 py-2 rounded ${tab === 'billing' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>{t('org.tab.billing')}</button>
        <button onClick={() => setTab('branding')} className={`flex-1 px-3 py-2 rounded ${tab === 'branding' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>{t('org.tab.branding')}</button>
      </div>
      
      {tab === 'overview' && <OverviewTab data={initial} slug={slug} />}
      {tab === 'usage' && <UsageTab data={initial} />}
      {tab === 'billing' && <BillingTab data={initial} slug={slug} />}
      {tab === 'branding' && <BrandingTab data={initial} slug={slug} />}
    </div>
  );
}

function OverviewTab({ data, slug }: { data: Data; slug: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const noSub = !data.usage?.subscription;
  return (
    <div className="space-y-4">
      {noSub && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 text-sm">{t('org.ov.nosub_h')}</h3>
              <p className="text-xs text-amber-800 mt-1">{t('org.ov.nosub_p')}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Users className="h-4 w-4" />} label={t('org.ov.stat_members')} value={data.org.seats_used} />
        <StatCard icon={<BookOpen className="h-4 w-4" />} label={t('org.ov.stat_courses')} value={data.counts.courses} />
        <StatCard icon={<FileText className="h-4 w-4" />} label={t('org.ov.stat_contents')} value={data.counts.contents} />
        <StatCard icon={<Sparkles className="h-4 w-4" />} label={t('org.ov.stat_proposals')} value={data.counts.proposals} />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href={`/empresa/${slug}/conteudos` as any} className="bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition p-4">
          <div className="flex items-center gap-2 mb-1"><FileText className="h-5 w-5 text-brand-600" /><h3 className="font-semibold text-slate-900">{t('org.nav.contents_h')}</h3></div>
          <p className="text-sm text-slate-500">{t('org.nav.contents_p')}</p>
        </Link>
        <Link href={`/empresa/${slug}/cursos/propostas` as any} className="bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition p-4">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="h-5 w-5 text-amber-600" /><h3 className="font-semibold text-slate-900">{t('org.nav.proposals_h')}</h3></div>
          <p className="text-sm text-slate-500">{t('org.nav.proposals_p')}</p>
        </Link>
        <Link href={`/empresa/${slug}/admin/vagas` as any} className="bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition p-4">
          <div className="flex items-center gap-2 mb-1"><Briefcase className="h-5 w-5 text-emerald-600" /><h3 className="font-semibold text-slate-900">{t('org.nav.jobs_h')}</h3></div>
          <p className="text-sm text-slate-500">{t('org.nav.jobs_p')}</p>
        </Link>
      </div>
      
      {data.usage?.subscription && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900 text-sm">{t('org.ov.current_plan')}</h3>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
              data.usage.subscription.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
              data.usage.subscription.status === 'trial' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>{data.usage.subscription.status}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{data.usage.subscription.plan_id}</div>
          <div className="text-xs text-slate-500 mt-1">
            {t('org.ov.cycle')}: {data.usage.subscription.billing_cycle}
            {data.usage.subscription.current_period_end && ` · ${t('org.ov.next_renewal')} ${new Date(data.usage.subscription.current_period_end).toLocaleDateString(locale)}`}
          </div>
        </div>
      )}
    </div>
  );
}

function UsageTab({ data }: { data: Data }) {
  const t = useTranslations();
  const locale = useLocale();
  if (!data.usage) return <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">{t('org.usage.empty')}</div>;
  const period = data.usage.period;
  const quotas = data.usage.quotas;
  const counters = period.counters || {};
  const aiCostCents = Number(counters.ai_cost_cents || 0);
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">{t('org.usage.period')}</h3>
        <div className="text-sm text-slate-700">{new Date(period.start).toLocaleDateString(locale)} → {new Date(period.end).toLocaleDateString(locale)}</div>
        {aiCostCents > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Euro className="h-4 w-4 text-amber-600" />
            <span>{t('org.usage.accrued_cost')}: <strong>{(aiCostCents / 100).toFixed(2)} EUR</strong></span>
          </div>
        )}
        {period.overage_cents > 0 && <div className="mt-1 text-sm text-amber-700">{t('org.usage.overage')}: {(period.overage_cents / 100).toFixed(2)} EUR</div>}
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-700">{t('org.usage.quotas_h')}</h3>
        {Object.entries(QUOTA_KEYS).map(([key, i18nKey]) => {
          const quota = quotas[key]; const used = Number(counters[key] || 0); const isUnlimited = quota == null;
          const pct = !isUnlimited && quota && quota > 0 ? Math.min(100, (used / quota) * 100) : 0;
          const overLimit = !isUnlimited && quota != null && used > quota;
          return (
            <div key={key} className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700">{t(i18nKey)}</span>
                <span className={`text-sm ${overLimit ? 'text-red-700 font-semibold' : 'text-slate-600'}`}>
                  {used.toLocaleString()} / {isUnlimited ? '∞' : quota?.toLocaleString()}
                </span>
              </div>
              {!isUnlimited && quota != null && (
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${overLimit ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              )}
              {overLimit && <p className="text-xs text-red-700 mt-1">{t('org.usage.exceeded')}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatMoney(cents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function BillingTab({ data, slug }: { data: Data; slug: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const [planId, setPlanId] = useState(data.plans[0]?.id || '');
  const [cycle, setCycle] = useState<'monthly'|'annual'>('monthly');
  const [isPending, startTransition] = useTransition();
  const hasSub = !!data.usage?.subscription;
  
  function handleCheckout() {
    if (!planId) { toast.error(t('org.bill.pick_plan')); return; }
    startTransition(async () => {
      const r = await stripeCheckoutAction(slug, planId, cycle);
      if (r.ok && r.data) {
        window.location.href = (r.data as { checkout_url: string }).checkout_url;
      } else {
        toast.error(r.error || t('tea.error'));
      }
    });
  }
  
  function handlePortal() {
    startTransition(async () => {
      const r = await stripePortalAction(slug);
      if (r.ok && r.data) {
        window.location.href = (r.data as { portal_url: string }).portal_url;
      } else {
        toast.error(r.error || t('org.bill.portal_fail'));
      }
    });
  }
  
  return (
    <div className="space-y-4">
      {hasSub && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-2"><CreditCard className="h-4 w-4 text-brand-600" /> {t('org.bill.manage_h')}</h3>
          <p className="text-xs text-slate-500 mb-3">{t('org.bill.manage_p')}</p>
          <button onClick={handlePortal} disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold disabled:opacity-50">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            {t('org.bill.portal_btn')}
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">{hasSub ? t('org.bill.change_h') : t('org.bill.activate_h')}</h3>
        
        {data.plans.length === 0 ? (
          <p className="text-sm text-slate-500">{t('org.bill.no_plans')}</p>
        ) : (
          <>
            <div className="flex bg-slate-100 rounded-lg p-1 max-w-xs text-sm font-medium mb-3">
              <button onClick={() => setCycle('monthly')} className={`flex-1 px-3 py-1.5 rounded ${cycle === 'monthly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>{t('org.bill.monthly')}</button>
              <button onClick={() => setCycle('annual')} className={`flex-1 px-3 py-1.5 rounded ${cycle === 'annual' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>{t('org.bill.annual')}</button>
            </div>
            
            <div className="space-y-2 mb-3">
              {data.plans.map((p) => {
                const flat = cycle === 'annual' ? p.flat_fee_annual_cents : p.flat_fee_monthly_cents;
                const seat = cycle === 'annual' ? null : p.price_per_seat_monthly_cents;
                const selected = planId === p.id;
                return (
                  <label key={p.id} className={`block p-3 rounded-lg border cursor-pointer transition ${selected ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="plan" value={p.id} checked={selected} onChange={() => setPlanId(p.id)} className="sr-only" />
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {flat != null && flat > 0 && <>{formatMoney(flat / (cycle === 'annual' ? 12 : 1), p.currency, locale)}{t('org.bill.per_month')}</>}
                          {seat != null && seat > 0 && <> + {formatMoney(seat, p.currency, locale)}{t('org.bill.per_seat')}</>}
                          {p.trial_days > 0 && <span className="ml-2 text-emerald-700 font-medium">{t('org.bill.trial_days', { days: p.trial_days })}</span>}
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${selected ? 'border-brand-600 bg-brand-600' : 'border-slate-300'}`} />
                    </div>
                  </label>
                );
              })}
            </div>
            
            <button onClick={handleCheckout} disabled={isPending || !planId}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:opacity-90 text-white text-sm font-semibold disabled:opacity-50">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {hasSub ? t('org.bill.change_btn') : t('org.bill.activate_btn')}
            </button>
            
            <p className="text-[10px] text-slate-400 mt-3">
              {t('org.bill.secure_note')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function BrandingTab({ data, slug }: { data: Data; slug: string }) {
  const t = useTranslations();
  const [form, setForm] = useState({
    logo_url: data.branding?.logo_url || '',
    primary_color: data.branding?.primary_color || '#6366f1',
    accent_color: data.branding?.accent_color || '#8b5cf6',
    welcome_message: data.branding?.welcome_message || '',
    footer_message: data.branding?.footer_message || '',
  });
  const [isPending, startTransition] = useTransition();
  function handleSave() {
    startTransition(async () => {
      const r = await updateBrandingAction(slug, form);
      if (r.ok) toast.success(t('org.brand.saved_toast'));
      else toast.error(r.error || t('tea.error'));
    });
  }
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Palette className="h-4 w-4 text-brand-600" /> {t('org.brand.visual_h')}</h3>
        <Field label={t('org.brand.logo_url')}>
          <input type="url" value={form.logo_url} onChange={(e) => setForm({...form, logo_url: e.target.value})} placeholder="https://..." className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-400 outline-none" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('org.brand.primary_color')}>
            <div className="flex gap-2">
              <input type="color" value={form.primary_color} onChange={(e) => setForm({...form, primary_color: e.target.value})} className="h-9 w-12 rounded border border-slate-200 cursor-pointer" />
              <input type="text" value={form.primary_color} onChange={(e) => setForm({...form, primary_color: e.target.value})} className="flex-1 text-sm font-mono px-2 py-1.5 rounded border border-slate-200" />
            </div>
          </Field>
          <Field label={t('org.brand.accent_color')}>
            <div className="flex gap-2">
              <input type="color" value={form.accent_color} onChange={(e) => setForm({...form, accent_color: e.target.value})} className="h-9 w-12 rounded border border-slate-200 cursor-pointer" />
              <input type="text" value={form.accent_color} onChange={(e) => setForm({...form, accent_color: e.target.value})} className="flex-1 text-sm font-mono px-2 py-1.5 rounded border border-slate-200" />
            </div>
          </Field>
        </div>
        <Field label={t('org.brand.welcome_label')}>
          <textarea rows={2} value={form.welcome_message} onChange={(e) => setForm({...form, welcome_message: e.target.value})} placeholder={t('org.brand.welcome_ph')} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 resize-none" />
        </Field>
        <Field label={t('org.brand.footer_label')}>
          <input type="text" value={form.footer_message} onChange={(e) => setForm({...form, footer_message: e.target.value})} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200" />
        </Field>
      </div>
      <button onClick={handleSave} disabled={isPending} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t('org.brand.save_btn')}
      </button>
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-900">
        💡 {t('org.brand.css_hint')}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-bold">{icon}{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-slate-600 block mb-1">{label}</label>{children}</div>;
}
