'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, Check } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { useNotificationText, useUiText } from '@/lib/notifications/text';
import { notificationHref } from '@/lib/notifications/href';

type Notif = { id: string; kind: string; title: string; message: string; link_kind?: string; link_id?: string; metadata?: any; priority?: string; read_at?: string; seen_at?: string; created_at: string };

export function NotificationsBell() {
  const t = useTranslations();
  const ui = useUiText();
  const locale = useLocale();
  const notifText = useNotificationText();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function rel(dateStr: string): string {
    const sec = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (sec < 60) return t('notifs.now');
    try {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      const min = Math.round(sec / 60); if (min < 60) return rtf.format(-min, 'minute');
      const hr = Math.round(sec / 3600); if (hr < 24) return rtf.format(-hr, 'hour');
      const day = Math.round(sec / 86400); if (day < 30) return rtf.format(-day, 'day');
      const mon = Math.round(day / 30); if (mon < 12) return rtf.format(-mon, 'month');
      return rtf.format(-Math.round(day / 365), 'year');
    } catch { return new Date(dateStr).toLocaleDateString(locale); }
  }

  useEffect(() => {
    const sb = createClient();
    let active = true;
    async function refresh() {
      try {
        const { data } = await sb.rpc('nl_notifications_unseen_count');
        if (active) setCount(typeof data === 'number' ? data : 0);
      } catch {}
    }
    refresh();
    const interval = setInterval(refresh, 60_000);
    const onChanged = () => refresh();
    window.addEventListener('nl:notifications-changed', onChanged);
    return () => { active = false; clearInterval(interval); window.removeEventListener('nl:notifications-changed', onChanged); };
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_notifications_list', { p_limit: 10 });
      setItems(Array.isArray(data) ? (data as Notif[]) : []);
    } finally { setLoading(false); }
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      loadItems();
      const sb = createClient();
      try { await sb.rpc('nl_notifications_mark_seen'); } catch {}
      setCount(0);
      try { window.dispatchEvent(new Event('nl:notifications-changed')); } catch {}
    }
  }

  async function markRead(id: string) {
    const sb = createClient();
    await sb.rpc('nl_notifications_mark_read', { p_id: id });
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    try { window.dispatchEvent(new Event('nl:notifications-changed')); } catch {}
  }

  async function markAllRead() {
    const sb = createClient();
    const unread = items.filter((n) => !n.read_at).map((n) => n.id);
    if (unread.length === 0) return;
    await Promise.all(unread.map((id) => sb.rpc('nl_notifications_mark_read', { p_id: id })));
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    try { window.dispatchEvent(new Event('nl:notifications-changed')); } catch {}
  }

  const hasUnread = items.some((n) => !n.read_at);

  return (
    <div ref={ref} className="relative">
      <button onClick={toggle} aria-label={t('notifs.title')}
        className="relative p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900">
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-[480px] flex flex-col">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">{t('notifs.title')}</h3>
            {hasUnread && (
              <button onClick={markAllRead} className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">
                <Check className="h-3 w-3" /> {t('notifs.mark_all')}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-500">{t('notifs.loading')}</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">{t('notifs.empty')}</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((n) => {
                  const href = notificationHref(n);
                  const isUnread = !n.read_at;
                  const eyebrow = ui('notif.type.' + n.kind, '');
                  const inner = (
                    <div className={`p-3 hover:bg-slate-50 ${isUnread ? 'bg-brand-50/40' : ''}`}>
                      <div className="flex items-start gap-2">
                        {isUnread && <div className="h-2 w-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          {eyebrow ? <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium mb-0.5">{eyebrow}</p> : null}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm leading-snug ${isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-600'}`}>{notifText(n).title}</h4>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">{rel(n.created_at)}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notifText(n).message}</p>
                        </div>
                        {isUnread && (
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); markRead(n.id); }}
                            className="p-1 text-slate-400 hover:text-emerald-600" aria-label={t('notifs.mark_read')}>
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {href ? (
                        <Link href={href as any} onClick={() => { if (isUnread) markRead(n.id); setOpen(false); }} className="block">
                          {inner}
                        </Link>
                      ) : inner}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="p-2 border-t border-slate-100">
            <Link href={'/conta/notificacoes' as any} onClick={() => setOpen(false)}
              className="block text-center text-xs text-brand-600 hover:underline py-1">
              {t('notifs.see_all')} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
