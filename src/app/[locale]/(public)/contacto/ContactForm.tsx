'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

const TOPICS = [
  { value: 'general', key: 'contactform.topic_general' },
  { value: 'sales', key: 'contactform.topic_sales' },
  { value: 'support', key: 'contactform.topic_support' },
  { value: 'press', key: 'contactform.topic_press' },
  { value: 'partners', key: 'contactform.topic_partners' },
  { value: 'careers', key: 'contactform.topic_careers' },
  { value: 'instructor', key: 'contactform.topic_instructor' },
];

export function ContactForm({
  defaultTopic = 'general',
  defaultSubject = '',
  sourcePath = '/contacto',
}: {
  defaultTopic?: string;
  defaultSubject?: string;
  sourcePath?: string;
}) {
  const t = useTranslations();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState(defaultTopic);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!email || !message || message.trim().length < 10) {
      toast.error(t('contactform.err_fill'));
      return;
    }
    setBusy(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_contact_submit', {
        p_email: email,
        p_message: message,
        p_name: name || null,
        p_topic: topic,
        p_subject: subject || null,
        p_source_path: sourcePath,
        p_phone: phone || null,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.ok) throw new Error(t('contactform.err_send_failed'));
      toast.success(t('contactform.toast_sent'));
      setSent(true);
    } catch (err: any) {
      toast.error(err?.message || t('contactform.err_generic'));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="bg-[var(--card)] rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-10 text-center">
        <div className="inline-flex h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white items-center justify-center shadow-lg mb-4">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--ink)] mb-2">{t('contactform.sent_title')}</h2>
        <p className="text-sm text-[var(--ink-2)] max-w-md mx-auto">
          {t.rich('contactform.sent_body', {
            email,
            b: (chunks) => <strong className="text-[var(--ink)]">{chunks}</strong>,
          })}
        </p>
        <button onClick={() => { setSent(false); setName(''); setEmail(''); setPhone(''); setSubject(''); setMessage(''); }}
          className="mt-6 text-sm font-semibold text-emerald-700 hover:text-emerald-900">
          {t('contactform.sent_again')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-[var(--card)] rounded-2xl border border-[var(--line)] p-6 sm:p-8 space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider font-bold text-[var(--ink-3)] mb-1.5 block">{t('contactform.label_name')}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder={t('contactform.ph_name')} maxLength={120}
            className="w-full px-3 py-2.5 border border-[var(--line)] rounded-lg text-sm focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider font-bold text-[var(--ink-3)] mb-1.5 block">{t('contactform.label_email')} *</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder={t('contactform.ph_email')} maxLength={180}
            className="w-full px-3 py-2.5 border border-[var(--line)] rounded-lg text-sm focus:border-blue-500 outline-none" />
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider font-bold text-[var(--ink-3)] mb-1.5 block">{t('contactform.label_phone')} <span className="text-[var(--ink-3)] font-normal normal-case">{t('contactform.phone_hint')}</span></label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('contactform.ph_phone')} maxLength={40}
          className="w-full px-3 py-2.5 border border-[var(--line)] rounded-lg text-sm focus:border-blue-500 outline-none" />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider font-bold text-[var(--ink-3)] mb-1.5 block">{t('contactform.label_topic')}</label>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}
          className="w-full px-3 py-2.5 border border-[var(--line)] rounded-lg text-sm bg-[var(--card)] focus:border-blue-500 outline-none">
          {TOPICS.map((tp) => <option key={tp.value} value={tp.value}>{t(tp.key)}</option>)}
        </select>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider font-bold text-[var(--ink-3)] mb-1.5 block">{t('contactform.label_subject')}</label>
        <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
          placeholder={t('contactform.ph_subject')} maxLength={200}
          className="w-full px-3 py-2.5 border border-[var(--line)] rounded-lg text-sm focus:border-blue-500 outline-none" />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider font-bold text-[var(--ink-3)] mb-1.5 block">
          {t('contactform.label_message')} * <span className="text-[var(--ink-3)] font-normal normal-case">{t('contactform.message_hint')}</span>
        </label>
        <textarea required value={message} onChange={(e) => setMessage(e.target.value)}
          rows={7} maxLength={5000}
          placeholder={t('contactform.ph_message')}
          className="w-full px-3 py-2.5 border border-[var(--line)] rounded-lg text-sm focus:border-blue-500 outline-none resize-y" />
        <div className="text-[10px] text-[var(--ink-3)] mt-1 text-right">{message.length} / 5000</div>
      </div>

      <button type="submit" disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('contactform.btn_sending')}</> : <><Send className="h-4 w-4" /> {t('contactform.btn_send')}</>}
      </button>

      <p className="text-[11px] text-[var(--ink-3)] text-center leading-relaxed">
        {t.rich('contactform.privacy_consent', {
          privacy: (chunks) => <Link href={'/legal/privacy' as any} className="underline hover:text-[var(--ink-2)]">{chunks}</Link>,
        })}
      </p>
    </form>
  );
}
