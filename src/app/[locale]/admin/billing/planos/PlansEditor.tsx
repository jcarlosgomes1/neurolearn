'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Eye, EyeOff, Loader2, X, Save, Package } from 'lucide-react';
import { upsertPlanAction, deletePlanAction, listPlansAction } from '../actions';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

interface Plan {
  id: string; name: string; description?: string; tagline?: string;
  badge?: string; color?: string; currency: string; billing_model: string;
  flat_fee_monthly_cents?: number; flat_fee_annual_cents?: number;
  price_per_seat_monthly_cents?: number; price_per_seat_annual_cents?: number;
  min_seats?: number; max_seats?: number;
  trial_days: number; annual_discount_pct?: number;
  quotas: Record<string, unknown>; overage_pricing: Record<string, unknown>;
  features: Record<string, unknown>;
  sort_order: number; enabled: boolean; public_visible: boolean;
}

const EMPTY_PLAN: Plan = {
  id: '', name: '', currency: 'EUR', billing_model: 'subscription',
  trial_days: 0, quotas: {}, overage_pricing: {}, features: {},
  sort_order: 0, enabled: true, public_visible: true,
};

const QUOTA_KEYS = [
  { key: 'ai_courses_per_month', label: 'Cursos IA / mês', type: 'number' },
  { key: 'ai_proposals_per_month', label: 'Propostas IA / mês', type: 'number' },
  { key: 'ingest_mb_per_month', label: 'PDF ingest MB / mês', type: 'number' },
  { key: 'storage_gb', label: 'Storage total GB', type: 'number' },
  { key: 'max_courses', label: 'Cursos máximo', type: 'number' },
  { key: 'translations_per_month', label: 'Traduções / mês', type: 'number' },
];

const FEATURE_KEYS = [
  { key: 'catalog_access', label: 'Acesso ao catálogo B2C' },
  { key: 'talent_search', label: 'Talent Search' },
  { key: 'talent_post_jobs', label: 'Publicar vagas' },
  { key: 'subdomain', label: 'Sub-domínio' },
  { key: 'custom_domain', label: 'Domínio próprio' },
  { key: 'white_label_emails', label: 'E-mails white-label' },
  { key: 'sso', label: 'SSO (SAML/OIDC)' },
  { key: 'scim', label: 'SCIM provisioning' },
  { key: 'api_access', label: 'API access' },
  { key: 'scheduling', label: 'Scheduling nativo' },
  { key: 'analytics_advanced', label: 'Analytics avançadas' },
  { key: 'dpa_template', label: 'Template DPA' },
  { key: 'priority_support', label: 'Suporte prioritário' },
];

const OVERAGE_KEYS = [
  { key: 'extra_course_cents', label: 'Curso extra (cêntimos)' },
  { key: 'extra_proposal_cents', label: 'Proposta extra (cêntimos)' },
  { key: 'extra_seat_monthly_cents', label: 'Seat extra/mês (cêntimos)' },
  { key: 'extra_storage_per_gb_cents', label: 'GB extra storage (cêntimos)' },
  { key: 'extra_ingest_per_mb_cents', label: 'MB ingest extra (cêntimos)' },
];

