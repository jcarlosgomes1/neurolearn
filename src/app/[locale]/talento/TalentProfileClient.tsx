'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Briefcase, Award, MapPin, Euro, Loader2, Save, Eye, EyeOff } from 'lucide-react';

interface Profile {
  available?: boolean; headline?: string; bio?: string; desired_roles?: string[];
  certified_skills?: string[]; years_experience?: number;
  location?: string; remote_ok?: boolean;
  desired_salary_min_cents?: number; desired_salary_max_cents?: number; currency?: string;
  hidden_from_current_org?: boolean;
}

export function TalentProfileClient({ initial }: { initial: { ok: boolean; profile: Profile | null; auto_certified_skills?: string[] } }) {
  const certified = initial.profile?.certified_skills || initial.auto_certified_skills || [];
  const [form, setForm] = useState<Profile>({
    available: initial.profile?.available || false,
    headline: initial.profile?.headline || '',
    bio: initial.profile?.bio || '',
    desired_roles: initial.profile?.desired_roles || [],
    years_experience: initial.profile?.years_experience || 0,
    location: initial.profile?.location || '',
    remote_ok: initial.profile?.remote_ok || false,
    desired_salary_min_cents: initial.profile?.desired_salary_min_cents,
    desired_salary_max_cents: initial.profile?.desired_salary_max_cents,
    currency: initial.profile?.currency || 'EUR',
    hidden_from_current_org: initial.profile?.hidden_from_current_org !== false,
  });
  const [rolesInput, setRolesInput] = useState((form.desired_roles || []).join(', '));
  const [isPending, startTransition] = useTransition();
  
  function handleSave() {
    startTransition(async () => {
      const sb = createClient();
      const roles = rolesInput.split(',').map((s) => s.trim()).filter(Boolean);
      const { data, error } = await sb.rpc('nl_talent_profile_upsert', {
        p_available: form.available, p_headline: form.headline, p_bio: form.bio,
        p_desired_roles: roles, p_years_experience: form.years_experience,
        p_location: form.location, p_remote_ok: form.remote_ok,
        p_desired_salary_min_cents: form.desired_salary_min_cents,
        p_desired_salary_max_cents: form.desired_salary_max_cents,
        p_currency: form.currency,
        p_hidden_from_current_org: form.hidden_from_current_org,
      });
      if (error || (data as any)?.ok === false) toast.error(error?.message || (data as any)?.error || 'Falhou');
      else toast.success('Perfil actualizado');
    });
  }
  
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-brand-600" /> O teu perfil para o talent marketplace
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Empresas vão poder ver-te quando tiverem vagas que casem com as tuas competências certificadas.
        </p>
      </div>
      
      {/* Available toggle */}
      <div className={`rounded-xl border p-4 ${form.available ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.available} onChange={(e) => setForm({...form, available: e.target.checked})}
            className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
          <div className="flex-1">
            <div className="font-semibold text-slate-900 flex items-center gap-2">
              {form.available ? <><Eye className="h-4 w-4 text-emerald-700" /> Disponível para oportunidades</> : <><EyeOff className="h-4 w-4 text-slate-500" /> Não disponível</>}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {form.available ? 'Empresas com vagas relevantes podem ver o teu perfil.' : 'Estás invisível no marketplace.'}
            </p>
          </div>
        </label>
      </div>
      
      {/* Skills certificadas */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-2"><Award className="h-4 w-4 text-amber-600" /> Competências certificadas</h3>
        {certified.length === 0 ? (
          <p className="text-sm text-slate-500">Ainda não tens certificados. Conclui cursos para construir o teu perfil de competências.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {certified.map((s, i) => <span key={i} className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">{s}</span>)}
          </div>
        )}
        <p className="text-xs text-slate-400 mt-2">As tuas skills certificadas atualizam-se automaticamente sempre que obténs um certificado.</p>
      </div>
      
      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <Field label="Título profissional">
          <input type="text" value={form.headline || ''} onChange={(e) => setForm({...form, headline: e.target.value})}
            placeholder="Ex: Full-stack developer com 5 anos em React" className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-400 outline-none" />
        </Field>
        <Field label="Bio (opcional)">
          <textarea rows={3} value={form.bio || ''} onChange={(e) => setForm({...form, bio: e.target.value})}
            className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 resize-none focus:border-brand-400 outline-none" />
        </Field>
        <Field label="Roles desejadas (separadas por vírgula)">
          <input type="text" value={rolesInput} onChange={(e) => setRolesInput(e.target.value)}
            placeholder="Senior Engineer, Tech Lead, Architect" className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-400 outline-none" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Anos experiência">
            <input type="number" min={0} value={form.years_experience || 0} onChange={(e) => setForm({...form, years_experience: Number(e.target.value)})}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200" />
          </Field>
          <Field label="Localização">
            <input type="text" value={form.location || ''} onChange={(e) => setForm({...form, location: e.target.value})}
              placeholder="Lisboa, Portugal" className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200" />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.remote_ok || false} onChange={(e) => setForm({...form, remote_ok: e.target.checked})} className="rounded" />
          <span className="text-slate-700">Aberto a trabalho remoto</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Salário mínimo (cents)">
            <input type="number" value={form.desired_salary_min_cents || ''} onChange={(e) => setForm({...form, desired_salary_min_cents: e.target.value === '' ? undefined : Number(e.target.value)})}
              placeholder="ex: 3500000 = 35k EUR" className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-slate-200" />
          </Field>
          <Field label="Salário máximo (cents)">
            <input type="number" value={form.desired_salary_max_cents || ''} onChange={(e) => setForm({...form, desired_salary_max_cents: e.target.value === '' ? undefined : Number(e.target.value)})}
              placeholder="ex: 5000000 = 50k EUR" className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-slate-200" />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer pt-2 border-t border-slate-100">
          <input type="checkbox" checked={form.hidden_from_current_org !== false} onChange={(e) => setForm({...form, hidden_from_current_org: e.target.checked})} className="rounded" />
          <span className="text-slate-700">Esconder o meu perfil da empresa onde estou actualmente</span>
        </label>
      </div>
      
      <button onClick={handleSave} disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:opacity-90 text-white font-semibold disabled:opacity-50">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar perfil
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-slate-600 block mb-1">{label}</label>{children}</div>;
}
