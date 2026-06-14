'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Bell, ArrowLeft, Trash2, Check, CheckCheck, X, Loader2 } from 'lucide-react';
import { markNotificationReadAction, deleteNotificationAction } from '../actions';
import { notificationHref } from '@/lib/notifications/href';

interface Notification {
  id: string; kind: string; title: string; message: string;
  link_kind: string | null; link_id: string | null; metadata: Record<string, unknown>;
  read_at: string | null; created_at: string;
}

export function NotificationsListClient({ initial, locale }: { initial: Notification[]; locale: string }) {
  const t = useTranslations();
  const [items, setItems] = useState<Notification[]>(initial);
  const [isPending, startTransition] = useTransition();
  const unread = items.filter((i) => !i.read_at).length;

  function handleMarkAll() {
    startTransition(async () => {
      const r = await markNotificationReadAction();
      if (r.ok) {
        setItems((prev) => prev.map((i) => ({ ...i, read_at: new Date().toISOString() })));
        toast.success(t('notifs.marked_all_done'));
      }
    });
  }

  function handleMark(id: string) {
    startTransition(async () => {
      await markNotificationReadAction(id);
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, read_at: new Date().toISOString() } : i));
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteNotificationAction(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <Link href={`/conta` as any} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> {t('btn.back')}
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Bell className="h-6 w-6 text-brand-600" /> {t('notifs.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{unread > 0 ? t('notifs.unread_count', { count: unread }) : t('notifs.all_caught_up')}</p>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAll} disabled={isPending} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 text-sm border border-slate-200">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
            {t('notifs.mark_all')}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Bell className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">{t('notifs.empty')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {items.map((n) => {
            const href = notificationHref(n);
            return (
              <div key={n.id} className={`flex items-start gap-3 p-3 sm:p-4 hover:bg-slate-50 ${!n.read_at ? 'bg-brand-50/30' : ''}`}>
                {!n.read_at && <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  {href ? (
                    <Link href={href as any} onClick={() => handleMark(n.id)}>
                      <div className="font-semibold text-slate-900">{n.title}</div>
                      <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                    </Link>
                  ) : (
                    <>
                      <div className="font-semibold text-slate-900">{n.title}</div>
                      <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                    </>
                  )}
                  <div className="text-xs text-slate-400 mt-2">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-1">
                  {!n.read_at && (
                    <button onClick={() => handleMark(n.id)} disabled={isPending} title={t('notifs.mark_read_title')}
                      className="p-1.5 rounded hover:bg-slate-200"><Check className="h-3.5 w-3.5 text-slate-500" /></button>
                  )}
                  <button onClick={() => handleDelete(n.id)} disabled={isPending} title={t('notifs.delete')}
                    className="p-1.5 rounded hover:bg-red-100"><X className="h-3.5 w-3.5 text-slate-500" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