export function PlansEditor({ initial }: { initial: Plan[] }) {
  const [plans, setPlans] = useState<Plan[]>(initial);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    const r = await listPlansAction();
    if (r.ok) setPlans((r.data as Plan[]) || []);
  }

  function handleNew() { setEditing({ ...EMPTY_PLAN, id: '', sort_order: plans.length }); }
  function handleEdit(plan: Plan) {
    setEditing({
      ...EMPTY_PLAN, ...plan,
      quotas: plan.quotas || {}, overage_pricing: plan.overage_pricing || {}, features: plan.features || {},
    });
  }

  function handleSave() {
    if (!editing) return;
    if (!editing.id || !editing.name) { toast.error('ID e nome obrigatórios'); return; }
    startTransition(async () => {
      const r = await upsertPlanAction(editing as unknown as Record<string, unknown>);
      if (r.ok) { toast.success('Plano guardado'); setEditing(null); await refresh(); }
      else toast.error(r.error || 'Falhou');
    });
  }

  function handleDelete(plan: Plan) {
    if (!confirm(`Apagar plano "${plan.name}"? (Se em uso por alguma sub, será bloqueado e deves desactivar em vez de apagar)`)) return;
    startTransition(async () => {
      const r = await deletePlanAction(plan.id);
      if (r.ok) { toast.success('Apagado'); await refresh(); }
      else toast.error(r.error || 'Falhou');
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <AdminPageHeader
        backHref="/admin/billing"
        backLabel="Faturação"
        title="Planos"
        description="Define tiers com flat fee, per-seat, quotas, trial e features. Nada hardcoded."
        related={[
          { href: '/admin/billing/addons', label: 'Add-ons', emoji: '✨' },
          { href: '/admin/billing/assinaturas', label: 'Subscrições', emoji: '🔁' },
          { href: '/admin/billing/marketplace', label: 'Marketplace', emoji: '🛒' },
          { href: '/admin/payments', label: 'Pagamentos', emoji: '💳' },
        ]}
        actions={
          <button onClick={handleNew} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">
            <Plus className="h-3.5 w-3.5" /> Novo plano
          </button>
        }
      />

      {plans.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Sem planos definidos. Cria o primeiro tier para arrancar a vertente B2B.
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
              <div className="w-1.5 h-12 rounded" style={{ background: p.color || '#6366f1' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900">{p.name}</h3>
                  <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{p.id}</code>
                  {p.badge && <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{p.badge}</span>}
                  {!p.enabled && <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">desligado</span>}
                  {!p.public_visible && <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded inline-flex items-center gap-1"><EyeOff className="h-2.5 w-2.5" /> oculto</span>}
                </div>
                {p.tagline && <p className="text-xs text-slate-500 mt-0.5">{p.tagline}</p>}
                <div className="mt-2 text-xs text-slate-600 flex flex-wrap gap-3">
                  {p.flat_fee_monthly_cents != null && <span><strong>{(p.flat_fee_monthly_cents/100).toFixed(2)} {p.currency}</strong>/mês flat</span>}
                  {p.price_per_seat_monthly_cents != null && <span>+ <strong>{(p.price_per_seat_monthly_cents/100).toFixed(2)} {p.currency}</strong>/seat</span>}
                  {p.trial_days > 0 && <span className="text-emerald-700">{p.trial_days}d trial</span>}
                  {p.min_seats != null && <span>min {p.min_seats} seats</span>}
                  {p.max_seats != null && <span>máx {p.max_seats} seats</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(p)} className="text-xs px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 font-medium">Editar</button>
                <button onClick={() => handleDelete(p)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <PlanEditDialog plan={editing} setPlan={setEditing} onSave={handleSave} onCancel={() => setEditing(null)} isPending={isPending} />}
    </div>
  );
}

function PlanEditDialog({ plan, setPlan, onSave, onCancel, isPending }: { plan: Plan; setPlan: (p: Plan) => void; onSave: () => void; onCancel: () => void; isPending: boolean }) {
  function update<K extends keyof Plan>(key: K, value: Plan[K]) { setPlan({ ...plan, [key]: value }); }
  function updateQuota(k: string, v: number | null) { setPlan({ ...plan, quotas: { ...plan.quotas, [k]: v } }); }
  function updateOverage(k: string, v: number | null) { setPlan({ ...plan, overage_pricing: { ...plan.overage_pricing, [k]: v } }); }
  function updateFeature(k: string, v: boolean) { setPlan({ ...plan, features: { ...plan.features, [k]: v } }); }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">{plan.id ? 'Editar plano' : 'Novo plano'}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-md"><X className="h-4 w-4" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <Section title="Identificação">
            <Field label="ID*"><input type="text" value={plan.id} onChange={(e) => update('id', e.target.value)} placeholder="ex: starter" className="w-full text-sm font-mono px-2 py-1.5 rounded border border-slate-200 focus:border-brand-400 outline-none" /></Field>
            <Field label="Nome*"><input type="text" value={plan.name} onChange={(e) => update('name', e.target.value)} placeholder="ex: Starter" className="w-full text-sm px-2 py-1.5 rounded border border-slate-200 focus:border-brand-400 outline-none" /></Field>
            <Field label="Tagline"><input type="text" value={plan.tagline || ''} onChange={(e) => update('tagline', e.target.value)} placeholder="Para pequenas equipas" className="w-full text-sm px-2 py-1.5 rounded border border-slate-200 focus:border-brand-400 outline-none" /></Field>
            <Field label="Descrição"><textarea rows={2} value={plan.description || ''} onChange={(e) => update('description', e.target.value)} className="w-full text-sm px-2 py-1.5 rounded border border-slate-200 focus:border-brand-400 outline-none resize-none" /></Field>
            <Field label="Badge"><input type="text" value={plan.badge || ''} onChange={(e) => update('badge', e.target.value)} placeholder="Popular / Recomendado / —" className="w-full text-sm px-2 py-1.5 rounded border border-slate-200" /></Field>
            <Field label="Cor (hex)"><input type="text" value={plan.color || ''} onChange={(e) => update('color', e.target.value)} placeholder="#6366f1" className="w-full text-sm font-mono px-2 py-1.5 rounded border border-slate-200" /></Field>
            <Field label="Modelo">
              <select value={plan.billing_model} onChange={(e) => update('billing_model', e.target.value)} className="w-full text-sm px-2 py-1.5 rounded border border-slate-200 bg-white">
                <option value="subscription">Subscrição (recorrente)</option>
                <option value="payg">PAYG (pay-as-you-go)</option>
                <option value="hybrid">Híbrido (subscrição + PAYG)</option>
                <option value="custom">Custom (enterprise manual)</option>
              </select>
            </Field>
            <Field label="Moeda"><input type="text" value={plan.currency} onChange={(e) => update('currency', e.target.value.toUpperCase())} maxLength={3} className="w-full text-sm font-mono px-2 py-1.5 rounded border border-slate-200" /></Field>
            <Field label="Trial (dias) — 0 = sem trial"><input type="number" min={0} value={plan.trial_days} onChange={(e) => update('trial_days', parseInt(e.target.value) || 0)} className="w-full text-sm px-2 py-1.5 rounded border border-slate-200" /></Field>
            <Field label="Ordem na lista pública"><input type="number" value={plan.sort_order} onChange={(e) => update('sort_order', parseInt(e.target.value) || 0)} className="w-full text-sm px-2 py-1.5 rounded border border-slate-200" /></Field>
          </Section>

          <Section title="Preço (deixa NULL para não cobrar essa componente)">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Flat /mês (cents)"><NumberOrNull value={plan.flat_fee_monthly_cents} onChange={(v) => update('flat_fee_monthly_cents', v as any)} /></Field>
              <Field label="Flat /ano (cents)"><NumberOrNull value={plan.flat_fee_annual_cents} onChange={(v) => update('flat_fee_annual_cents', v as any)} /></Field>
              <Field label="Per-seat /mês (cents)"><NumberOrNull value={plan.price_per_seat_monthly_cents} onChange={(v) => update('price_per_seat_monthly_cents', v as any)} /></Field>
              <Field label="Per-seat /ano (cents)"><NumberOrNull value={plan.price_per_seat_annual_cents} onChange={(v) => update('price_per_seat_annual_cents', v as any)} /></Field>
              <Field label="Seats mínimo"><NumberOrNull value={plan.min_seats} onChange={(v) => update('min_seats', v as any)} /></Field>
              <Field label="Seats máximo"><NumberOrNull value={plan.max_seats} onChange={(v) => update('max_seats', v as any)} /></Field>
              <Field label="Desconto anual %"><NumberOrNull value={plan.annual_discount_pct} onChange={(v) => update('annual_discount_pct', v as any)} step="0.1" /></Field>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              💡 Exemplos: só flat → SaaS clássico · só per-seat → puro per-seat · ambos → flat+seat · só PAYG → preenche overage abaixo
            </div>
          </Section>

          <Section title="Quotas incluídas (NULL = ilimitado)">
            {QUOTA_KEYS.map(({ key, label }) => (
              <Field key={key} label={label}>
                <NumberOrNull value={plan.quotas[key] as number | undefined} onChange={(v) => updateQuota(key, v)} placeholder="ilimitado" />
              </Field>
            ))}
          </Section>

          <Section title="Overage / PAYG (cents por unidade extra, NULL = bloqueia overage)">
            {OVERAGE_KEYS.map(({ key, label }) => (
              <Field key={key} label={label}>
                <NumberOrNull value={plan.overage_pricing[key] as number | undefined} onChange={(v) => updateOverage(key, v)} placeholder="bloqueia overage" />
              </Field>
            ))}
          </Section>

          <Section title="Features incluídas">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {FEATURE_KEYS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer text-sm">
                  <input type="checkbox" checked={plan.features[key] === true} onChange={(e) => updateFeature(key, e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <span className="text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </Section>

          <Section title="Visibilidade">
            <label className="flex items-center gap-2 cursor-pointer text-sm py-1">
              <input type="checkbox" checked={plan.enabled} onChange={(e) => update('enabled', e.target.checked)} className="rounded border-slate-300 text-brand-600" />
              <span className="text-slate-700">Activo (orgs podem subscrever)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm py-1">
              <input type="checkbox" checked={plan.public_visible} onChange={(e) => update('public_visible', e.target.checked)} className="rounded border-slate-300 text-brand-600" />
              <span className="text-slate-700">Visível em /precos público</span>
            </label>
          </Section>
        </div>
        
        <div className="border-t border-slate-100 p-3 flex gap-2 justify-end">
          <button onClick={onCancel} disabled={isPending} className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">Cancelar</button>
          <button onClick={onSave} disabled={isPending} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-slate-600 block mb-1">{label}</label>
      {children}
    </div>
  );
}

function NumberOrNull({ value, onChange, placeholder, step }: { value?: number | null; onChange: (v: number | null) => void; placeholder?: string; step?: string }) {
  return (
    <input
      type="number" step={step || '1'}
      value={value == null ? '' : String(value)}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      placeholder={placeholder || ''}
      className="w-full text-sm font-mono px-2 py-1.5 rounded border border-slate-200 focus:border-brand-400 outline-none"
    />
  );
}
