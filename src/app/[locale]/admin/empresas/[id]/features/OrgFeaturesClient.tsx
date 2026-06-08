'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Save, Loader2, GraduationCap, Sparkles, ShoppingBag, Briefcase, Handshake, Calendar, Palette, ShieldCheck, Code, Users, Building2, FileText } from 'lucide-react';

interface Features {
  enable_lms?: boolean;
  enable_courses_ai?: boolean;
  enable_marketplace_b2c?: boolean;
  enable_talent_hire?: boolean;
  enable_instructor_corporate?: boolean;
  enable_live_sync?: boolean;
  enable_white_label?: boolean;
  enable_sso_saml?: boolean;
  enable_api_access?: boolean;
  max_marketplace_seats?: number;
  max_instructor_hires_per_month?: number;
  max_talent_hires_per_year?: number;
  custom_revshare_pct?: number | null;
  notes?: string | null;
}

const FEATURES = [
  { k: 'enable_lms',                  icon: GraduationCap, cls: 'from-emerald-500 to-teal-600',  label: 'LMS interno',                   desc: 'Plataforma de aprendizagem para colaboradores da empresa.' },
  { k: 'enable_courses_ai',           icon: Sparkles,      cls: 'from-violet-500 to-indigo-600', label: 'Geração inteligente de cursos', desc: 'Permite criar cursos automaticamente a partir de documentos da empresa.' },
  { k: 'enable_marketplace_b2c',      icon: ShoppingBag,   cls: 'from-amber-500 to-orange-600',  label: 'Marketplace B2C',               desc: 'Compra cursos do marketplace público e distribui aos colaboradores.' },
  { k: 'enable_talent_hire',          icon: Briefcase,     cls: 'from-rose-500 to-pink-600',     label: 'Marketplace talento',           desc: 'Procura e contrata candidatos certificados na plataforma.' },
  { k: 'enable_instructor_corporate', icon: Handshake,     cls: 'from-blue-500 to-cyan-600',     label: 'Serviços de instrutores',       desc: 'Contrata workshops, formações e mentorias diretamente com instrutores.' },
  { k: 'enable_live_sync',            icon: Calendar,      cls: 'from-fuchsia-500 to-pink-600',  label: 'Aulas ao vivo',                 desc: 'Sessões síncronas via Daily.co para a equipa.' },
  { k: 'enable_white_label',          icon: Palette,       cls: 'from-purple-500 to-violet-600', label: 'White-label',                   desc: 'Logo, cores e domínio próprios.' },
  { k: 'enable_sso_saml',             icon: ShieldCheck,   cls: 'from-slate-700 to-slate-900',   label: 'SSO + SAML',                    desc: 'Single sign-on via Microsoft Entra, Okta, Google Workspace.' },
  { k: 'enable_api_access',           icon: Code,          cls: 'from-sky-500 to-blue-600',      label: 'API + SCIM',                    desc: 'Acesso à API da plataforma + provisionamento automático de utilizadores.' },
];

const LIMITS = [
  { k: 'max_marketplace_seats',          icon: Users,      label: 'Máx. seats marketplace',     desc: 'Total de lugares que a empresa pode adquirir.' },
  { k: 'max_instructor_hires_per_month', icon: Building2,  label: 'Máx. contratações/mês',      desc: 'Limite de pedidos B2B a instrutores por mês.' },
  { k: 'max_talent_hires_per_year',      icon: Briefcase,  label: 'Máx. contratações talento/ano', desc: 'Limite de colocações via marketplace talento por ano.' },
];

