'use client';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { createOrgAction } from '../actions';
import { ArrowLeft, Building2, CheckCircle, Loader2 } from 'lucide-react';

const PLANS = [
  { id: 'trial', label: 'Trial', desc: 'Período experimental gratuito' },
  { id: 'starter', label: 'Starter', desc: 'Equipas pequenas (até 50 seats)' },
  { id: 'growth', label: 'Growth', desc: 'Empresas em expansão (até 500 seats)' },
  { id: 'enterprise', label: 'Enterprise', desc: 'Custom + SSO + suporte dedicado' },
];

interface FeatureFlags {
  enable_lms: boolean;
  enable_courses_ai: boolean;
  enable_marketplace_b2c: boolean;
  enable_talent_hire: boolean;
  enable_instructor_corporate: boolean;
  enable_live_sync: boolean;
  enable_white_label: boolean;
  enable_sso_saml: boolean;
  enable_api_access: boolean;
  max_marketplace_seats: number;
  max_instructor_hires_per_month: number;
  max_talent_hires_per_year: number;
}

const FEATURE_PRESETS: Record<string, Partial<FeatureFlags>> = {
  trial: { enable_lms: true, enable_courses_ai: true, max_marketplace_seats: 0, max_instructor_hires_per_month: 0 },
  starter: { enable_lms: true, enable_courses_ai: true, enable_marketplace_b2c: true, max_marketplace_seats: 50 },
  growth: { enable_lms: true, enable_courses_ai: true, enable_marketplace_b2c: true, enable_talent_hire: true, enable_instructor_corporate: true, enable_live_sync: true, max_marketplace_seats: 500, max_instructor_hires_per_month: 5, max_talent_hires_per_year: 20 },
  enterprise: { enable_lms: true, enable_courses_ai: true, enable_marketplace_b2c: true, enable_talent_hire: true, enable_instructor_corporate: true, enable_live_sync: true, enable_white_label: true, enable_sso_saml: true, enable_api_access: true, max_marketplace_seats: 5000, max_instructor_hires_per_month: 50, max_talent_hires_per_year: 200 },
};

