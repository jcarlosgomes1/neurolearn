'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useRouter } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Save, X, Plus, Briefcase, MapPin, Globe, Award, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { TalentCatalogSkills } from '@/components/skills/TalentCatalogSkills';

interface Profile {
  available?: boolean; headline?: string; bio?: string;
  desired_roles?: string[]; certified_skills?: string[];
  years_experience?: number; location?: string; remote_ok?: boolean;
  desired_salary_min_cents?: number; desired_salary_max_cents?: number; currency?: string;
  hidden_from_current_org?: boolean;
}

export function TalentClient({ initial }: { initial: Profile }) {
  const t = useTranslations();
  const router = useRouter();
  const [form, setForm] = useState<Profile>({
    available: initial.available ?? false,
    headline: initial.headline || '',
    bio: initial.bio || '',
    desired_roles: initial.desired_roles || [],
    certified_skills: initial.certified_skills || [],
    years_experience: initial.years_experience || undefined,
    location: initial.location || '',
    remote_ok: initial.remote_ok ?? false,
    desired_salary_min_cents: initial.desired_salary_min_cents || undefined,
    desired_salary_max_cents: initial.desired_salary_max_cents || undefined,
    currency: initial.currency || 'EUR',
    hidden_from_current_org: initial.hidden_from_current_org ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [roleInput, setRoleInput] = useState('');
  const [skillInput, setSkillInput] = useState('');

  function set<K extends keyof Profile>(k: K, v: Profile[K]) { setForm((p) => ({ ...p, [k]: v })); setDirty(true); }
  function addTag(field: 'desired_roles' | 'certified_skills', value: string, setter: (v: string) => void) {
    const v = value.trim();
    if (!v) return;
    set(field, [...(form[field] || []), v]);
    setter('');
  }
  function removeTag(field: 'desired_roles' | 'certified_skills', idx: number) {
    set(field, (form[field] || []).filter((_, i) => i !== idx));
  }

  async function save() {
    setBusy(true);
    try {
      const sb = createClient();
      const payload: any = { ...form };
      // Convert salary fields if user entered euros instead of cents
      if (typeof payload.desired_salary_min_cents === 'number' && payload.desired_salary_min_cents < 10000) {
        // Assume euros, convert
        payload.desired_salary_min_cents = Math.round(payload.desired_salary_min_cents * 100);
      }
      if (typeof payload.desired_salary_max_cents === 'number' && payload.desired_salary_max_cents < 10000) {
        payload.desired_salary_max_cents = Math.round(payload.desired_salary_max_cents * 100);
      }
      assertNotPeekClient();
      const { error } = await sb.rpc('nl_my_talent_profile_upsert', { p_data: payload });
      if (error) throw error;
      toast.success(t('talent.saved'));
      setDirty(false);
      router.refresh();
    } catch (e: any) { toast.error(e?.message || t('talent.error')); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      {/* Disponibilidade */}
      <section className={`rounded-2xl p-5 border-2 transition-colors ${form.available ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm ${form.available ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">{t('talent.available_title')}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{form.available ? t('talent.available_on') : t('talent.available_off')}</p>
            </div>
          </div>
          <input type="checkbox" checked={!!form.available} onChange={(e) => set('available', e.target.checked)}
            className="h-5 w-5 rounded text-emerald-600 cursor-pointer" />
        </label>
      </section>

      {/* Resumo */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center shadow-sm"><Briefcase className="h-4 w-4" /></div>
          <h2 className="font-semibold text-sm text-slate-900">{t('talent.summary_title')}</h2>
        </header>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">{t('talent.headline_label')}</label>
            <input value={form.headline || ''} onChange={(e) => set('headline', e.target.value)} placeholder={t('talent.headline_ph')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">{t('talent.bio_label')}</label>
            <textarea value={form.bio || ''} onChange={(e) => set('bio', e.target.value)} rows={4} placeholder={t('talent.bio_ph')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-500 outline-none resize-y" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">{t('talent.years_label')}</label>
              <input type="number" min="0" value={form.years_experience ?? ''} onChange={(e) => set('years_experience', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-500 outline-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Roles desejados + skills */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-sm"><Award className="h-4 w-4" /></div>
          <h2 className="font-semibold text-sm text-slate-900">{t('talent.roles_skills_title')}</h2>
        </header>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">{t('talent.desired_roles_label')}</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(form.desired_roles || []).map((r, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-brand-100 text-brand-700 px-2 py-0.5 rounded text-xs font-medium">
                  {r}
                  <button onClick={() => removeTag('desired_roles', i)} className="hover:text-brand-900"><X className="h-2.5 w-2.5" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={roleInput} onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('desired_roles', roleInput, setRoleInput); } }}
                placeholder={t('talent.role_ph')}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500" />
              <button onClick={() => addTag('desired_roles', roleInput, setRoleInput)} className="px-3 py-2 bg-brand-600 text-white rounded-lg"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
          <TalentCatalogSkills />
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">{t('talent.free_skills_label')}</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(form.certified_skills || []).map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium">
                  {s}
                  <button onClick={() => removeTag('certified_skills', i)} className="hover:text-emerald-900"><X className="h-2.5 w-2.5" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('certified_skills', skillInput, setSkillInput); } }}
                placeholder={t('talent.skill_ph')}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" />
              <button onClick={() => addTag('certified_skills', skillInput, setSkillInput)} className="px-3 py-2 bg-emerald-600 text-white rounded-lg"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </section>

      {/* Localização */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-sm"><MapPin className="h-4 w-4" /></div>
          <h2 className="font-semibold text-sm text-slate-900">{t('talent.location_title')}</h2>
        </header>
        <div className="p-5 grid sm:grid-cols-2 gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">{t('talent.city_country_label')}</label>
            <input value={form.location || ''} onChange={(e) => set('location', e.target.value)} placeholder={t('talent.location_ph')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-sky-500 outline-none" />
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm cursor-pointer">
            <input type="checkbox" checked={!!form.remote_ok} onChange={(e) => set('remote_ok', e.target.checked)} className="h-4 w-4 rounded text-sky-600" />
            <Globe className="h-4 w-4 text-slate-400" /> {t('talent.remote_ok')}
          </label>
        </div>
      </section>

      {/* Salário */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-sm text-slate-900">{t('talent.salary_title')}</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">{t('talent.salary_hint')}</p>
        </header>
        <div className="p-5 grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('talent.salary_min')}</label>
            <input type="number" min="0" step="1000" value={form.desired_salary_min_cents ? form.desired_salary_min_cents / 100 : ''} onChange={(e) => set('desired_salary_min_cents', e.target.value ? Math.round(Number(e.target.value) * 100) : undefined)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('talent.salary_max')}</label>
            <input type="number" min="0" step="1000" value={form.desired_salary_max_cents ? form.desired_salary_max_cents / 100 : ''} onChange={(e) => set('desired_salary_max_cents', e.target.value ? Math.round(Number(e.target.value) * 100) : undefined)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
          </div>
        </div>
      </section>

      {/* Privacidade */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={!!form.hidden_from_current_org} onChange={(e) => set('hidden_from_current_org', e.target.checked)}
            className="h-5 w-5 rounded text-rose-600 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <EyeOff className="h-4 w-4 text-slate-600" />
              <span className="font-semibold text-sm text-slate-900">{t('talent.hide_employer')}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t('talent.hide_employer_desc')}</p>
          </div>
        </label>
      </section>

      <div className="sticky bottom-4 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-2xl p-3 flex items-center justify-between">
        <div className="text-xs text-slate-500 px-2">{dirty ? <span className="text-amber-600 font-medium">{t('talent.unsaved')}</span> : t('talent.no_changes')}</div>
        <button onClick={save} disabled={busy || !dirty}
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-br from-brand-600 to-brand-600 hover:from-brand-700 hover:to-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t('talent.save_profile')}
        </button>
      </div>
    </div>
  );
}