export function OrgFeaturesClient({ orgId, orgName, orgPlan, initial }: {
  orgId: string; orgName: string; orgPlan: string; initial: Features;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Features>({
    enable_lms: initial.enable_lms ?? true,
    enable_courses_ai: initial.enable_courses_ai ?? true,
    enable_marketplace_b2c: initial.enable_marketplace_b2c ?? true,
    enable_talent_hire: initial.enable_talent_hire ?? false,
    enable_instructor_corporate: initial.enable_instructor_corporate ?? false,
    enable_live_sync: initial.enable_live_sync ?? false,
    enable_white_label: initial.enable_white_label ?? false,
    enable_sso_saml: initial.enable_sso_saml ?? false,
    enable_api_access: initial.enable_api_access ?? false,
    max_marketplace_seats: initial.max_marketplace_seats ?? 0,
    max_instructor_hires_per_month: initial.max_instructor_hires_per_month ?? 0,
    max_talent_hires_per_year: initial.max_talent_hires_per_year ?? 0,
    custom_revshare_pct: initial.custom_revshare_pct ?? null,
    notes: initial.notes ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  function set<K extends keyof Features>(k: K, v: Features[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    setDirty(true);
  }

  async function save() {
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_org_features_set', { p_org_id: orgId, p_data: form });
      if (error) throw error;
      toast.success('Funcionalidades guardadas');
      setDirty(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao guardar');
    } finally { setBusy(false); }
  }

  function applyPreset(preset: 'trial' | 'starter' | 'pro' | 'enterprise') {
    const presets: Record<string, Partial<Features>> = {
      trial: {
        enable_lms: true, enable_courses_ai: false, enable_marketplace_b2c: true,
        enable_talent_hire: false, enable_instructor_corporate: false, enable_live_sync: false,
        enable_white_label: false, enable_sso_saml: false, enable_api_access: false,
        max_marketplace_seats: 5, max_instructor_hires_per_month: 0, max_talent_hires_per_year: 0,
      },
      starter: {
        enable_lms: true, enable_courses_ai: true, enable_marketplace_b2c: true,
        enable_talent_hire: false, enable_instructor_corporate: false, enable_live_sync: false,
        enable_white_label: false, enable_sso_saml: false, enable_api_access: false,
        max_marketplace_seats: 50, max_instructor_hires_per_month: 2, max_talent_hires_per_year: 0,
      },
      pro: {
        enable_lms: true, enable_courses_ai: true, enable_marketplace_b2c: true,
        enable_talent_hire: true, enable_instructor_corporate: true, enable_live_sync: true,
        enable_white_label: true, enable_sso_saml: false, enable_api_access: false,
        max_marketplace_seats: 250, max_instructor_hires_per_month: 10, max_talent_hires_per_year: 25,
      },
      enterprise: {
        enable_lms: true, enable_courses_ai: true, enable_marketplace_b2c: true,
        enable_talent_hire: true, enable_instructor_corporate: true, enable_live_sync: true,
        enable_white_label: true, enable_sso_saml: true, enable_api_access: true,
        max_marketplace_seats: 5000, max_instructor_hires_per_month: 50, max_talent_hires_per_year: 200,
      },
    };
    setForm((p) => ({ ...p, ...presets[preset] }));
    setDirty(true);
    toast.success(`Preset "${preset}" aplicado — confirma e guarda`);
  }

  const activeCount = FEATURES.filter((f) => (form as any)[f.k]).length;

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 border border-violet-200 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-violet-600">{orgName} · Plano {orgPlan}</div>
          <div className="font-semibold text-sm text-slate-900 mt-0.5">{activeCount} de {FEATURES.length} funcionalidades activas</div>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Preset:</span>
          {(['trial','starter','pro','enterprise'] as const).map((p) => (
            <button key={p} onClick={() => applyPreset(p)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-violet-50 hover:border-violet-300 text-slate-700 hover:text-violet-700 capitalize">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <section className="grid sm:grid-cols-2 gap-3">
        {FEATURES.map(({ k, icon: Icon, cls, label, desc }) => {
          const active = !!(form as any)[k];
          return (
            <label key={k} className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${active ? 'border-violet-300' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm ${active ? `bg-gradient-to-br ${cls}` : 'bg-slate-200 text-slate-400'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900">{label}</div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
                <input type="checkbox" checked={active} onChange={(e) => set(k as keyof Features, e.target.checked as any)}
                  className="h-5 w-5 rounded text-violet-600 mt-0.5 flex-shrink-0 cursor-pointer" />
              </div>
            </label>
          );
        })}
      </section>

      {/* Limites */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-sm text-slate-900">Limites do plano</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Define quotas máximas. Usar 0 para desactivar essa quota.</p>
        </header>
        <div className="p-5 grid sm:grid-cols-3 gap-4">
          {LIMITS.map(({ k, icon: Icon, label, desc }) => (
            <div key={k}>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                <Icon className="h-3 w-3" /> {label}
              </label>
              <input type="number" min="0" value={(form as any)[k] ?? 0}
                onChange={(e) => set(k as keyof Features, Number(e.target.value) as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 outline-none" />
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Revshare + notes */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-sm text-slate-900">Acordo comercial</h2>
        </header>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
              <FileText className="h-3 w-3" /> Revshare custom (%)
            </label>
            <input type="number" min="0" max="100" step="0.5" value={form.custom_revshare_pct ?? ''}
              onChange={(e) => set('custom_revshare_pct', e.target.value ? Number(e.target.value) : null)}
              placeholder="Deixar vazio = revshare standard"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 outline-none" />
            <p className="text-[10px] text-slate-400 mt-1">Percentagem que a empresa retém em contratações de talento via marketplace. Vazio usa o standard global.</p>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Notas internas</label>
            <textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={3}
              placeholder="Notas comerciais, exceções negociadas, contactos..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 outline-none resize-y" />
          </div>
        </div>
      </section>

      {/* Sticky save */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-2xl p-3 flex items-center justify-between">
        <div className="text-xs text-slate-500 px-2">
          {dirty ? <span className="text-amber-600 font-medium">Alterações por guardar</span> : 'Sem alterações'}
        </div>
        <button onClick={save} disabled={busy || !dirty}
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar configuração
        </button>
      </div>
    </div>
  );
}
