'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Calendar, Link2, Clock, Plus, Trash2, Copy, ExternalLink, Save } from 'lucide-react';

interface Link {
  id: string; slug: string; title: string; description: string | null;
  duration_min: number; price_cents: number; currency: string;
  location_type: string; location_details: string | null; visible: boolean;
}
interface Booking {
  id: string; guest_name: string; guest_email: string; guest_phone: string | null;
  scheduled_at: string; duration_min: number; status: string;
  link_title: string | null; guest_notes: string | null; meeting_url: string | null;
  price_cents: number; paid_at: string | null;
}
interface Calendar {
  timezone: string;
  weekly_availability: Record<string, [string, string][]>;
  buffer_minutes: number; min_notice_hours: number; max_advance_days: number;
  enabled: boolean;
}
interface Dashboard {
  ok: true; handle: string;
  calendar: Calendar; links: Link[];
  upcoming_bookings: Booking[]; past_bookings: Booking[];
}

const DOW = ['0','1','2','3','4','5','6'];
const DEFAULT_LINK: Partial<Link> = { slug: '', title: '', description: '', duration_min: 30, price_cents: 0, currency: 'EUR', location_type: 'video', visible: true };

export function SchedulingDashboard({ initial }: { initial: Dashboard | null }) {
  const t = useTranslations();
  const locale = useLocale();
  const [data, setData] = useState<Dashboard | null>(initial);
  const [tab, setTab] = useState<'availability' | 'links' | 'bookings'>('availability');
  const [cal, setCal] = useState<Calendar | null>(initial?.calendar || null);
  const [savingCal, setSavingCal] = useState(false);
  const [editingLink, setEditingLink] = useState<Partial<Link> | null>(null);
  const [savingLink, setSavingLink] = useState(false);

  if (!data || !cal) {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-center text-slate-500">A carregar…</div>;
  }

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/${locale}/agendar/${data.handle}` : '';

  async function refresh() {
    const sb = createClient();
    const { data: fresh } = await sb.rpc('nl_scheduling_my_dashboard');
    if (fresh) { setData(fresh as Dashboard); setCal((fresh as Dashboard).calendar); }
  }

  async function saveCalendar() {
    if (savingCal) return;
    setSavingCal(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_scheduling_update_calendar', {
        p_timezone: cal!.timezone, p_weekly_availability: cal!.weekly_availability,
        p_buffer_minutes: cal!.buffer_minutes, p_min_notice_hours: cal!.min_notice_hours,
        p_max_advance_days: cal!.max_advance_days, p_enabled: cal!.enabled,
      });
      if (error) { toast.error(error.message); return; }
      toast.success(t('account.saved'));
    } finally { setSavingCal(false); }
  }

  function addWindow(dow: string) {
    setCal((c) => {
      if (!c) return c;
      const newAvail = { ...c.weekly_availability };
      newAvail[dow] = [...(newAvail[dow] || []), ['09:00', '17:00']];
      return { ...c, weekly_availability: newAvail };
    });
  }
  function removeWindow(dow: string, idx: number) {
    setCal((c) => {
      if (!c) return c;
      const newAvail = { ...c.weekly_availability };
      newAvail[dow] = (newAvail[dow] || []).filter((_, i) => i !== idx);
      return { ...c, weekly_availability: newAvail };
    });
  }
  function updateWindow(dow: string, idx: number, which: 0 | 1, value: string) {
    setCal((c) => {
      if (!c) return c;
      const newAvail = { ...c.weekly_availability };
      const list = [...(newAvail[dow] || [])];
      list[idx] = [...list[idx]] as [string, string];
      list[idx][which] = value;
      newAvail[dow] = list;
      return { ...c, weekly_availability: newAvail };
    });
  }

  async function saveLink() {
    if (savingLink || !editingLink) return;
    setSavingLink(true);
    try {
      const sb = createClient();
      const { data: res, error } = await sb.rpc('nl_scheduling_upsert_link', {
        p_id: editingLink.id || null,
        p_slug: editingLink.slug || (editingLink.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `link-${Date.now()}`,
        p_title: editingLink.title || '', p_description: editingLink.description || null,
        p_duration_min: editingLink.duration_min || 30,
        p_price_cents: editingLink.price_cents || 0,
        p_currency: editingLink.currency || 'EUR',
        p_location_type: editingLink.location_type || 'video',
        p_location_details: editingLink.location_details || null,
        p_visible: editingLink.visible !== false,
      });
      if (error || !(res as any)?.ok) {
        toast.error(error?.message || (res as any)?.error || 'failed');
        return;
      }
      toast.success(t('account.saved'));
      setEditingLink(null);
      await refresh();
    } finally { setSavingLink(false); }
  }

  async function deleteLink(id: string) {
    if (!confirm('Eliminar este tipo de reunião?')) return;
    const sb = createClient();
    const { error } = await sb.rpc('nl_scheduling_delete_link', { p_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success('Eliminado');
    await refresh();
  }

  async function cancelBooking(id: string) {
    if (!confirm('Cancelar esta reunião?')) return;
    const sb = createClient();
    const { data: res, error } = await sb.rpc('nl_scheduling_cancel_booking', { p_booking_id: id, p_reason: 'cancelled_by_host' });
    if (error || !(res as any)?.ok) { toast.error(error?.message || 'failed'); return; }
    toast.success('Cancelado');
    await refresh();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('sched.dashboard.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('sched.dashboard.subtitle')}</p>
      </div>

      {/* Public link card */}
      {publicUrl && (
        <div className="bg-gradient-to-br from-brand-50 to-violet-50 border border-brand-100 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-brand-700 font-semibold mb-1">{t('account.scheduling.public_link')}</div>
            <div className="text-sm font-mono text-slate-700 truncate">{publicUrl}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Copiado'); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-brand-300 text-sm font-medium text-slate-700">
              <Copy className="h-3.5 w-3.5" /> Copiar
            </button>
            <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-sm font-medium text-white">
              <ExternalLink className="h-3.5 w-3.5" /> Abrir
            </a>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-1">
        {([['availability', t('sched.tab.availability'), Calendar],
           ['links', t('sched.tab.links'), Link2],
           ['bookings', t('sched.tab.bookings'), Clock]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* AVAILABILITY */}
      {tab === 'availability' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={cal.enabled} onChange={(e) => setCal({ ...cal, enabled: e.target.checked })} />
              <span className="font-medium text-slate-900">{t('sched.enabled')}</span>
            </label>
            <button onClick={saveCalendar} disabled={savingCal} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:opacity-90 text-white text-sm font-semibold disabled:opacity-50">
              <Save className="h-4 w-4" /> {savingCal ? '…' : t('account.save')}
            </button>
          </div>

          <div className="space-y-3">
            {DOW.map((dow) => {
              const windows = cal.weekly_availability[dow] || [];
              return (
                <div key={dow} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className="w-24 pt-1.5 text-sm font-medium text-slate-700">{t(`sched.weekdays.${dow}` as any)}</div>
                  <div className="flex-1 space-y-2">
                    {windows.length === 0 && (
                      <div className="text-sm text-slate-400 italic py-1.5">{t('sched.closed')}</div>
                    )}
                    {windows.map((w, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input type="time" value={w[0]} onChange={(e) => updateWindow(dow, idx, 0, e.target.value)} className="input w-24 text-sm" />
                        <span className="text-slate-400">—</span>
                        <input type="time" value={w[1]} onChange={(e) => updateWindow(dow, idx, 1, e.target.value)} className="input w-24 text-sm" />
                        <button onClick={() => removeWindow(dow, idx)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                    <button onClick={() => addWindow(dow)} className="text-xs text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1">
                      <Plus className="h-3 w-3" /> {t('sched.add_window')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="label">{t('sched.buffer_minutes')}</label>
              <input type="number" className="input" min={0} max={120} value={cal.buffer_minutes} onChange={(e) => setCal({ ...cal, buffer_minutes: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="label">{t('sched.min_notice')}</label>
              <input type="number" className="input" min={0} value={cal.min_notice_hours} onChange={(e) => setCal({ ...cal, min_notice_hours: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="label">{t('sched.max_advance')}</label>
              <input type="number" className="input" min={1} max={365} value={cal.max_advance_days} onChange={(e) => setCal({ ...cal, max_advance_days: parseInt(e.target.value) || 60 })} />
            </div>
          </div>
        </div>
      )}

      {/* LINKS */}
      {tab === 'links' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setEditingLink({ ...DEFAULT_LINK })} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">
              <Plus className="h-4 w-4" /> {t('sched.new_link')}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {data.links.length === 0 && (
              <div className="p-6 text-center text-sm text-slate-500">Ainda sem tipos de reunião configurados.</div>
            )}
            {data.links.map((l) => (
              <div key={l.id} className="p-4 flex items-start justify-between gap-3 hover:bg-slate-50/50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{l.title}</h3>
                    {!l.visible && <span className="text-[10px] uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Oculto</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {l.duration_min} min · {l.price_cents > 0 ? `${(l.price_cents/100).toFixed(2)} €` : t('sched.link.free')} · /{l.slug}
                  </div>
                  {l.description && <p className="text-sm text-slate-600 mt-1.5 line-clamp-2">{l.description}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setEditingLink(l)} className="text-xs px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-700">Editar</button>
                  <button onClick={() => deleteLink(l.id)} className="text-xs px-2.5 py-1.5 rounded-md hover:bg-red-50 text-red-600">Eliminar</button>
                </div>
              </div>
            ))}
          </div>

          {/* Link edit modal */}
          {editingLink && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingLink(null)}>
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
                <h2 className="font-bold text-slate-900 text-lg">{editingLink.id ? 'Editar' : t('sched.new_link')}</h2>
                <div>
                  <label className="label">{t('sched.link.title')}</label>
                  <input className="input" value={editingLink.title || ''} onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })} placeholder="Mentoria 30 min" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">{t('sched.link.duration')}</label>
                    <select className="input" value={editingLink.duration_min || 30} onChange={(e) => setEditingLink({ ...editingLink, duration_min: parseInt(e.target.value) })}>
                      {[15,30,45,60,90,120].map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">{t('sched.link.price')}</label>
                    <input type="number" className="input" min={0} step={1} value={(editingLink.price_cents || 0) / 100} onChange={(e) => setEditingLink({ ...editingLink, price_cents: Math.round(parseFloat(e.target.value || '0') * 100) })} />
                  </div>
                </div>
                <div>
                  <label className="label">{t('sched.link.description')}</label>
                  <textarea className="input min-h-[80px]" value={editingLink.description || ''} onChange={(e) => setEditingLink({ ...editingLink, description: e.target.value })} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={editingLink.visible !== false} onChange={(e) => setEditingLink({ ...editingLink, visible: e.target.checked })} />
                  Visível publicamente
                </label>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setEditingLink(null)} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-700">Cancelar</button>
                  <button onClick={saveLink} disabled={savingLink} className="flex-1 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50">{savingLink ? '…' : t('account.save')}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOOKINGS */}
      {tab === 'bookings' && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {data.upcoming_bookings.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-500">{t('sched.bookings.empty')}</div>
          )}
          {data.upcoming_bookings.map((b) => (
            <div key={b.id} className="p-4 flex items-start justify-between gap-3 hover:bg-slate-50/50">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-slate-500">{new Date(b.scheduled_at).toLocaleString('pt-PT', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                <h3 className="font-semibold text-slate-900 mt-0.5">{b.guest_name}</h3>
                <div className="text-xs text-slate-500">{b.guest_email}{b.guest_phone && ` · ${b.guest_phone}`}</div>
                <div className="text-xs text-slate-600 mt-1">{b.link_title} · {b.duration_min} min{b.price_cents > 0 ? ` · ${(b.price_cents/100).toFixed(2)} €` : ''}</div>
                {b.guest_notes && <p className="text-sm text-slate-700 mt-2 p-2 bg-slate-50 rounded">{b.guest_notes}</p>}
              </div>
              <button onClick={() => cancelBooking(b.id)} className="text-xs px-2.5 py-1.5 rounded-md hover:bg-red-50 text-red-600 flex-shrink-0">Cancelar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
