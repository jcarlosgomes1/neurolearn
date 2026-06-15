'use client';

import { useEffect, useState, useRef } from 'react';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useNotificationText } from '@/lib/notifications/text';
import { Bell, Check, X } from 'lucide-react';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const notifText = useNotificationText();
  const [unread, setUnread] = useState(0);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_notifications_unread_summary');
      if (data?.ok) {
        setUnread(data.count || 0);
        setRecent(data.recent || []);
      }
    } catch {}
  }

  useEffect(() => {
    load();
    const sb = createClient();
    // Realtime subscription
    let channel: any;
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = sb.channel('nl_notifs_' + user.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nl_notifications', filter: `user_id=eq.${user.id}` },
          () => load())
        .subscribe();
    });
    return () => { if (channel) sb.removeChannel(channel); };
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function markRead(id: string) {
    const sb = createClient();
    await sb.rpc('nl_notifications_mark_read', { p_id: id });
    load();
  }

  async function markAllRead() {
    setLoading(true);
    const sb = createClient();
    await sb.rpc('nl_notifications_mark_read', { p_id: null });
    await load();
    setLoading(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)}
        className="relative p-2 hover:bg-slate-100 rounded-lg text-slate-600">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between p-3 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Notificações</h3>
              {unread > 0 && <p className="text-[11px] text-slate-500">{unread} por ler</p>}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} disabled={loading}
                className="text-[11px] text-brand-600 hover:underline font-medium disabled:opacity-50">
                Marcar tudo
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {recent.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Sem notificações</p>
              </div>
            ) : (
              recent.map((n) => (
                <button key={n.id} onClick={() => markRead(n.id)}
                  className={`block w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${!n.read_at ? 'bg-blue-50/50' : ''}`}>
                  <div className="flex items-start gap-2">
                    {!n.read_at && <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">{notifText(n).title}</div>
                      {n.message && <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notifText(n).message}</div>}
                      <div className="text-[10px] text-slate-400 mt-1">{relTime(n.created_at)}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="border-t border-slate-100 p-2">
            <Link href={'/conta/notificacoes' as any} onClick={() => setOpen(false)}
              className="block text-center text-xs text-slate-600 hover:text-brand-700 py-1.5">
              Ver todas →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function relTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'agora';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('pt-PT');
}
