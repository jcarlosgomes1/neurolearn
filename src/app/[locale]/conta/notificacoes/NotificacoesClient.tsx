'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Bell, Check } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { notificationHref, notificationCtaKey } from '@/lib/notifications/href';
import { useNotificationText, useUiText } from '@/lib/notifications/text';

function relTime(date: string, nowLabel: string) {
  const seconds = (Date.now() - new Date(date).getTime()) / 1000;
  if (seconds < 60) return nowLabel;
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
  return new Date(date).toLocaleDateString();
}

function notifyBadge() {
  try { window.dispatchEvent(new Event('nl:notifications-changed')); } catch {}
}

export function NotificacoesClient({ initial }: { initial: any[] }) {
  const t = useTranslations();
  const ui = useUiText();
  const [items, setItems] = useState(initial);
  const notifText = useNotificationText();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const visible = filter === 'unread' ? items.filter((n) => !n.read_at) : items;

  async function markRead(id: string) {
    const sb = createClient();
    await sb.rpc('nl_notifications_mark_read', { p_id: id });
    setItems((p) => p.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    notifyBadge();
  }

  async function markAll() {
    const sb = createClient();
    const ids = items.filter((n) => !n.read_at).map((n) => n.id);
    if (ids.length === 0) return;
    await Promise.all(ids.map((nid: string) => sb.rpc('nl_notifications_mark_read', { p_id: nid })));
    setItems((p) => p.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    notifyBadge();
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <AppPageHeader
        title={t('notifs.title')}
        description={t('notifs.count_summary', { total: items.length, unread: items.filter((n) => !n.read_at).length })}
        actions={
          <div className="flex gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden">
              <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-xs font-medium ${filter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{t('notifs.tab_all')}</button>
              <button onClick={() => setFilter('unread')} className={`px-3 py-1.5 text-xs font-medium ${filter === 'unread' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{t('notifs.tab_unread')}</button>
            </div>
            <button onClick={markAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg">
              <Check className="h-3 w-3" /> {t('notifs.mark_all')}
            </button>
          </div>
        }
      />

      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">{t('notifs.empty')}</h3>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {visible.map((n) => {
            const href = notificationHref(n);
            const isUnread = !n.read_at;
            const { title, message } = notifText(n);
            const cta = href ? ui(notificationCtaKey(n.link_kind), ui('notif.cta.default', 'Abrir')) : '';
            const body = (
              <>
                <h4 className="font-semibold text-slate-900 leading-snug break-words">{title}</h4>
                {message && <p className="text-sm text-slate-600 mt-0.5 break-words">{message}</p>}
                {href && cta && (
                  <span className="mt-2 inline-block text-xs font-semibold text-brand-700">{cta} <span aria-hidden>→</span></span>
                )}
              </>
            );
            return (
              <div key={n.id} className={`p-4 flex gap-3 ${isUnread ? 'bg-brand-50/30' : ''}`}>
                {isUnread && <div className="h-2 w-2 rounded-full bg-brand-500 mt-2 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  {href ? (
                    <Link href={href as any} className="block group" onClick={() => isUnread && markRead(n.id)}>
                      {body}
                    </Link>
                  ) : body}
                  <span className="text-xs text-slate-400 mt-1.5 block">{relTime(n.created_at, t('notifs.now'))}</span>
                </div>
                <div className="flex-shrink-0 self-start">
                  {isUnread ? (
                    <button onClick={() => markRead(n.id)} aria-label={t('notifs.mark_read')} title={t('notifs.mark_read')}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                      <Check className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600/80 whitespace-nowrap">
                      <Check className="h-3.5 w-3.5" /> {t('notifs.read')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
