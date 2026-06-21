'use client';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AgentSuggestionsRail } from '@/components/primitives/AgentSuggestionsRail';
import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Inbox, Loader2, Mail, Reply, Check, Archive, Ban, Phone, CalendarClock, Sparkles, Video } from 'lucide-react';

const STATUSES = ['new', 'read', 'replied', 'spam', 'archived'] as const;

type Booking = { scheduled_at: string; status: string; meeting_url: string | null; duration_min: number | null };
type ReplyT = { body: string; author_kind: string; status: string; created_at: string } | null;
type Msg = {
  id: string; email: string; name: string; phone: string | null; topic: string; subject: string;
  message: string; source_path: string; status: string; created_at: string;
  reply: ReplyT; has_draft: boolean; bookings: Booking[];
};

export function ContactosClient({ initial }: { initial: Partial<Msg>[] }) {
  const t = useTranslations();
  const [messages, setMessages] = useState<Msg[]>(() => (initial || []).map((m) => ({
    ...(m as Msg), reply: (m as Msg).reply ?? null, has_draft: (m as Msg).has_draft ?? false, bookings: (m as Msg).bookings ?? [],
  })));
  const [status, setStatus] = useState<string>('new');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (s: string) => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data } = await sb.rpc('nl_admin_inbox', { p_status: s, p_limit: 100 });
      const res = data as { ok: boolean; messages?: Msg[] };
      setMessages(res?.messages || []);
    } catch { setMessages([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(status); }, [load, status]);

  async function setMsg(id: string, s: string) {
    setBusyId(id);
    try {
      const sb = createClient();
      await sb.rpc('nl_admin_contact_set_status', { p_id: id, p_status: s });
      await load(status);
    } catch { toast.error(t('admin.contacts.error')); }
    finally { setBusyId(null); }
  }

  async function genDraft(id: string) {
    setBusyId(id);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_apoio_reply_generate', { p_message_id: id });
      if (error) throw error;
      toast.success(t('admin.contacts.draft_ready'));
      await load(status);
    } catch { toast.error(t('admin.contacts.error')); }
    finally { setBusyId(null); }
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString();

  return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
      <AdminPageHeader
        emoji="📨"
        title={t('admin.contacts.title')}
        description={t('admin.contacts.desc')}
        actions={
          <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-1.5 text-xs font-medium ${status === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {t(`admin.contacts.status.${s}`)}
              </button>
            ))}
          </div>
        }
      />
      <div className="mb-5">
        <AgentSuggestionsRail surface="support" />
      </div>

      {loading && messages.length === 0 ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900">{t('admin.contacts.empty')}</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => {
            const draft = m.reply && m.reply.status !== 'sent' ? m.reply : null;
            const mailto = `mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || '')}${draft?.body ? `&body=${encodeURIComponent(draft.body)}` : ''}`;
            return (
              <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded font-medium">{m.topic}</span>
                  <span className="font-bold text-slate-900 break-words">{m.subject}</span>
                  {m.bookings && m.bookings.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded font-medium inline-flex items-center gap-1"><CalendarClock className="h-3 w-3" /> {t('admin.contacts.scheduled')}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {t('admin.contacts.field.from')}: <span className="text-slate-700 font-medium">{m.name}</span> · {m.email}
                  {m.phone ? <> · <span className="inline-flex items-center gap-1 align-middle"><Phone className="h-3 w-3" /> {m.phone}</span></> : null}
                </p>
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap break-words">{m.message}</p>
                <p className="text-[11px] text-slate-400 mt-2">
                  {t('admin.contacts.field.received')}: {fmt(m.created_at)} · {t('admin.contacts.field.source')}: <code>{m.source_path}</code>
                </p>

                {m.bookings && m.bookings.length > 0 && (
                  <div className="mt-3 rounded-lg bg-emerald-50/60 border border-emerald-100 p-3 space-y-1">
                    {m.bookings.map((b, i) => (
                      <div key={i} className="text-xs text-emerald-800 flex items-center gap-2 flex-wrap">
                        <CalendarClock className="h-3.5 w-3.5" /> {fmt(b.scheduled_at)} · {b.status}
                        {b.meeting_url && <a href={b.meeting_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline"><Video className="h-3 w-3" /> {t('admin.contacts.join')}</a>}
                      </div>
                    ))}
                  </div>
                )}

                {draft && (
                  <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <div className="text-[11px] font-semibold text-slate-500 mb-1 inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> {t('admin.contacts.draft')}</div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{draft.body}</p>
                  </div>
                )}

                <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t border-slate-100">
                  {!draft && (
                    <button onClick={() => genDraft(m.id)} disabled={busyId === m.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                      {busyId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} {t('admin.contacts.gen_draft')}
                    </button>
                  )}
                  <a href={mailto} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg">
                    <Reply className="h-3 w-3" /> {t('admin.contacts.action.reply')}
                  </a>
                  {m.status !== 'read' && (
                    <button onClick={() => setMsg(m.id, 'read')} disabled={busyId === m.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg disabled:opacity-50">
                      <Mail className="h-3 w-3" /> {t('admin.contacts.action.mark_read')}
                    </button>
                  )}
                  {m.status !== 'replied' && (
                    <button onClick={() => setMsg(m.id, 'replied')} disabled={busyId === m.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg disabled:opacity-50">
                      <Check className="h-3 w-3" /> {t('admin.contacts.action.mark_replied')}
                    </button>
                  )}
                  <button onClick={() => setMsg(m.id, 'spam')} disabled={busyId === m.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg disabled:opacity-50">
                    <Ban className="h-3 w-3" /> {t('admin.contacts.action.spam')}
                  </button>
                  <button onClick={() => setMsg(m.id, 'archived')} disabled={busyId === m.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg disabled:opacity-50">
                    <Archive className="h-3 w-3" /> {t('admin.contacts.action.archive')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
