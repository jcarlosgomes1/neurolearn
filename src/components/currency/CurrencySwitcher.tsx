'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronDown, DollarSign } from 'lucide-react';

const SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', BRL: 'R$' };

export function CurrencySwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('EUR');
  const [supported, setSupported] = useState<string[]>(['EUR']);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('nl_currency') || 'EUR';
    setCurrent(saved);
    
    const sb = createClient();
    sb.rpc('nl_monetization_get', { p_key: 'supported_currencies' }).then(({ data }: any) => {
      if (Array.isArray(data)) setSupported(data);
    }).catch(() => {});
  }, []);

  function pick(c: string) {
    setCurrent(c);
    localStorage.setItem('nl_currency', c);
    window.dispatchEvent(new CustomEvent('nl_currency_changed', { detail: c }));
    setOpen(false);
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded">
        <span className="font-mono">{SYMBOLS[current]}</span> {current} <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[120px]">
            {supported.map((c) => (
              <button key={c} onClick={() => pick(c)}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 ${current === c ? 'bg-brand-50 font-semibold' : ''}`}>
                <span className="font-mono mr-2">{SYMBOLS[c] || c}</span> {c}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
