'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Loader2, Ticket, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '@/components/primitives/EmptyState';

/** Aba Registos do workspace do evento: inscrições públicas (nl_webinar_registrations, por session_id). */
export function EventoRegistosPanel({ eventId }: { eventId: string }) {
  const t = useTranslations();
  const [d, setD] = useState<any>(null);

  const load = useCallback(async () => {
    try { const sb = createClient(); const { data } = await sb.rpc('nl_admin_event_registrations', { p_id: eventId }); setD(data); } catch { setD({ ok: false }); }
  }, [eventId]);
  useEffect(() => { load(); }, [load]);

  if (d === null) return <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  const items = d?.items || [];
  const total = d?.total ?? items.length;
  const attended = d?.attended ?? 0;
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <Ticket className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-900">{t('evt.reg_title')}</h3>
        <span className="text-[11px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">{total}</span>
        {attended > 0 && <span className="text-[11px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{attended}</span>}
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white"><EmptyState icon={Ticket} title={t('evt.reg_empty')} /></div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
          {items.map((r: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <div className="text-sm text-slate-800 truncate">{r.name || r.email}</div>
                <div className="text-[11px] text-slate-400 truncate">{r.email}{r.lang ? ` · ${String(r.lang).toUpperCase()}` : ''}{r.source ? ` · ${r.source}` : ''}</div>
              </div>
              {r.attended && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{t('evt.reg_attended')}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
