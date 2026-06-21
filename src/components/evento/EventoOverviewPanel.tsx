'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import { Loader2, Users, Megaphone, UserPlus, Video, MapPin, Clock, Globe } from 'lucide-react';

/** Aba Visão geral do workspace do evento. Reutiliza nl_admin_event_get. */
export function EventoOverviewPanel({ eventId }: { eventId: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const sb = createClient(); const { data } = await sb.rpc('nl_admin_event_get', { p_id: eventId }); setD(data); } catch { setD(null); } finally { setLoading(false); }
  }, [eventId]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (!d?.ok) return <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-400 text-center">{t('evt.not_found')}</div>;
  const e = d.event;
  function fmt(iso: string | null) { if (!iso) return '—'; try { return new Date(iso).toLocaleString(locale === 'pt' ? 'pt-PT' : locale, { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; } }
  const rows: Array<[any, string, any]> = [
    [Clock, t('evt.o_when'), fmt(e.starts_at)],
    [Clock, t('evt.o_duration'), e.duration_min ? `${e.duration_min} min` : '—'],
    [e.mode === 'online' ? Video : MapPin, t('evt.o_mode'), [e.mode, e.location || e.url].filter(Boolean).join(' · ') || '—'],
    [Users, t('evt.o_capacity'), e.capacity ?? '—'],
    [Globe, t('evt.o_language'), e.language || '—'],
  ];
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><Users className="h-5 w-5 text-slate-400 mb-1" /><div className="text-2xl font-bold text-slate-900">{d.rsvp_count}</div><div className="text-xs text-slate-500">{t('evt.kpi_rsvp')}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><UserPlus className="h-5 w-5 text-slate-400 mb-1" /><div className="text-2xl font-bold text-slate-900">{d.invitee_count}</div><div className="text-xs text-slate-500">{t('evt.kpi_invitees')}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><Megaphone className="h-5 w-5 text-slate-400 mb-1" /><div className="text-2xl font-bold text-slate-900">{d.promo_count}</div><div className="text-xs text-slate-500">{t('evt.kpi_promos')}</div></div>
      </div>
      {e.description && <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-700 whitespace-pre-wrap">{e.description}</p></div>}
      <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
        {rows.map(([Icon, label, val], i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5"><Icon className="h-4 w-4 text-slate-400 flex-shrink-0" /><span className="text-xs text-slate-500 w-28 flex-shrink-0">{label}</span><span className="text-sm text-slate-800 capitalize">{val}</span></div>
        ))}
      </div>
    </div>
  );
}
