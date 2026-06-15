'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from '@/i18n/routing';

const TOPICS = [
  { value: 'general', label: 'Pergunta geral' },
  { value: 'sales', label: 'Vendas / Empresas' },
  { value: 'support', label: 'Suporte técnico' },
  { value: 'press', label: 'Imprensa' },
  { value: 'partners', label: 'Parcerias' },
  { value: 'careers', label: 'Carreiras' },
  { value: 'instructor', label: 'Candidatura instrutor' },
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState(defaultTopic);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!email || !message || message.trim().length < 10) {
      toast.error('Preenche email e mensagem (mín 10 caracteres).');
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
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.ok) throw new Error('Falha ao enviar');
      toast.success('Mensagem enviada! Respondemos em breve.');
      setSent(true);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar mensagem');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-10 text-center">
        <div className="inline-flex h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white items-center justify-center shadow-lg mb-4">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Mensagem enviada</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Recebemos a tua mensagem e vamos responder ao email <strong className="text-slate-900">{email}</strong> em menos de 24h.
        </p>
        <button onClick={() => { setSent(false); setName(''); setEmail(''); setSubject(''); setMessage(''); }}
          className="mt-6 text-sm font-semibold text-emerald-700 hover:text-emerald-900">
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 block">Nome</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Como te chamas" maxLength={120}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 block">Email *</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@exemplo.com" maxLength={180}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 block">Assunto</label>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-blue-500 outline-none">
          {TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 block">Título da mensagem (opcional)</label>
        <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
          placeholder="Um resumo de 1 linha" maxLength={200}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 block">
          Mensagem * <span className="text-slate-400 font-normal normal-case">(mín 10 · máx 5000 caracteres)</span>
        </label>
        <textarea required value={message} onChange={(e) => setMessage(e.target.value)}
          rows={7} maxLength={5000}
          placeholder="Descreve o que precisas. Quanto mais contexto deres, melhor a resposta."
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none resize-y" />
        <div className="text-[10px] text-slate-400 mt-1 text-right">{message.length} / 5000</div>
      </div>

      <button type="submit" disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> A enviar...</> : <><Send className="h-4 w-4" /> Enviar mensagem</>}
      </button>

      <p className="text-[11px] text-slate-400 text-center leading-relaxed">
        Ao enviar, aceitas a nossa <Link href={'/legal/privacy' as any} className="underline hover:text-slate-700">Política de Privacidade</Link>.
        Não enviamos spam.
      </p>
    </form>
  );
}
