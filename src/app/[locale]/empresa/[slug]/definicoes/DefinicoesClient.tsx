'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Loader2, Save } from 'lucide-react';
import { updateOrgAction } from './actions';

type Org = {
  id: string; slug: string; name: string; legal_name: string | null;
  country_code: string | null; vat_number: string | null; logo_url: string | null; primary_color: string | null;
};

export function DefinicoesClient({ org }: { org: Org }) {
  const t = useTranslations();
  const [form, setForm] = useState({
    name: org.name || '', legal_name: org.legal_name || '', country_code: org.country_code || '',
    vat_number: org.vat_number || '', logo_url: org.logo_url || '', primary_color: org.primary_color || '#6366f1',
  });
  const [pending, start] = useTransition();
  function set(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }
  function save() {
    start(async () => {
      const r = await updateOrgAction(org.id, form);
      if (r?.ok) toast.success(t('empresa.settings.saved'));
      else toast.error(t('empresa.settings.error'));
    });
  }
  const field = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400';
  const label = 'block text-xs font-semibold text-slate-600 mb-1';
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link href={{ pathname: '/empresa/[slug]', params: { slug: org.slug } } as any}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {org.name}
      </Link>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-violet-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Building2 className="h-3.5 w-3.5" /> {t('empresa.settings.eyebrow')}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('empresa.settings.title')}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">{t('empresa.settings.desc')}</p>
      </header>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div>
          <label className={label}>{t('empresa.settings.name')}</label>
          <input className={field} value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label className={label}>{t('empresa.settings.legal_name')}</label>
          <input className={field} value={form.legal_name} onChange={(e) => set('legal_name', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>{t('empresa.settings.country')}</label>
            <input className={field} maxLength={2} value={form.country_code} onChange={(e) => set('country_code', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className={label}>{t('empresa.settings.vat')}</label>
            <input className={field} value={form.vat_number} onChange={(e) => set('vat_number', e.target.value)} />
          </div>
        </div>
        <div>
          <label className={label}>{t('empresa.settings.logo')}</label>
          <input className={field} value={form.logo_url} onChange={(e) => set('logo_url', e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className={label}>{t('empresa.settings.color')}</label>
          <div className="flex items-center gap-2">
            <input type="color" className="h-9 w-12 rounded border border-slate-200 cursor-pointer" value={form.primary_color || '#6366f1'} onChange={(e) => set('primary_color', e.target.value)} />
            <input className={field} value={form.primary_color} onChange={(e) => set('primary_color', e.target.value)} />
          </div>
        </div>
        <div className="pt-2">
          <button onClick={save} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold disabled:opacity-50">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t('empresa.settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
