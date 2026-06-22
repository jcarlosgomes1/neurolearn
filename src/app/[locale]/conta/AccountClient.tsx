'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { toast } from 'sonner';
import { COUNTRIES, countryName } from '@/lib/utils/countries';
import { User, Settings, CreditCard, Save } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

interface AccountData {
  ok: boolean;
  email: string;
  name: string | null;
  preferred_lang: string | null;
  phone: string | null;
  phone_country_code: string | null;
  country_code: string | null;
  bio: string | null;
  avatar_url: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
  subscription_renews_at: string | null;
  payments: Array<{ course_id: string; course_title: string; amount_cents: number; currency: string; date: string }>;
}

interface Props {
  initialData: AccountData | null;
  initialLocale: string;
}

const LANGS = [
  { code: 'pt', flag: '🇵🇹', label: 'Português' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
] as const;

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(cents / 100);
}

export function AccountClient({ initialData, initialLocale }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const [data, setData] = useState<AccountData | null>(initialData);
  const [name, setName] = useState(initialData?.name || '');
  const [prefLang, setPrefLang] = useState(initialData?.preferred_lang || initialLocale);
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [phoneCC, setPhoneCC] = useState(initialData?.phone_country_code || '+351');
  const [country, setCountry] = useState(initialData?.country_code || 'PT');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const sb = createClient();
      assertNotPeekClient();
      const { error } = await sb.rpc('nl_update_my_profile', {
        p_name: name || null,
        p_preferred_lang: prefLang || null,
        p_phone: phone || null,
        p_phone_country_code: phoneCC || null,
        p_country_code: country || null,
        p_bio: bio || null,
      });
      if (error) { toast.error(error.message); return; }
      toast.success(t('account.saved'));
      // Re-fetch to update display
      const { data: fresh } = await sb.rpc('nl_my_account');
      if (fresh) setData(fresh as AccountData);
      // Se a lingua mudou, recarrega para o middleware aplicar mother-lang redirect
      if (prefLang && prefLang !== initialLocale) {
        window.location.href = `/${prefLang}/conta`;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <AppPageHeader title={t('account.title')} description={t('account.subtitle')} />

      {/* Identificação */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-brand-600" />
          {t('account.section.identity')}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('account.field.email')}</label>
            <input type="email" className="input bg-slate-50" value={data?.email || ''} disabled readOnly />
          </div>
          <div>
            <label className="label">{t('account.field.name')}</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('account.profile.name_ph')} />
          </div>
          <div>
            <label className="label">{t('account.field.country')}</label>
            <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{countryName(c.code, locale)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('account.field.phone')}</label>
            <div className="flex gap-2">
              <select className="input w-28" value={phoneCC} onChange={(e) => setPhoneCC(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.dial}>{c.dial} ({c.code})</option>
                ))}
              </select>
              <input type="tel" className="input flex-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('account.profile.phone_ph')} />
            </div>
          </div>
        </div>
      </section>

      {/* Preferências */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4 text-brand-600" />
          {t('account.section.preferences')}
        </h2>
        <div>
          <label className="label">{t('account.field.lang')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {LANGS.map((l) => {
              const active = prefLang === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setPrefLang(l.code)}
                  className={`text-sm px-3 py-2.5 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${active ? 'border-brand-500 bg-brand-50 text-brand-900 font-semibold' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                >
                  <span className="text-lg">{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Save button (afecta identity + preferences) */}
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
        >
          <Save className="h-4 w-4" />
          {saving ? '…' : t('account.save')}
        </button>
      </div>

      {/* Faturação */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-brand-600" />
          {t('account.section.billing')}
        </h2>
        {!data?.payments || data.payments.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">{t('account.billing.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="text-left pb-2">{t('account.billing.invoice')}</th>
                  <th className="text-right pb-2">{t('account.billing.amount')}</th>
                  <th className="text-right pb-2">{t('account.billing.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.payments.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-3 text-slate-700">{p.course_title}</td>
                    <td className="py-3 text-right font-mono text-slate-900">{formatPrice(p.amount_cents, p.currency)}</td>
                    <td className="py-3 text-right text-slate-500">{new Date(p.date).toLocaleDateString('pt-PT')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
