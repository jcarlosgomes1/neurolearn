'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { Bell, X, Check, CheckCheck, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import {
  listNotificationsAction, getUnreadCountAction, markNotificationReadAction, deleteNotificationAction
} from '@/app/[locale]/conta/actions';
import { notificationHref } from '@/lib/notifications/href';
import { useNotificationText } from '@/lib/notifications/text';

interface Notification {
  id: string;
  kind: string;
  title: string;
  message: string;
  link_kind: string | null;
  link_id: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('pt-PT');
}

export function NotificationsDropdown({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const notifText = useNotificationText();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Bloquear scroll do body quando dropdown aberto em mobile
  useEffect(() => {
    if (open && typeof window !== 'undefined' && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  async function refreshCount() {
    const r = await getUnreadCountAction();
    if (r.ok) setUnread(r.count);
  }

  async function loadItems() {
    setLoading(true);
    const r = await listNotificationsAction(false, 20);
    if (r.ok) setItems((r.data as Notification[]) || []);
    setLoading(false);
  }

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) loadItems();
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markNotificationReadAction();
      setItems((prev) => prev.map((i) => ({ ...i, read_at: new Date().toISOString() })));
      setUnread(0);
    });
  }
  function handleMarkOne(id: string) {
    startTransition(async () => {
      await markNotificationReadAction(id);
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, read_at: new Date().toISOString() } : i));
      refreshCount();
    });
  }
  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteNotificationAction(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      refreshCount();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={toggleOpen} aria-label="Notificações"
        className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop mobile only */}
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 sm:hidden" onClick={() => setOpen(false)} />
          <div
            className="
              fixed inset-x-3 top-16 z-50
              sm:absolute sm:right-0 sm:top-auto sm:inset-x-auto sm:mt-2
              w-auto sm:w-96 max-w-md sm:max-w-none
              bg-white rounded-2xl border border-slate-200 shadow-2xl
              max-h-[80vh] sm:max-h-[70vh] flex flex-col
              animate-in fade-in slide-in-from-top-2 duration-150
            ">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Notificações</h3>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button onClick={handleMarkAll} disabled={isPending}
                    className="text-xs text-brand-600 hover:bg-brand-50 px-2 py-1 rounded font-medium flex items-center gap-1">
                    <CheckCheck className="h-3 w-3" /> Marcar todas
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg" aria-label="Fechar">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" />
                </div>
              ) : items.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-400">
                  <Bell className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                  Sem notificações
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {items.map((n) => {
                    const href = notificationHref(n);
                    return (
                    <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 group ${!n.read_at ? 'bg-brand-50/40' : ''}`}>
                      <div className="flex items-start gap-2">
                        {!n.read_at && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          {href ? (
                            <Link href={href as any} onClick={() => { handleMarkOne(n.id); setOpen(false); }}
                              className="block">
                              <div className="font-medium text-slate-900 text-sm leading-snug">{notifText(n).title}</div>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{notifText(n).message}</p>
                            </Link>
                          ) : (
                            <div>
                              <div className="font-medium text-slate-900 text-sm leading-snug">{notifText(n).title}</div>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{notifText(n).message}</p>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</div>
                        </div>
                        <div className="opacity-100 sm:opacity-0 group-hover:opacity-100 flex flex-col gap-0.5 transition-opacity">
                          {!n.read_at && (
                            <button onClick={() => handleMarkOne(n.id)} title="Marcar como lida"
                              className="p-1 hover:bg-slate-200 rounded"><Check className="h-3.5 w-3.5 text-slate-500" /></button>
                          )}
                          <button onClick={() => handleDelete(n.id)} title="Eliminar"
                            className="p-1 hover:bg-rose-100 rounded"><X className="h-3.5 w-3.5 text-slate-500" /></button>
                        </div>
                      </div>
                    </div>
                  ); })}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-slate-100 p-2">
                <Link href={`/conta/notificacoes` as any} onClick={() => setOpen(false)}
                  className="block text-center text-xs text-brand-600 hover:bg-brand-50 py-2 rounded font-medium">
                  Ver todas
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
