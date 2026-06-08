'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Save, Sparkles, Shield, GraduationCap, BookOpen, Users, ShoppingBag, Video, Globe, Key, Briefcase } from 'lucide-react';

interface FeaturesShape {
  enable_lms?: boolean; enable_courses_ai?: boolean; enable_marketplace_b2c?: boolean;
  enable_talent_hire?: boolean; enable_instructor_corporate?: boolean; enable_live_sync?: boolean;
  enable_white_label?: boolean; enable_sso_saml?: boolean; enable_api_access?: boolean;
  max_marketplace_seats?: number; max_instructor_hires_per_month?: number;
  max_talent_hires_per_year?: number; custom_revshare_pct?: number; notes?: string;
}

const TOGGLES: Array<{ key: keyof FeaturesShape; icon: any; title: string; desc: string; accent: string; default: boolean }> = [
  { key: 'enable_lms', icon: GraduationCap, title: 'LMS interno', desc: 'Plataforma de aprendizagem para colaboradores da empresa', accent: 'from-violet-500 to-indigo-600', default: true },
  { key: 'enable_courses_ai', icon: Sparkles, title: 'Cursos gerados por IA', desc: 'Empresa pode ingerir docs e gerar cursos via IA', accent: 'from-emerald-500 to-teal-600', default: true },
  { key: 'enable_marketplace_b2c', icon: ShoppingBag, title: 'Marketplace B2C', desc: 'Acesso ao catálogo público de cursos com seats compartilhados', accent: 'from-amber-500 to-orange-600', default: false },
  { key: 'enable_talent_hire', icon: Users, title: 'Talent hiring', desc: 'Aceder a alunos certificados para contratar', accent: 'from-blue-500 to-cyan-600', default: false },
  { key: 'enable_instructor_corporate', icon: BookOpen, title: 'Contratar instrutores', desc: 'Pedir serviços corporativos a instrutores certificados', accent: 'from-fuchsia-500 to-pink-600', default: false },
  { key: 'enable_live_sync', icon: Video, title: 'Aulas síncronas', desc: 'Cal-style booking + Daily.co rooms para formação live', accent: 'from-rose-500 to-red-600', default: false },
  { key: 'enable_white_label', icon: Globe, title: 'White-label', desc: 'Domínio próprio, branding completo, emails customizados', accent: 'from-slate-700 to-slate-900', default: false },
  { key: 'enable_sso_saml', icon: Shield, title: 'SSO / SAML', desc: 'Login federado via Okta, Azure AD, Google Workspace', accent: 'from-indigo-500 to-violet-600', default: false },
  { key: 'enable_api_access', icon: Key, title: 'API access', desc: 'Tokens API para integrar dados com sistemas internos', accent: 'from-orange-500 to-amber-600', default: false },
];

export function FeaturesClient({ orgId, initial }: { orgId: string; initial: FeaturesShape }) {
  const [form, setForm] = useState<FeaturesShape>({
    enable_lms: initial.enable_lms ?? true,
    enable_courses_ai: initial.enable_courses_ai ?? true,
    enable_marketplace_b2c: initial.enable_marketplace_b2c ?? false,
    enable_talent_hire: initial.enable_talent_hire ?? false,
    enable_instructor_corporate: initial.enable_instructor_corporate ?? false,
    enable_live_sync: initial.enable_live_sync ?? false,
    enable_white_label: initial.enable_white_label ?? false,
    enable_sso_saml: initial.enable_sso_saml ?? false,
    enable_api_access: initial.enable_api_access ?? false,
    max_marketplace_seats: initial.max_marketplace_seats ?? undefined,
    max_instructor_hires_per_month: initial.max_instructor_hires_per_month ?? undefined,
    max_talent_hires_per_year: initial.max_talent_hires_per_year ?? undefined,
    custom_revshare_pct: initial.custom_revshare_pct ?? undefined,
    notes: initial.notes ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  function set<K extends keyof FeaturesShape>(key: K, value: FeaturesShape[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  async function save() {
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_org_features_set', {
        p_org_id: orgId,
        p_features: {
          ...form,
          max_marketplace_seats: form.max_marketplace_seats == null ? '' : String(form.max_marketplace_seats),
          max_instructor_hires_per_month: form.max_instructor_hires_per_month == null ? '' : String(form.max_instructor_hires_per_month),
          max_talent_hires_per_year: form.max_talent_hires_per_year == null ? '' : String(form.max_talent_hires_per_year),
          custom_revshare_pct: form.custom_revshare_pct == null ? '' : String(form.custom_revshare_pct),
        },
      });
      if (error) throw error;
      toast.success('Funcionalidades guardadas');
      setDirty(false);
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Module toggles */}
      <div className="grid gap-3 sm:grid-cols-2">
        {TOGGLES.map(({ key, icon: Icon, title, desc, accent }) => {
          const enabled = !!(form as any)[key];
          return (
            <button
              key={key as string}
              onClick={() => set(key, !enabled as any)}
              className={`text-left bg-white rounded-2xl border p-4 hover:shadow-md transition-all ${enabled ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${accent} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`inline-flex items-center h-5 w-9 rounded-full p-0.5 transition-colors ${enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                  <span className={`h-4 w-4 bg-white rounded-full shadow-sm transform transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </span>
              </div>
              <div className="font-semibold text-sm text-slate-900 mt-3">{title}</div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
            </button>
          );
        })}
      </div>

      {/* Limits */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold text-sm text-slate-900 mb-4 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-slate-500" /> Limites e revenue share
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField label="Seats marketplace (B2C)" value={form.max_marketplace_seats} onChange={(v) => set('max_marketplace_seats', v as any)} />
          <NumberField label="Contratações instrutor / mês" value={form.max_instructor_hires_per_month} onChange={(v) => set('max_instructor_hires_per_month', v as any)} />
          <NumberField label="Contratações talent / ano" value={form.max_talent_hires_per_year} onChange={(v) => set('max_talent_hires_per_year', v as any)} />
          <NumberField label="Revenue share % (custom)" value={form.custom_revshare_pct} onChange={(v) => set('custom_revshare_pct', v as any)} step={0.1} />
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Notas internas</label>
          <textarea
            value={form.notes || ''}
            onChange={(e) => set('notes', e.target.value as any)}
            rows={3}
            placeholder="Acordos especiais, exceções, datas-chave…"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
        </div>
      </div>

      {/* Save bar sticky bottom */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-2xl p-3 flex items-center justify-between">
        <div className="text-xs text-slate-500 px-2">
          {dirty ? <span className="text-amber-600 font-medium">Alterações por guardar</span> : 'Sem alterações pendentes'}
        </div>
        <button
          onClick={save}
          disabled={busy || !dirty}
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
          <Save className="h-3.5 w-3.5" /> {busy ? 'A guardar…' : 'Guardar configuração'}
        </button>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, step = 1 }: { label: string; value?: number; onChange: (v: number | undefined) => void; step?: number }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700 mb-1 block">{label}</label>
      <input
        type="number"
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        placeholder="Sem limite"
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
    </div>
  );
}
