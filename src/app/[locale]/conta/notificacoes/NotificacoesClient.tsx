'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { Bell, Check } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { notificationHref, notificationCtaKey } from '@/lib/notifications/href';
import { useNotificationText, useUiText } from '@/lib/notifications/text';

function notifyBadge() {
  try { window.dispatchEvent(new Event('nl:notifications-changed')); } catch {}
}

function relTime(locale: string, dateStr: string, nowLabel: string): string {
  const sec = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (sec < 60) return nowLabel;
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const min = Math.round(sec / 60);
    if (min < 60) return rtf.format(-min, 'minute');
    const hr = Math.round(sec / 3600);
    if (hr < 24) return rtf.format(-hr, 'hour');
    const day = Math.round(sec / 86400);
    if (day < 30) return rtf.format(-day, 'day');
    const mon = Math.round(day / 30);
    if (mon < 12) return rtf.format(-mon, 'month');
    return rtf.format(-Math.round(day / 365), 'year');
  } catch {
    return new Date(dateStr).toLocaleDateString(locale);
  }
}

function bucketOf(dateStr: string): 'today' | 'week' | 'earlier' {
  const d = new Date(dateStr).getTime();
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (d >= startToday) return 'today';
  if (d >= startToday - 6 * 86400000) return 'week';
  return 'earlier';
}

export function NotificacoesClient({ initial }: { initial: any[] }) {
  const t = useTranslations();
  const ui = useUiText();
  const locale = useLocale();
  const notifText = useNotificationText();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Abrir Alertas marca como VISTAS (limpa o badge) sem marcar lidas.
  useEffect(() => {
    const sb = createClient();
    (async () => {
      try { await sb.rpc('nl_notifications_mark_seen'); notifyBadge(); } catch {}
    })();
  }, []);

  const visible = filter === 'unread' ? items.filter((n) => !n.read_at) : items;

  const groups = useMemo(() => {
    const order: Array<'today' | 'week' | 'earlier'> = ['today', 'week', 'earlier'];
    const map: Record<string, any[]> = { today: [], week: [], earlier: [] };
    for (const n of visible) map[bucketOf(n.created_at)].push(n);
    return order.filter((k) => map[k].length).map((k) => ({ key: k, items: map[k] }));
  }, [visible]);

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

  async function runAction(n: any, a: any) {
    if (!a || !a.rpc) return;
    const sb = createClient();
    try { await sb.rpc(a.rpc, a.params || {}); } catch {}
    await markRead(n.id);
    setItems((p) => p.map((x) => (x.id === n.id ? { ...x, _actioned: true } : x)));
  }

  function renderCard(n: any) {
    const href = notificationHref(n);
    const isUnread = !n.read_at;
    const isAction = n.priority === 'action';
    const { title, message } = notifText(n);
    const typeLabel = ui('notif.type.' + (n.kind || ''), '');
    const cta = href ? ui(notificationCtaKey(n.link_kind), ui('notif.cta.default', 'Abrir')) : '';
    const actions = Array.isArray(n?.metadata?.actions) ? n.metadata.actions : [];

    const head = (
      <>
        {typeLabel && <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{typeLabel}</span>}
        <h4 className={`text-sm leading-snug break-words ${isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-500'}`}>{title}</h4>
        {message && <p className={`text-[13px] mt-0.5 break-words ${isUnread ? 'text-slate-600' : 'text-slate-400'}`}>{message}</p>}
        {href && cta && <span className="mt-2 inline-block text-xs font-semibold text-brand-700">{cta} <span aria-hidden>{'\u2192'}</span></span>}
      </>
    );

    return (
      <div key={n.id} className={`p-4 pl-3 flex gap-3 border-l-2 ${isUnread && isAction ? 'border-amber-500 bg-amber-50/30' : isUnread ? 'border-brand-400/60 bg-brand-50/20' : 'border-transparent'}`}>
        <div className="flex-1 min-w-0">
          {href ? (
            <Link href={href as any} className="block" onClick={() => isUnread && markRead(n.id)}>{head}</Link>
          ) : head}

          {actions.length > 0 && !n._actioned && (
            <div className="flex flex-wrap gap-2 mt-2.5">
              {actions.map((a: any, i: number) => a.href ? (
                <Link key={i} href={a.href as any} onClick={() => isUnread && markRead(n.id)}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200">
                  {ui(a.label_key || '', a.label || '')}
                </Link>
              ) : (
                <button key={i} onClick={() => runAction(n, a)}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700">
                  {ui(a.label_key || '', a.label || '')}
                </button>
              ))}
            </div>
          )}

          <span className="text-xs text-slate-400 mt-1.5 block">{relTime(locale, n.created_at, t('notifs.now'))}</span>
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
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.key}>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">{ui('notifs.group.' + g.key, g.key)}</h3>
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {g.items.map((n) => renderCard(n))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
