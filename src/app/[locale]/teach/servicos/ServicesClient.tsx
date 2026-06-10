'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Plus, Save, Trash2, Edit3, Loader2, X, Users, Clock, Globe, MapPin, CheckCircle, Circle, Sparkles } from 'lucide-react';

interface Service {
  id: string; instructor_id: string; kind: string; title: string; description: string | null;
  outcomes: string[] | null; target_audience: string | null; languages: string[] | null;
  base_price_cents: number | null; currency: string | null; price_model: string | null;
  format: string | null; duration_hours_min: number | null; duration_hours_max: number | null;
  max_participants: number | null; travel_ok: boolean | null;
  recording_included: boolean | null; followup_qa_included: boolean | null; materials_included: boolean | null;
  status: string | null; tags: string[] | null;
}

const KINDS = [
  { value: 'workshop', labelKey: 'tsvc.kind_workshop' },
  { value: 'training', labelKey: 'tsvc.kind_training' },
  { value: 'mentoring', labelKey: 'tsvc.kind_mentoring' },
  { value: 'consulting', labelKey: 'tsvc.kind_consulting' },
  { value: 'talk', labelKey: 'tsvc.kind_talk' },
];
const FORMATS = [{ value: 'remote', labelKey: 'tsvc.fmt_remote' }, { value: 'onsite', labelKey: 'tsvc.fmt_onsite' }, { value: 'hybrid', labelKey: 'tsvc.fmt_hybrid' }];
const PRICE_MODELS = [{ value: 'fixed', labelKey: 'tsvc.pm_fixed' }, { value: 'hourly', labelKey: 'tsvc.pm_hourly' }, { value: 'daily', labelKey: 'tsvc.pm_daily' }, { value: 'custom', labelKey: 'tsvc.pm_custom' }];
const STATUS_KEY: Record<string, string> = { active: 'tsvc.st_active', paused: 'tsvc.st_paused', draft: 'tsvc.st_draft' };

const empty: Partial<Service> = {
  kind: 'workshop', title: '', description: '', outcomes: [], target_audience: '',
  languages: ['pt'], base_price_cents: 0, currency: 'EUR', price_model: 'fixed',
  format: 'remote', duration_hours_min: 4, duration_hours_max: 4, max_participants: 20,
  travel_ok: false, recording_included: true, followup_qa_included: false, materials_included: true,
  status: 'active', tags: [],
};

