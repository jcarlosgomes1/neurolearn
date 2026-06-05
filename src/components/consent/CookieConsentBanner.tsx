'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Cookie, X, ChevronDown } from 'lucide-react';

const CATEGORIES = [
  { key: 'necessary', label: 'Essenciais', desc: 'Login, segurança, preferências básicas. Sempre activos.', required: true },
  { key: 'functional', label: 'Funcionais', desc: 'Memorizar preferências, idioma, theme, currency.', required: false },
  { key: 'analytics', label: 'Analytics', desc: 'Medição de uso para melhorar a plataforma.', required: false },
  { key: 'marketing', label: 'Marketing', desc: 'Personalização de anúncios e retargeting.', required: false },
];

export function CookieConsentBanner() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [pending, startTransition] = useTransition();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    necessary: true, functional: true, analytics: false, marketing: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const localStorageOk = localStorage.getItem('nl_consent_v1');
    if (localStorageOk) return;
    
    const sb = createClient();
    sb.rpc('nl_cookie_consent_get').then(({ data }: any) => {
      if (data?.consent) {
        localStorage.setItem('nl_consent_v1', JSON.stringify(data.consent));
      } else {
        setOpen(true);
      }
    }).catch(() => setOpen(true));
  }, []);

  function save(consent: Record<string, boolean>) {
    startTransition(async () => {
      try {
        const sb = createClient();
        await sb.rpc('nl_cookie_consent_set', { p_consent: consent });
      } catch {}
      localStorage.setItem('nl_consent_v1', JSON.stringify(consent));
      setOpen(false);
    });
  }

  function acceptAll() { save({ necessary: true, functional: true, analytics: true, marketing: true }); }
  function rejectAll() { save({ necessary: true, functional: false, analytics: false, marketing: false }); }
  function saveCustom() { save(prefs); }

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-2xl">
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Cookie className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-900">Cookies & Privacidade</h2>
              <p className="text-sm text-slate-600 mt-1">
                Usamos cookies para garantir funcionamento essencial e, com a tua permissão, para analytics e marketing. Lê a <a href="/pt/privacidade" className="underline">Política de Privacidade</a>.
              </p>
            </div>
          </div>

          {details && (
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              {CATEGORIES.map((cat) => (
                <label key={cat.key} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded">
                  <input type="checkbox" checked={prefs[cat.key]} disabled={cat.required}
                    onChange={(e) => setPrefs((p) => ({ ...p, [cat.key]: e.target.checked }))}
                    className="mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      {cat.label}
                      {cat.required && <span className="text-[10px] uppercase tracking-wider text-slate-500">Obrigatório</span>}
                    </div>
                    <div className="text-xs text-slate-500">{cat.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button onClick={acceptAll} disabled={pending}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
              Aceitar tudo
            </button>
            <button onClick={rejectAll} disabled={pending}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg disabled:opacity-50">
              Rejeitar opcional
            </button>
            {details ? (
              <button onClick={saveCustom} disabled={pending}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                Guardar preferências
              </button>
            ) : (
              <button onClick={() => setDetails(true)}
                className="inline-flex items-center justify-center gap-1 px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-semibold rounded-lg">
                <ChevronDown className="h-4 w-4" /> Personalizar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