export function NovaEmpresaWizard({ locale }: { locale: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  
  // Step 1: básico
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [plan, setPlan] = useState('trial');
  const [country, setCountry] = useState('');
  const [seats, setSeats] = useState(0);
  const [trialDays, setTrialDays] = useState(14);
  const [notes, setNotes] = useState('');
  
  // Step 2: features
  const [features, setFeatures] = useState<FeatureFlags>({
    enable_lms: true,
    enable_courses_ai: true,
    enable_marketplace_b2c: false,
    enable_talent_hire: false,
    enable_instructor_corporate: false,
    enable_live_sync: false,
    enable_white_label: false,
    enable_sso_saml: false,
    enable_api_access: false,
    max_marketplace_seats: 0,
    max_instructor_hires_per_month: 0,
    max_talent_hires_per_year: 0,
  });

  function autoSlug(n: string) {
    return n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  }

  function applyPreset(planId: string) {
    setPlan(planId);
    const preset = FEATURE_PRESETS[planId];
    if (preset) setFeatures((prev) => ({ ...prev, ...preset } as FeatureFlags));
  }

  function next() {
    setError(null);
    if (step === 1) {
      if (!name.trim() || name.length < 2) return setError('Nome obrigatório (min 2 chars)');
      if (!slug.match(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)) return setError('Slug inválido (apenas letras minúsculas, números, hífens)');
      if (!ownerEmail.match(/^[^@]+@[^@]+\.[^@]+$/)) return setError('Email do owner inválido');
    }
    setStep(step + 1);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await createOrgAction({
        name: name.trim(),
        slug: slug.trim(),
        owner_email: ownerEmail.trim().toLowerCase(),
        plan,
        country_code: country || undefined,
        seats_purchased: seats,
        trial_days: trialDays,
        features: features as any,
        notes: notes || undefined,
      });
      if (r.ok) {
        setCreatedSlug(r.slug);
        setStep(4);
      } else {
        setError(r.error || 'erro desconhecido');
      }
    });
  }

  if (step === 4 && createdSlug) {
    return (
      <div className="px-4 sm:px-6 py-12 max-w-2xl mx-auto">
        <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <p className="text-2xl font-bold text-slate-900 mb-2">Empresa criada com sucesso</p>
          <p className="text-slate-600 mb-6">
            <strong>{name}</strong> está pronta. {ownerEmail} {createdSlug ? 'foi adicionado/a como owner' : 'recebeu invitation pendente'}.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href={'/admin/empresas' as any}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
              Ver todas as empresas
            </Link>
            <Link href={`/empresa/${createdSlug}` as any}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">
              Abrir workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
      <AdminPageHeader backHref="/admin/empresas" backLabel="Voltar" title="Criar Empresa" />
      
      {/* Steps progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`flex-1 h-1.5 rounded-full ${step >= n ? 'bg-brand-500' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-900 text-lg">1. Informação básica</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome da empresa</label>
              <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(autoSlug(e.target.value)); }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Acme Corp" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
              <div className="flex items-center">
                <span className="text-sm text-slate-500 px-3 py-2 bg-slate-50 border border-r-0 border-slate-200 rounded-l-lg">/empresa/</span>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-r-lg" placeholder="acme-corp" />
              </div>
              <p className="text-xs text-slate-500 mt-1">Apenas letras minúsculas, números, hífens. Não alterável depois.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email do owner</label>
              <input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="ceo@acme.com" />
              <p className="text-xs text-slate-500 mt-1">Se já está registado, é adicionado de imediato. Se não, recebe invitation.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">País (ISO 2)</label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="PT" maxLength={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notas internas</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Cliente strategic, etc." />
              </div>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-900 text-lg">2. Plano + Trial</h2>
            <div className="space-y-2">
              {PLANS.map((p) => (
                <button key={p.id} type="button" onClick={() => applyPreset(p.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${plan === p.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{p.label}</div>
                      <div className="text-xs text-slate-500">{p.desc}</div>
                    </div>
                    {plan === p.id && <CheckCircle className="h-5 w-5 text-brand-600" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Seats incluídos</label>
                <input type="number" value={seats} onChange={(e) => setSeats(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dias de trial</label>
                <input type="number" value={trialDays} onChange={(e) => setTrialDays(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" min="0" />
              </div>
            </div>
          </div>
        )}
        
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-900 text-lg">3. Módulos disponíveis</h2>
            <p className="text-sm text-slate-500">Quais serviços esta empresa tem acesso. Podes ajustar depois.</p>
            
            <div className="space-y-2">
              {([
                ['enable_lms', '📚 LMS interno', 'Criar e gerir cursos próprios + alunos'],
                ['enable_courses_ai', '✨ Gerar cursos com IA', 'Upload PDFs/vídeos → curso gerado'],
                ['enable_marketplace_b2c', '🛒 Marketplace B2C', 'Subscrever cursos públicos para a equipa'],
                ['enable_talent_hire', '🎓 Contratar talento', 'Acesso a alunos certificados para vagas'],
                ['enable_instructor_corporate', '👨‍🏫 Instrutores corporate', 'Contratar instrutores para formações custom (sync/presencial)'],
                ['enable_live_sync', '📡 Eventos sync', 'Sessões live, vídeo, presencial'],
                ['enable_white_label', '🎨 White-label', 'Custom domain + branding completo'],
                ['enable_sso_saml', '🔐 SSO SAML/OIDC', 'Autenticação corporate'],
                ['enable_api_access', '🔌 API pública', 'Integração programática'],
              ] as const).map(([key, label, desc]) => (
                <label key={key} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={(features as any)[key]} 
                    onChange={(e) => setFeatures({ ...features, [key]: e.target.checked })}
                    className="mt-1" />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 text-sm">{label}</div>
                    <div className="text-xs text-slate-500">{desc}</div>
                  </div>
                </label>
              ))}
            </div>
            
            <div className="pt-2 grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Max marketplace seats</label>
                <input type="number" value={features.max_marketplace_seats} 
                  onChange={(e) => setFeatures({ ...features, max_marketplace_seats: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" min="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Max instructor hires/mês</label>
                <input type="number" value={features.max_instructor_hires_per_month} 
                  onChange={(e) => setFeatures({ ...features, max_instructor_hires_per_month: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" min="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Max talent hires/ano</label>
                <input type="number" value={features.max_talent_hires_per_year} 
                  onChange={(e) => setFeatures({ ...features, max_talent_hires_per_year: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" min="0" />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}
      
      <div className="mt-6 flex items-center justify-between">
        <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium disabled:opacity-50">
          ← Anterior
        </button>
        {step < 3 ? (
          <button onClick={next}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium">
            Próximo →
          </button>
        ) : (
          <button onClick={submit} disabled={pending}
            className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? 'A criar…' : 'Criar Empresa'}
          </button>
        )}
      </div>
    </div>
  );
}
