'use client';

import { useState } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { AvatarUploader } from '@/components/account/AvatarUploader';

interface Initial {
  name: string;
  bio: string;
  phone: string;
  phone_country_code: string;
  country_code: string;
  preferred_lang: string;
}

const LANGS = [
  { v: 'pt', l: 'Português' },
  { v: 'en', l: 'English' },
  { v: 'es', l: 'Español' },
  { v: 'fr', l: 'Français' },
];

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-100';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

export function ProfileForm({ email, handle, initial }: { email: string; handle: string; initial: Initial }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [form, setForm] = useState<Initial>(initial);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Initial, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setBusy(true);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { error } = await sb.rpc('nl_update_my_profile', {
        p_name: form.name || null,
        p_preferred_lang: form.preferred_lang || null,
        p_phone: form.phone || null,
        p_phone_country_code: form.phone_country_code || null,
        p_country_code: form.country_code || null,
        p_bio: form.bio || null,
      });
      if (error) throw error;
      toast.success(t('profile.saved'));
      if (form.preferred_lang && form.preferred_lang !== initial.preferred_lang) {
        router.replace(pathname, { locale: form.preferred_lang as any });
      }
    } catch (e: any) {
      toast.error(e?.message || t('profile.save_error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AppPageHeader eyebrow={t('account.home.title')} title={t('account.home.profile_title')} description={t('profile.subtitle')} />

      <AvatarUploader />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        <Field label={t('profile.email_label')} hint={t('profile.email_hint')}>
          <input value={email} disabled className={`${inputCls} bg-slate-50 text-slate-500 cursor-not-allowed`} />
        </Field>

        {handle && (
          <Field label={t('profile.handle_label')}>
            <input value={`@${handle}`} disabled className={`${inputCls} bg-slate-50 text-slate-500 cursor-not-allowed`} />
          </Field>
        )}

        <Field label={t('profile.name_label')}>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t('profile.name_ph')} className={inputCls} />
        </Field>

        <Field label={t('profile.bio_label')} hint={t('profile.bio_hint')}>
          <textarea
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            rows={3}
            placeholder={t('profile.bio_ph')}
            className={`${inputCls} resize-none`}
          />
        </Field>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <Field label={t('profile.dialcode_label')}>
              <input value={form.phone_country_code} onChange={(e) => set('phone_country_code', e.target.value)} placeholder={t('profile.dialcode_ph')} className={inputCls} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label={t('profile.phone_label')}>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder={t('account.profile.phone_ph')} className={inputCls} />
            </Field>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('profile.country_label')}>
            <input value={form.country_code} onChange={(e) => set('country_code', e.target.value.toUpperCase())} placeholder={t('profile.country_ph')} maxLength={2} className={inputCls} />
          </Field>
          <Field label={t('profile.lang_label')}>
            <select value={form.preferred_lang} onChange={(e) => set('preferred_lang', e.target.value)} className={inputCls}>
              {LANGS.map((l) => (
                <option key={l.v} value={l.v}>{l.l}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="pt-2">
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('profile.save_changes')}
          </button>
        </div>
      </div>
    </div>
  );
}
