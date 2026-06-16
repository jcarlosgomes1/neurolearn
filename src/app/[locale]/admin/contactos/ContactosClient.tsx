'use client';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { listContactMessagesAction, setContactStatusAction } from './actions';
import { Inbox, Loader2, Mail, Reply, Check, Archive, Ban } from 'lucide-react';

const STATUSES = ['new', 'read', 'replied', 'spam', 'archived'] as const;

type Msg = {
  id: string; email: string; name: string; topic: string; subject: string;
  message: string; source_path: string; status: string; created_at: string;
};

export function ContactosClient({ initial }: { initial: Msg[] }) {
  const t = useTranslations();
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [status, setStatus] = useState<string>('new');
  const [pending, startTransition] = useTransition();

  async function reload(s = status) {
    const r = await listContactMessagesAction(s);
    if (r?.ok && Array.isArray(r.messages)) setMessages(r.messages as Msg[]);
  }
  function changeStatus(s: string) {
    setStatus(s);
    startTransition(() => reload(s));
  }
  function setMsg(id: string, s: string) {
    startTransition(async () => { await setContactStatusAction(id, s); await reload(); });
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
      <AdminPageHeader
        emoji="📨"
        title={t('admin.contacts.title')}
        description={t('admin.contacts.desc')}
        actions={
          <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                className={`px-3 py-1.5 text-xs font-medium ${status === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {t(`admin.contacts.status.${s}`)}
              </button>
            ))}
          </div>
        }
      />

      {pending && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      )}

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900">{t('admin.contacts.empty')}</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded font-medium">{m.topic}</span>
                  <span className="font-bold text-slate-900 break-words">{m.subject}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {t('admin.contacts.field.from')}: <span className="text-slate-700 font-medium">{m.name}</span> · {m.email}
                </p>
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap break-words">{m.message}</p>
                <p className="text-[11px] text-slate-400 mt-2">
                  {t('admin.contacts.field.received')}: {new Date(m.created_at).toLocaleString()} · {t('admin.contacts.field.source')}: <code>{m.source_path}</code>
                </p>
              </div>
              <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t border-slate-100">
                <a
                  href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || '')}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
                >
                  <Reply className="h-3 w-3" /> {t('admin.contacts.action.reply')}
                </a>
                {m.status !== 'read' && (
                  <button onClick={() => setMsg(m.id, 'read')} disabled={pending}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg disabled:opacity-50">
                    <Mail className="h-3 w-3" /> {t('admin.contacts.action.mark_read')}
                  </button>
                )}
                {m.status !== 'replied' && (
                  <button onClick={() => setMsg(m.id, 'replied')} disabled={pending}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg disabled:opacity-50">
                    <Check className="h-3 w-3" /> {t('admin.contacts.action.mark_replied')}
                  </button>
                )}
                <button onClick={() => setMsg(m.id, 'spam')} disabled={pending}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg disabled:opacity-50">
                  <Ban className="h-3 w-3" /> {t('admin.contacts.action.spam')}
                </button>
                <button onClick={() => setMsg(m.id, 'archived')} disabled={pending}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg disabled:opacity-50">
                  <Archive className="h-3 w-3" /> {t('admin.contacts.action.archive')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
