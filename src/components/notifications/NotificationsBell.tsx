'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, Check, X, ExternalLink } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useNotificationText } from '@/lib/notifications/text';

type Notif = { id: string; kind: string; title: string; message: string; link_kind?: string; link_id?: string; read_at?: string; created_at: string };

function relTime(date: string) {
  const seconds = (Date.now() - new Date(date).getTime()) / 1000;
  if (seconds < 60) return 'agora';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
  if (seconds < 604800) return Math.floor(seconds / 86400) + 'd';
  return new Date(date).toLocaleDateString('pt-PT');
}

function notifLink(kind?: string, id?: string): string | null {
  if (!kind || !id) return null;
  switch (kind) {
    case 'course': return `/curso/${id}`;
    case 'org': return `/empresa/${id}`;
    case 'inquiry': return `/teach/pedidos`;
    case 'placement': return `/talento/meus-pedidos`;
    default: return null;
  }
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const notifText = useNotificationText();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sb = createClient();
    let active = true;
    async function refresh() {
      const { data } = await sb.rpc('nl_notifications_unread_count');
      if (active) setCount(typeof data === 'number' ? data : (data as any)?.count || 0);
    }
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => { active = false; clearInterval(interval); };
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
      const { data } = await sb.rpc('nl_notifications_list', { p_limit: 10, p_offset: 0 });
      const list = (data as any)?.notifications || [];
      setItems(list);
    } finally { setLoading(false); }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) loadItems();
  }

  async function markRead(id: string) {
    const sb = createClient();
    await sb.rpc('nl_notifications_mark_read', { p_ids: [id] });
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    setCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    const sb = createClient();
    const unread = items.filter((n) => !n.read_at).map((n) => n.id);
    if (unread.length === 0) return;
    await sb.rpc('nl_notifications_mark_read', { p_ids: unread });
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    setCount(0);
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={toggle} aria-label="Notificações"
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
            <h3 className="font-semibold text-slate-900">Notificações</h3>
            {count > 0 && (
              <button onClick={markAllRead} className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">
                <Check className="h-3 w-3" /> Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-500">A carregar…</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Sem notificações</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((n) => {
                  const href = notifLink(n.link_kind, n.link_id);
                  const isUnread = !n.read_at;
                  const inner = (
                    <div className={`p-3 hover:bg-slate-50 ${isUnread ? 'bg-brand-50/40' : ''}`}>
                      <div className="flex items-start gap-2">
                        {isUnread && <div className="h-2 w-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-slate-900 leading-snug">{notifText(n).title}</h4>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">{relTime(n.created_at)}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notifText(n).message}</p>
                        </div>
                        {isUnread && (
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); markRead(n.id); }}
                            className="p-1 text-slate-400 hover:text-emerald-600" aria-label="Marcar lida">
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
              Ver todas →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
