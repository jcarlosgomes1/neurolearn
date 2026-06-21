'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import { Loader2, Megaphone } from 'lucide-react';
import { EmptyState } from '@/components/primitives/EmptyState';

/** Aba Promoções do workspace do evento. Reutiliza nl_admin_event_promotions. */
export function EventoPromocoesPanel({ eventId }: { eventId: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const [items, setItems] = useState<any[] | null>(null);

  const load = useCallback(async () => {
    try { const sb = createClient(); const { data } = await sb.rpc('nl_admin_event_promotions', { p_id: eventId }); setItems((data as any)?.items || []); } catch { setItems([]); }
  }, [eventId]);
  useEffect(() => { load(); }, [load]);

  if (items === null) return <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (items.length === 0) return <div className="rounded-2xl border border-slate-200 bg-white"><EmptyState icon={Megaphone} title={t('evt.p_empty_title')} hint={t('evt.p_empty_hint')} /></div>;
  function fmt(iso: string | null) { if (!iso) return '—'; try { return new Date(iso).toLocaleDateString(locale === 'pt' ? 'pt-PT' : locale, { day: '2-digit', month: 'short' }); } catch { return iso; } }
  return (
    <div className="space-y-2 max-w-3xl">
      {items.map((p: any) => (
        <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white">
          <div className="min-w-0"><div className="text-sm font-medium text-slate-900">{p.channel || '—'} · {p.scope || '—'}</div><div className="text-[11px] text-slate-400">{t('evt.p_created')}: {fmt(p.created_at)}{p.sent_at ? ` · ${t('evt.p_sent')}: ${fmt(p.sent_at)}` : ''}</div></div>
          {p.status && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{p.status}</span>}
        </div>
      ))}
    </div>
  );
}
