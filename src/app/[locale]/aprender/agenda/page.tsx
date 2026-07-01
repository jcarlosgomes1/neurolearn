import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { UserAvatar } from '@/components/account/UserAvatar';
import { AddToCalendar } from '@/components/agenda/AddToCalendar';
import { Video, Calendar, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';
export async function generateMetadata() { return { title: 'Agenda · NeuroLearn' }; }

type AgendaRow = {
  kind: 'live' | 'booking'; ref_id: string; title: string | null; subtitle: string | null;
  starts_at: string; ends_at: string | null; status: string | null; join_url: string | null;
  host_name: string | null; host_handle: string | null; host_avatar: string | null;
  course_id: string | null; manage_token: string | null; is_past: boolean;
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data } = await sb.rpc('nl_calendar_agenda');
  const rows = ((data || []) as AgendaRow[]);
  const upcoming = rows.filter((r) => !r.is_past);
  const past = rows.filter((r) => r.is_past).reverse();

  const cancelled = (s: string | null) => s === 'cancelled' || s === 'canceled';
  const statusLabel = (s: string | null) => {
    const map: Record<string, string> = {
      confirmed: t('agenda.status_confirmed'), scheduled: t('agenda.status_scheduled'),
      cancelled: t('agenda.status_cancelled'), canceled: t('agenda.status_cancelled'),
      completed: t('agenda.status_completed'), ended: t('agenda.status_ended'), live: t('agenda.status_live'),
    };
    return s ? (map[s] || s) : '';
  };
  const statusTone = (s: string | null) => {
    if (cancelled(s)) return 'bg-rose-100 text-rose-700';
    if (s === 'live') return 'bg-emerald-100 text-emerald-700';
    if (s === 'completed' || s === 'ended') return 'bg-slate-100 text-slate-500';
    return 'bg-brand-100 text-brand-700';
  };
  const fmt = (iso: string) => new Date(iso).toLocaleString(locale, { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const renderItem = (r: AgendaRow) => {
    const title = r.title || t('agenda.untitled');
    const kindLabel = r.kind === 'live' ? t('agenda.kind_live') : t('agenda.kind_booking');
    const canJoin = !!r.join_url && !r.is_past && !cancelled(r.status);
    return (
      <div key={r.kind + r.ref_id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-brand-500 to-brand-500 text-white">
            {r.kind === 'live' ? <Video className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{kindLabel}</span>
              {r.status && <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusTone(r.status)}`}>{statusLabel(r.status)}</span>}
            </div>
            <h3 className="font-semibold text-slate-900 mt-0.5 truncate">{title}</h3>
            <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="capitalize">{fmt(r.starts_at)}</span>
            </div>
            {r.host_name && (
              <div className="flex items-center gap-2 mt-2">
                <UserAvatar seed={r.host_handle || r.host_name} name={r.host_name} url={r.host_avatar || undefined} size={20} />
                <span className="text-sm text-slate-600">{t('agenda.with')} {r.host_name}</span>
              </div>
            )}
            {(!r.is_past && !cancelled(r.status)) && (
              <div className="flex items-center gap-2 mt-3">
                {canJoin && (
                  <a href={r.join_url as string} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors">
                    <Video className="h-4 w-4" /> {t('agenda.join')}
                  </a>
                )}
                <AddToCalendar title={title} startIso={r.starts_at} endIso={r.ends_at} url={r.join_url} label={t('agenda.add_to_calendar')} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="">
      <AppPageHeader title={t('agenda.page_title')} description={t('agenda.page_sub')} />
      {rows.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">{t('agenda.empty')}</div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">{t('agenda.upcoming')}</h2>
              <div className="space-y-3">{upcoming.map(renderItem)}</div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">{t('agenda.past')}</h2>
              <div className="space-y-3 opacity-75">{past.map(renderItem)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