export function ServicesClient({ initial }: { initial: Service[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [items, setItems] = useState<Service[]>(initial);
  const [editing, setEditing] = useState<Partial<Service> | null>(null);
  const [busy, setBusy] = useState(false);
  const [outcomeInput, setOutcomeInput] = useState('');

  function startNew() { setEditing({ ...empty }); setOutcomeInput(''); }
  function startEdit(s: Service) { setEditing({ ...s }); setOutcomeInput(''); }
  function cancel() { setEditing(null); }

  function addOutcome() {
    const v = outcomeInput.trim(); if (!v) return;
    setEditing((p) => ({ ...p, outcomes: [...(p?.outcomes || []), v] }));
    setOutcomeInput('');
  }
  function removeOutcome(idx: number) {
    setEditing((p) => ({ ...p, outcomes: (p?.outcomes || []).filter((_, i) => i !== idx) }));
  }

  async function save() {
    if (!editing?.title) { toast.error(t('tsvc.title_required')); return; }
    setBusy(true);
    try {
      const sb = createClient();
      const payload: any = { ...editing };
      const { error } = await sb.rpc('nl_my_instructor_service_upsert', { p_id: editing.id || null, p_data: payload });
      if (error) throw error;
      toast.success(editing.id ? t('tsvc.updated') : t('tsvc.created'));
      setEditing(null);
      await refresh();
    } catch (e: any) { toast.error(e?.message || t('tea.error')); }
    finally { setBusy(false); }
  }

  async function del(s: Service) {
    if (!confirm(t('tsvc.delete_confirm', { title: s.title }))) return;
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_my_instructor_service_delete', { p_id: s.id });
      if (error) throw error;
      toast.success(t('tsvc.deleted'));
      await refresh();
    } catch (e: any) { toast.error(e?.message || t('tea.error')); }
    finally { setBusy(false); }
  }

  async function refresh() {
    const sb = createClient();
    const { data } = await sb.rpc('nl_my_instructor_services');
    setItems(Array.isArray(data) ? data : []);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">{t('tsvc.count', { count: items.length })}</div>
        {!editing && (
          <button onClick={startNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-sm font-semibold rounded-lg shadow-sm">
            <Plus className="h-4 w-4" /> {t('tsvc.new')}
          </button>
        )}
      </div>

      {editing && (
        <section className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">{editing.id ? t('tsvc.edit') : t('tsvc.new')}</h3>
            <button onClick={cancel} className="p-1 hover:bg-white rounded"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('tsvc.f_kind')}</label>
              <select value={editing.kind || 'workshop'} onChange={(e) => setEditing((p) => ({ ...p, kind: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-amber-500">
                {KINDS.map((k) => <option key={k.value} value={k.value}>{t(k.labelKey)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('tsvc.f_format')}</label>
              <select value={editing.format || 'remote'} onChange={(e) => setEditing((p) => ({ ...p, format: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-amber-500">
                {FORMATS.map((f) => <option key={f.value} value={f.value}>{t(f.labelKey)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('tsvc.f_title')}</label>
            <input value={editing.title || ''} onChange={(e) => setEditing((p) => ({ ...p, title: e.target.value }))} placeholder={t('tsvc.f_title_ph')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('tsvc.f_desc')}</label>
            <textarea value={editing.description || ''} onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))} rows={4} placeholder={t('tsvc.f_desc_ph')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none resize-y" />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('tsvc.f_outcomes')}</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(editing.outcomes || []).map((o, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs">
                  {o} <button onClick={() => removeOutcome(i)}><X className="h-2.5 w-2.5" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={outcomeInput} onChange={(e) => setOutcomeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOutcome(); } }}
                placeholder={t('tsvc.f_outcomes_ph')}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-amber-500" />
              <button onClick={addOutcome} className="px-3 py-2 bg-amber-600 text-white rounded-lg"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('tsvc.f_audience')}</label>
            <input value={editing.target_audience || ''} onChange={(e) => setEditing((p) => ({ ...p, target_audience: e.target.value }))} placeholder={t('tsvc.f_audience_ph')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('tsvc.f_pricemodel')}</label>
              <select value={editing.price_model || 'fixed'} onChange={(e) => setEditing((p) => ({ ...p, price_model: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-amber-500">
                {PRICE_MODELS.map((m) => <option key={m.value} value={m.value}>{t(m.labelKey)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('tsvc.f_baseprice')}</label>
              <input type="number" min="0" step="50" value={editing.base_price_cents ? editing.base_price_cents / 100 : 0} onChange={(e) => setEditing((p) => ({ ...p, base_price_cents: Math.round(Number(e.target.value) * 100) }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('tsvc.f_maxpart')}</label>
              <input type="number" min="1" value={editing.max_participants ?? ''} onChange={(e) => setEditing((p) => ({ ...p, max_participants: e.target.value ? Number(e.target.value) : null }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('tsvc.f_durmin')}</label>
              <input type="number" min="0" step="0.5" value={editing.duration_hours_min ?? ''} onChange={(e) => setEditing((p) => ({ ...p, duration_hours_min: e.target.value ? Number(e.target.value) : null }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('tsvc.f_durmax')}</label>
              <input type="number" min="0" step="0.5" value={editing.duration_hours_max ?? ''} onChange={(e) => setEditing((p) => ({ ...p, duration_hours_max: e.target.value ? Number(e.target.value) : null }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              { k: 'travel_ok', labelKey: 'tsvc.opt_travel' },
              { k: 'recording_included', labelKey: 'tsvc.opt_recording' },
              { k: 'followup_qa_included', labelKey: 'tsvc.opt_qa' },
              { k: 'materials_included', labelKey: 'tsvc.opt_materials' },
            ].map((opt) => (
              <label key={opt.k} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs cursor-pointer">
                <input type="checkbox" checked={!!(editing as any)[opt.k]} onChange={(e) => setEditing((p) => ({ ...p, [opt.k]: e.target.checked }))}
                  className="h-4 w-4 rounded text-amber-600" />
                {t(opt.labelKey)}
              </label>
            ))}
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('tsvc.f_status')}</label>
            <select value={editing.status || 'active'} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-amber-500">
              <option value="active">{t('tsvc.st_active')}</option>
              <option value="paused">{t('tsvc.st_paused')}</option>
              <option value="draft">{t('tsvc.st_draft')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={cancel} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900">{t('btn.cancel')}</button>
            <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {t('account.save')}
            </button>
          </div>
        </section>
      )}

      {items.length === 0 && !editing ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Sparkles className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 text-sm">{t('tsvc.empty_h')}</h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">{t('tsvc.empty_p')}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((s) => (
            <article key={s.id} className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{KINDS.find((k) => k.value === s.kind) ? t(KINDS.find((k) => k.value === s.kind)!.labelKey) : s.kind}</span>
                  {s.status === 'active' ? <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{t('tsvc.st_active')}</span> : <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{STATUS_KEY[s.status || ''] ? t(STATUS_KEY[s.status || '']) : s.status}</span>}
                </div>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => startEdit(s)} className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => del(s)} className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 text-base leading-snug">{s.title}</h3>
              {s.description && <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">{s.description}</p>}
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-slate-500">
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {s.duration_hours_min || 0}-{s.duration_hours_max || 0}h</span>
                {s.max_participants && <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {t('tsvc.upto', { n: s.max_participants })}</span>}
                {s.format === 'onsite' ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {t('tsvc.fmt_onsite')}</span>
                  : s.format === 'hybrid' ? <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> {t('tsvc.fmt_hybrid')}</span>
                  : <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> {t('tsvc.fmt_remote')}</span>}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-base font-bold text-slate-900">{((s.base_price_cents || 0) / 100).toFixed(0)} {s.currency || 'EUR'}</span>
                <span className="text-[10px] text-slate-400">{PRICE_MODELS.find((m) => m.value === s.price_model) ? t(PRICE_MODELS.find((m) => m.value === s.price_model)!.labelKey) : ''}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
