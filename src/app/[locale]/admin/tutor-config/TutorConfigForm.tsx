'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface Setting { key: string; value: any }

export function TutorConfigForm() {
  const t = useTranslations();
  const [enabled, setEnabled] = useState(true);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    callAgentOps<{ settings: Setting[] }>('list_settings', { category: 'student_features' })
      .then((r) => {
        const map = new Map(r.settings.map((s) => [s.key, s.value]));
        setEnabled(map.get('student_tutor_enabled') !== false);
        setLimit(Number(map.get('student_tutor_daily_limit')) || 20);
        setLoading(false);
      })
      .catch((e) => { toast.error(e.message); setLoading(false); });
  }, []);

  async function save() {
    setSaving(true);
    try {
      await callAgentOps('update_setting', { key: 'student_tutor_enabled', value: enabled });
      await callAgentOps('update_setting', { key: 'student_tutor_daily_limit', value: limit });
      toast.success(t('tutor.toast_saved'));
      setDirty(false);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-slate-500">{t('tutor.loading')}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5 animate-fade-in">
      <AdminPageHeader backHref="/admin" emoji="🎓" title={t('tutor.title')} description={t('tutor.subtitle')} />

      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5">
        <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${enabled ? 'border-brand-300 bg-brand-50/40' : 'border-slate-200 hover:border-slate-300'}`}>
          <input type="checkbox" checked={enabled} onChange={(e) => { setEnabled(e.target.checked); setDirty(true); }} className="mt-1 w-5 h-5 accent-brand-600 flex-shrink-0" />
          <div>
            <div className="font-semibold text-slate-900">{t('tutor.toggle_label')}</div>
            <p className="text-sm text-slate-600 mt-1">{t('tutor.toggle_desc')}</p>
          </div>
        </label>

        <div>
          <label className="label" htmlFor="limit">{t('tutor.limit_label')}</label>
          <p className="text-xs text-slate-500 mb-2">{t('tutor.limit_hint')}</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[5, 10, 20, 50, 100, 200].map((n) => (
              <button key={n} type="button" onClick={() => { setLimit(n); setDirty(true); }} className={`py-2 rounded-lg text-sm font-medium transition-colors ${limit === n ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{n}</button>
            ))}
          </div>
          <input id="limit" type="number" min="1" max="500" className="input mt-3" value={limit} onChange={(e) => { setLimit(Math.max(1, parseInt(e.target.value) || 1)); setDirty(true); }} />
        </div>
      </section>

      <div className="sticky bottom-4 z-10">
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-3">
          <button onClick={save} disabled={saving || !dirty} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg">
            {saving ? t('tutor.saving') : dirty ? t('tutor.save_changes') : t('tutor.no_changes')}
          </button>
        </div>
      </div>
    </div>
  );
}
