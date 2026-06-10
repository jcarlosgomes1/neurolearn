'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Save, MessageSquare, Mail, Smartphone, BellRing, Clock, AlertCircle } from 'lucide-react';

export function NotifPrefsClient({ initial, whatsappEnabled }: { initial: any; whatsappEnabled: boolean }) {
  const t = useTranslations();
  const [form, setForm] = useState(initial || {});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  function set(k: string, v: any) { setForm((p: any) => ({ ...p, [k]: v })); setDirty(true); }

  async function save() {
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_my_notif_prefs_set', { p_prefs: form });
      if (error) throw error;
      toast.success(t('notifs.prefs.saved'));
      setDirty(false);
    } catch (e: any) {
      toast.error(e?.message || t('notifs.prefs.save_error'));
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      {/* Canais */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <h2 className="font-semibold text-sm text-slate-900">{t('notifs.prefs.channels')}</h2>
        </header>
        <div className="divide-y divide-slate-100">
          <ChannelRow icon={BellRing} title={t('notifs.prefs.ch_platform_title')} desc={t('notifs.prefs.ch_platform_desc')} enabled={form.channel_platform ?? true} onToggle={(v) => set('channel_platform', v)} accent="from-violet-500 to-indigo-600" />
          <ChannelRow icon={Mail} title={t('notifs.prefs.ch_email_title')} desc={t('notifs.prefs.ch_email_desc')} enabled={form.channel_email ?? true} onToggle={(v) => set('channel_email', v)} accent="from-blue-500 to-cyan-600" />
          {whatsappEnabled && (
            <>
              <ChannelRow icon={MessageSquare} title={t('notifs.prefs.ch_whatsapp_title')} desc={t('notifs.prefs.ch_whatsapp_desc')} enabled={form.channel_whatsapp ?? false} onToggle={(v) => set('channel_whatsapp', v)} accent="from-emerald-500 to-teal-600" />
              {form.channel_whatsapp && (
                <div className="px-5 py-3 bg-emerald-50/50">
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">{t('notifs.prefs.whatsapp_number_label')}</label>
                  <input
                    type="tel"
                    value={form.whatsapp_number || ''}
                    onChange={(e) => set('whatsapp_number', e.target.value)}
                    placeholder={t('notifs.prefs.whatsapp_ph')}
                    className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none" />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Frequência digest */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-slate-500" />
          <h2 className="font-semibold text-sm text-slate-900">{t('notifs.prefs.freq_title')}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { v: 'instant', k: 'notifs.prefs.freq_instant' },
            { v: 'hourly', k: 'notifs.prefs.freq_hourly' },
            { v: 'daily', k: 'notifs.prefs.freq_daily' },
            { v: 'weekly', k: 'notifs.prefs.freq_weekly' },
            { v: 'off', k: 'notifs.prefs.freq_off' },
          ].map((o) => (
            <button
              key={o.v}
              onClick={() => set('digest_frequency', o.v)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${(form.digest_frequency || 'instant') === o.v ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
              {t(o.k)}
            </button>
          ))}
        </div>
      </section>

      {/* Tipos */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <h2 className="font-semibold text-sm text-slate-900">{t('notifs.prefs.types_title')}</h2>
        </header>
        <div className="divide-y divide-slate-100">
          <TypeRow title={t('notifs.prefs.t_question_title')} desc={t('notifs.prefs.t_question_desc')} enabled={form.notif_student_question ?? true} onToggle={(v) => set('notif_student_question', v)} />
          <TypeRow title={t('notifs.prefs.t_eval_title')} desc={t('notifs.prefs.t_eval_desc')} enabled={form.notif_evaluation_pending ?? true} onToggle={(v) => set('notif_evaluation_pending', v)} />
          <TypeRow title={t('notifs.prefs.t_review_title')} desc={t('notifs.prefs.t_review_desc')} enabled={form.notif_course_review ?? true} onToggle={(v) => set('notif_course_review', v)} />
          <TypeRow title={t('notifs.prefs.t_payout_title')} desc={t('notifs.prefs.t_payout_desc')} enabled={form.notif_payout ?? true} onToggle={(v) => set('notif_payout', v)} />
          <TypeRow title={t('notifs.prefs.t_marketing_title')} desc={t('notifs.prefs.t_marketing_desc')} enabled={form.notif_marketing ?? false} onToggle={(v) => set('notif_marketing', v)} />
        </div>
      </section>

      {!whatsappEnabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>{t('notifs.prefs.whatsapp_disabled_pre')}<code className="bg-amber-100 px-1 rounded">/admin/platform-config</code>.</div>
        </div>
      )}

      <div className="sticky bottom-4 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-2xl p-3 flex items-center justify-between">
        <div className="text-xs text-slate-500 px-2">{dirty ? <span className="text-amber-600 font-medium">{t('notifs.prefs.unsaved')}</span> : t('notifs.prefs.no_changes')}</div>
        <button onClick={save} disabled={busy || !dirty} className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
          <Save className="h-3.5 w-3.5" /> {busy ? t('notifs.prefs.saving') : t('notifs.prefs.save_btn')}
        </button>
      </div>
    </div>
  );
}

function ChannelRow({ icon: Icon, title, desc, enabled, onToggle, accent }: { icon: any; title: string; desc: string; enabled: boolean; onToggle: (v: boolean) => void; accent: string }) {
  return (
    <div className="px-5 py-3.5 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${accent} text-white flex items-center justify-center shadow-sm flex-shrink-0`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</div>
      </div>
      <button onClick={() => onToggle(!enabled)} className={`inline-flex items-center h-6 w-11 rounded-full p-0.5 transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <span className={`h-5 w-5 bg-white rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function TypeRow({ title, desc, enabled, onToggle }: { title: string; desc: string; enabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="px-5 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
      <button onClick={() => onToggle(!enabled)} className={`inline-flex items-center h-5 w-9 rounded-full p-0.5 transition-colors ${enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}>
        <span className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
