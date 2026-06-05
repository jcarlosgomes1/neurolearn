'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronDown } from 'lucide-react';

const SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', BRL: 'R$' };

export function CurrencySwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('EUR');
  const [supported, setSupported] = useState<string[]>(['EUR', 'USD', 'GBP', 'BRL']);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('nl_currency') || 'EUR';
    setCurrent(saved);

    (async () => {
      try {
        const sb = createClient();
        const { data } = await sb.rpc('nl_monetization_get', { p_key: 'supported_currencies' });
        if (Array.isArray(data)) setSupported(data as string[]);
      } catch {
        // fallback silently — keeps default list
      }
    })();
  }, []);

  function pick(c: string) {
    setCurrent(c);
    try { localStorage.setItem('nl_currency', c); } catch {}
    try {
      document.cookie = `nl_currency=${c}; max-age=${365 * 24 * 60 * 60}; path=/; SameSite=Lax`;
    } catch {}
    window.dispatchEvent(new CustomEvent('nl_currency_changed', { detail: c }));
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Mudar moeda"
        className="inline-flex items-center gap-1 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded transition-colors">
        <span className="font-mono">{SYMBOLS[current] || current}</span>
        <span className="hidden sm:inline">{current}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[140px] py-1" role="menu">
            {supported.map((c) => (
              <button
                key={c}
                onClick={() => pick(c)}
                role="menuitem"
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${current === c ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-700'}`}>
                <span className="font-mono w-6">{SYMBOLS[c] || c}</span>
                <span>{c}</span>
                {current === c && <span className="ml-auto text-xs">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
