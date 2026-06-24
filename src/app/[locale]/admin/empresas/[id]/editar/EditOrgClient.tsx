'use client';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useState, useTransition } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { updateOrgBasicAction, updateOrgFeaturesAction } from '../../actions';
import { ArrowLeft, Save, Loader2, CheckCircle } from 'lucide-react';

const PLANS = ['trial', 'starter', 'growth', 'enterprise'];

export function EditOrgClient({ orgId, org, features: initialFeatures }: { orgId: string; org: any; features: any }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState(org.name);
  const [plan, setPlan] = useState(org.plan);
  const [seats, setSeats] = useState(org.seats_purchased || 0);
  const [country, setCountry] = useState(org.country_code || '');
  
  const [features, setFeatures] = useState({
    enable_lms: !!initialFeatures?.enable_lms,
    enable_courses_ai: !!initialFeatures?.enable_courses_ai,
    enable_marketplace_b2c: !!initialFeatures?.enable_marketplace_b2c,
    enable_talent_hire: !!initialFeatures?.enable_talent_hire,
    enable_instructor_corporate: !!initialFeatures?.enable_instructor_corporate,
    enable_live_sync: !!initialFeatures?.enable_live_sync,
    enable_white_label: !!initialFeatures?.enable_white_label,
    enable_sso_saml: !!initialFeatures?.enable_sso_saml,
    enable_api_access: !!initialFeatures?.enable_api_access,
    max_marketplace_seats: initialFeatures?.max_marketplace_seats ?? 0,
    max_instructor_hires_per_month: initialFeatures?.max_instructor_hires_per_month ?? 0,
    max_talent_hires_per_year: initialFeatures?.max_talent_hires_per_year ?? 0,
    custom_revshare_pct: initialFeatures?.custom_revshare_pct ?? null,
    notes: initialFeatures?.notes ?? '',
  });

  async function saveBasic() {
    setError(null); setSaved(null);
    startTransition(async () => {
      const r = await updateOrgBasicAction(orgId, { name, plan, seats_purchased: seats, country_code: country });
      if (r.ok) setSaved('Info básica guardada');
      else setError(r.error || 'erro');
    });
  }

  async function saveFeatures() {
    setError(null); setSaved(null);
    startTransition(async () => {
      const r = await updateOrgFeaturesAction(orgId, features);
      if (r.ok) setSaved('Features guardadas');
      else setError(r.error || 'erro');
    });
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
      <Link href={`/admin/empresas/${orgId}` as any} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar aos detalhes
      </Link>
      <AdminPageHeader title={`Editar ${org.name}`} />
      
      {saved && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> {saved}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Info básica */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-4">
        <h2 className="font-semibold text-slate-900 mb-4">Informação básica</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Plano</label>
              <select value={plan} onChange={(e) => setPlan(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Seats</label>
              <input type="number" value={seats} onChange={(e) => setSeats(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">País (ISO)</label>
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" maxLength={2} />
            </div>
          </div>
          <button onClick={saveBasic} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar info
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-4">
        <h2 className="font-semibold text-slate-900 mb-4">Módulos & Limites</h2>
        <div className="space-y-2">
          {([
            ['enable_lms', '📚 LMS interno'],
            ['enable_courses_ai', '✨ Gerar cursos com IA'],
            ['enable_marketplace_b2c', '🛒 Marketplace B2C (subscrever cursos)'],
            ['enable_talent_hire', '🎓 Contratar talento certificado'],
            ['enable_instructor_corporate', '👨‍🏫 Contratar instrutores corporate'],
            ['enable_live_sync', '📡 Eventos sync/presenciais'],
            ['enable_white_label', '🎨 White-label (custom domain)'],
            ['enable_sso_saml', '🔐 SSO SAML/OIDC'],
            ['enable_api_access', '🔌 API pública'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
              <input type="checkbox" checked={(features as any)[key]}
                onChange={(e) => setFeatures({ ...features, [key]: e.target.checked })} />
              <span className="text-sm text-slate-900">{label}</span>
            </label>
          ))}
        </div>
        
        <div className="grid sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Max marketplace seats</label>
            <input type="number" value={features.max_marketplace_seats}
              onChange={(e) => setFeatures({ ...features, max_marketplace_seats: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" min="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Max instructor hires/mês</label>
            <input type="number" value={features.max_instructor_hires_per_month}
              onChange={(e) => setFeatures({ ...features, max_instructor_hires_per_month: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" min="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Max talent hires/ano</label>
            <input type="number" value={features.max_talent_hires_per_year}
              onChange={(e) => setFeatures({ ...features, max_talent_hires_per_year: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" min="0" />
          </div>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Custom revshare % (override)</label>
            <input type="number" value={features.custom_revshare_pct ?? ''} 
              onChange={(e) => setFeatures({ ...features, custom_revshare_pct: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" 
              placeholder="Default platform" step="0.1" min="0" max="100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notas</label>
            <input type="text" value={features.notes} onChange={(e) => setFeatures({ ...features, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="…" />
          </div>
        </div>
        
        <button onClick={saveFeatures} disabled={pending}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar features
        </button>
      </div>
    </div>
  );
}
