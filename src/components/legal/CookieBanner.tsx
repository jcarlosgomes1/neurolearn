'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { X } from 'lucide-react';

type Prefs = { essential: true; analytics: boolean; marketing: boolean };
const STORAGE_KEY = 'nl_cookie_prefs_v1';

function loadPrefs(): Prefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    document.cookie = `nl_cookie_consent=1; max-age=${60*60*24*365}; path=/; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent('nl:cookie-prefs', { detail: p }));
  } catch {}
}

export function CookieBanner() {
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prefs = loadPrefs();
    if (!prefs) setOpen(true);
  }, []);

  function acceptAll() {
    savePrefs({ essential: true, analytics: true, marketing: true });
    setOpen(false);
  }
  function rejectOptional() {
    savePrefs({ essential: true, analytics: false, marketing: false });
    setOpen(false);
  }
  function saveCustom() {
    savePrefs({ essential: true, analytics, marketing });
    setOpen(false);
  }

  if (!mounted || !open) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 pointer-events-none">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 pointer-events-auto overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-bold text-slate-900">{t('cookies.banner.title')}</h2>
            <button onClick={() => setOpen(false)} aria-label="Close" className="p-1 text-slate-400 hover:text-slate-700 -m-1">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{t('cookies.banner.body')}</p>

          {customize && (
            <div className="mt-4 space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked disabled className="mt-0.5 h-4 w-4 accent-brand-600 opacity-60" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-slate-900">{t('cookies.cat.essential.title')}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t('cookies.cat.essential.body')}</div>
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-slate-900">{t('cookies.cat.analytics.title')}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t('cookies.cat.analytics.body')}</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-slate-900">{t('cookies.cat.marketing.title')}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t('cookies.cat.marketing.body')}</div>
                </div>
              </label>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {!customize ? (
              <>
                <button onClick={acceptAll} className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:opacity-90 text-white text-sm font-semibold">
                  {t('cookies.banner.accept_all')}
                </button>
                <button onClick={rejectOptional} className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium">
                  {t('cookies.banner.reject')}
                </button>
                <button onClick={() => setCustomize(true)} className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg hover:bg-slate-100 text-slate-600 text-sm">
                  {t('cookies.banner.customize')}
                </button>
              </>
            ) : (
              <button onClick={saveCustom} className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:opacity-90 text-white text-sm font-semibold">
                {t('cookies.banner.save')}
              </button>
            )}
          </div>

          <div className="mt-3 flex gap-3 text-xs text-slate-400">
            <Link href={'/terms' as any} className="hover:text-slate-600">{t('nav.legal.terms')}</Link>
            <span>·</span>
            <Link href={'/privacy' as any} className="hover:text-slate-600">{t('nav.legal.privacy')}</Link>
            <span>·</span>
            <Link href={'/cookies' as any} className="hover:text-slate-600">{t('nav.legal.cookies')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
