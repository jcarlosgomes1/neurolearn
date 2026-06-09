'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Cookie, X, Settings2, Check } from 'lucide-react';

const STORAGE_KEY = 'nl_cookie_consent_v1';
const CONSENT_VERSION = '1.0';

function tt(t: any, key: string, fb: string): string {
  try { const v = t(key); if (v && typeof v === 'string' && v !== key) return v; } catch {}
  return fb;
}

interface Consent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  version: string;
  timestamp: string;
}

function getStored(): Consent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Consent;
    if (parsed.version !== CONSENT_VERSION) return null; // forçar re-consent em mudança de versão
    return parsed;
  } catch { return null; }
}

function persistAndSync(consent: Omit<Consent, 'version' | 'timestamp'>) {
  const full: Consent = { ...consent, version: CONSENT_VERSION, timestamp: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch {}

  // Cookie 12 meses
  document.cookie = `nl_consent=${encodeURIComponent(JSON.stringify({
    a: consent.analytics ? 1 : 0,
    m: consent.marketing ? 1 : 0,
    f: consent.functional ? 1 : 0,
  }))}; max-age=${365 * 24 * 60 * 60}; path=/; SameSite=Lax`;

  // Sincronizar com backend (audit trail GDPR)
  fetch('/api/cookie-consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      analytics: consent.analytics,
      marketing: consent.marketing,
      functional: consent.functional,
      consent_version: CONSENT_VERSION,
    }),
  }).catch(() => {});
}

export function CookieBanner() {
  const t = useTranslations();
  const [show, setShow] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [functional, setFunctional] = useState(true);

  useEffect(() => {
    const stored = getStored();
    if (!stored) setShow(true);
  }, []);

  function acceptAll() {
    persistAndSync({ necessary: true, analytics: true, marketing: true, functional: true });
    setShow(false);
  }

  function rejectAll() {
    persistAndSync({ necessary: true, analytics: false, marketing: false, functional: false });
    setShow(false);
  }

  function saveSelection() {
    persistAndSync({ necessary: true, analytics, marketing, functional });
    setShow(false);
    setShowSettings(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 sm:p-5 pointer-events-auto">
        {!showSettings ? (
          <div>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Cookie className="h-5 w-5 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm">{tt(t, 'cookies.b.title', 'Cookies e privacidade')}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {tt(t, 'cookies.b.body', 'Usamos cookies essenciais ao funcionamento do site e, com a tua autorização, cookies de analytics e marketing. Lê a ')}
                  <Link href={'/legal/privacy' as any} className="text-brand-600 hover:underline">{tt(t, 'cookies.b.privacy_link', 'política de privacidade')}</Link>.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <button onClick={() => setShowSettings(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold order-2 sm:order-1">
                <Settings2 className="h-3.5 w-3.5" /> {tt(t, 'cookies.b.customize', 'Personalizar')}
              </button>
              <button onClick={rejectAll}
                className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold order-3 sm:order-2">
                {tt(t, 'cookies.b.reject_all', 'Rejeitar todos')}
              </button>
              <button onClick={acceptAll}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold order-1 sm:order-3 sm:ml-auto">
                <Check className="h-3.5 w-3.5" /> {tt(t, 'cookies.b.accept_all', 'Aceitar todos')}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Settings2 className="h-4 w-4" /> {tt(t, 'cookies.b.prefs_title', 'Preferências de cookies')}
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-2.5 mt-3">
              <CookieToggle title={tt(t, 'cookies.b.essential_title', 'Essenciais')} desc={tt(t, 'cookies.b.essential_desc', 'Necessários para o funcionamento básico (login, sessão).')} enabled={true} disabled />
              <CookieToggle title={tt(t, 'cookies.b.functional_title', 'Funcionais')} desc={tt(t, 'cookies.b.functional_desc', 'Preferências de idioma, layout, conta.')}
                enabled={functional} onChange={setFunctional} />
              <CookieToggle title={tt(t, 'cookies.b.analytics_title', 'Analytics')} desc={tt(t, 'cookies.b.analytics_desc', 'Ajudam-nos a entender como usas o site (anónimo).')}
                enabled={analytics} onChange={setAnalytics} />
              <CookieToggle title={tt(t, 'cookies.b.marketing_title', 'Marketing')} desc={tt(t, 'cookies.b.marketing_desc', 'Personalização de ofertas e remarketing.')}
                enabled={marketing} onChange={setMarketing} />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={rejectAll}
                className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold">
                {tt(t, 'cookies.b.only_essential', 'Apenas essenciais')}
              </button>
              <button onClick={saveSelection}
                className="flex-1 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold">
                {tt(t, 'cookies.b.save', 'Guardar seleção')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CookieToggle({ title, desc, enabled, onChange, disabled }: {
  title: string; desc: string; enabled: boolean; onChange?: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-xs sm:text-sm font-medium text-slate-900">{title}</div>
        <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
      <button onClick={() => !disabled && onChange?.(!enabled)} disabled={disabled}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
          enabled ? 'bg-brand-600' : 'bg-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-4' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  );
}
