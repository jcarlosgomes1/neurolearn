'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Loader2, Users, UserPlus } from 'lucide-react';
import { EmptyState } from '@/components/primitives/EmptyState';

/** Aba Convidados do workspace do evento: RSVPs + candidatos a convite. Reutiliza nl_admin_event_rsvps. */
export function EventoConvidadosPanel({ eventId }: { eventId: string }) {
  const t = useTranslations();
  const [d, setD] = useState<any>(null);

  const load = useCallback(async () => {
    try { const sb = createClient(); const { data } = await sb.rpc('nl_admin_event_rsvps', { p_id: eventId }); setD(data); } catch { setD({ ok: false }); }
  }, [eventId]);
  useEffect(() => { load(); }, [load]);

  if (d === null) return <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  const rsvps = d?.items || [];
  const invitees = d?.invitees || [];
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-emerald-600" /><h3 className="text-sm font-semibold text-slate-900">{t('evt.g_rsvp_title')}</h3><span className="text-[11px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">{rsvps.length}</span></div>
        {rsvps.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white"><EmptyState icon={Users} title={t('evt.g_rsvp_empty')} /></div> : (
          <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
            {rsvps.map((r: any, i: number) => (<div key={i} className="flex items-center justify-between px-4 py-2.5"><span className="text-sm text-slate-800">{r.name || r.user_id}</span></div>))}
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2"><UserPlus className="h-4 w-4 text-violet-600" /><h3 className="text-sm font-semibold text-slate-900">{t('evt.g_inv_title')}</h3><span className="text-[11px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-semibold">{invitees.length}</span></div>
        {invitees.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white"><EmptyState icon={UserPlus} title={t('evt.g_inv_empty')} /></div> : (
          <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
            {invitees.map((iv: any, i: number) => (<div key={i} className="flex items-center justify-between px-4 py-2.5"><div className="min-w-0"><div className="text-sm text-slate-800 truncate">{iv.name || iv.email}</div>{iv.match_reason && <div className="text-[11px] text-slate-400 truncate">{iv.match_reason}</div>}</div>{iv.status && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{iv.status}</span>}</div>))}
          </div>
        )}
      </div>
    </div>
  );
}
