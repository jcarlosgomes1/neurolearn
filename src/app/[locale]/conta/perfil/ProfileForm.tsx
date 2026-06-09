'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { User, Save, Loader2 } from 'lucide-react';

interface Initial {
  name: string;
  bio: string;
  phone: string;
  phone_country_code: string;
  country_code: string;
  preferred_lang: string;
}

const LANGS = [
  { v: 'pt', l: 'Português' },
  { v: 'en', l: 'English' },
  { v: 'es', l: 'Español' },
  { v: 'fr', l: 'Français' },
];

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-100';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

export function ProfileForm({ email, handle, initial }: { email: string; handle: string; initial: Initial }) {
  const [form, setForm] = useState<Initial>(initial);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Initial, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_update_my_profile', {
        p_name: form.name || null,
        p_preferred_lang: form.preferred_lang || null,
        p_phone: form.phone || null,
        p_phone_country_code: form.phone_country_code || null,
        p_country_code: form.country_code || null,
        p_bio: form.bio || null,
      });
      if (error) throw error;
      toast.success('Perfil atualizado');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao guardar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-violet-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <User className="h-3.5 w-3.5" /> A minha conta
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Perfil</h1>
        <p className="text-sm text-slate-600 mt-1.5">Gere os teus dados pessoais e preferências.</p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        <Field label="Email" hint="O email é usado para iniciar sessão e não pode ser alterado aqui.">
          <input value={email} disabled className={`${inputCls} bg-slate-50 text-slate-500 cursor-not-allowed`} />
        </Field>

        {handle && (
          <Field label="Handle público">
            <input value={`@${handle}`} disabled className={`${inputCls} bg-slate-50 text-slate-500 cursor-not-allowed`} />
          </Field>
        )}

        <Field label="Nome">
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="O teu nome" className={inputCls} />
        </Field>

        <Field label="Bio" hint="Uma breve descrição sobre ti (visível no teu perfil público).">
          <textarea
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            rows={3}
            placeholder="Conta-nos um pouco sobre ti..."
            className={`${inputCls} resize-none`}
          />
        </Field>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <Field label="Indicativo">
              <input value={form.phone_country_code} onChange={(e) => set('phone_country_code', e.target.value)} placeholder="+351" className={inputCls} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Telefone">
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="912 345 678" className={inputCls} />
            </Field>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="País (código)">
            <input value={form.country_code} onChange={(e) => set('country_code', e.target.value.toUpperCase())} placeholder="PT" maxLength={2} className={inputCls} />
          </Field>
          <Field label="Idioma preferido">
            <select value={form.preferred_lang} onChange={(e) => set('preferred_lang', e.target.value)} className={inputCls}>
              {LANGS.map((l) => (
                <option key={l.v} value={l.v}>{l.l}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="pt-2">
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar alterações
          </button>
        </div>
      </div>
    </div>
  );
}
