'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function CreateOrgForm({ countries, locale }: { countries: Array<{ code: string; name: string }>; locale: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [name, setName] = useState('');
  const [legal, setLegal] = useState('');
  const [country, setCountry] = useState('PT');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_create_organization', {
        p_name: name.trim(),
        p_legal_name: legal.trim() || null,
        p_country_code: country,
      });
      if (error) throw error;
      const result = data as { ok: boolean; slug?: string };
      if (result?.ok && result.slug) {
        toast.success(t('emp.create.success'));
        router.push(`/empresa/${result.slug}` as any);
      } else throw new Error(t('tea.error'));
    } catch (e: any) {
      toast.error(e?.message || t('tea.error'));
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('emp.create.name_label')} *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80}
          placeholder={t('emp.create.name_ph')}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('emp.create.legal_label')}</label>
        <input value={legal} onChange={(e) => setLegal(e.target.value)} maxLength={120}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('emp.create.country_label')}</label>
        <select value={country} onChange={(e) => setCountry(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none bg-white">
          {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </div>
      <button type="submit" disabled={loading || !name.trim()}
        className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-brand-600 to-brand-600 hover:opacity-90 disabled:opacity-50 text-white font-semibold transition">
        {loading ? '…' : t('emp.create.submit')}
      </button>
    </form>
  );
}
