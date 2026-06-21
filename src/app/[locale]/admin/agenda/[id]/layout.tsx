import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { EventoTabs } from './EventoTabs';

export default async function EventoLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data } = await sb.rpc('nl_admin_event_get', { p_id: id });
  const d = data as { ok?: boolean; event?: { title?: string; status?: string } } | null;
  const title = (d?.ok && d.event?.title) ? d.event.title : t('evt_ws.fallback');
  const status = d?.ok ? (d.event?.status || '') : '';
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
        <Link href={'/admin/agenda' as any} className="hover:text-slate-900 font-medium">{t('evt_ws.crumb')}</Link>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-900 truncate">{title}</span>
        {status && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{status}</span>}
      </div>
      <div className="border-b border-slate-200 mb-5"><EventoTabs eventId={id} /></div>
      {children}
    </div>
  );
}
