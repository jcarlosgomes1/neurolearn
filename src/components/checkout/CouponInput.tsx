'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Tag, Check, X, Loader2 } from 'lucide-react';

export function CouponInput({ kind = 'all', amountCents = 0, onApplied }: { kind?: string; amountCents?: number; onApplied?: (coupon: any) => void }) {
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<any | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function apply() {
    setError(null);
    if (!code.trim()) return;
    startTransition(async () => {
      const sb = createClient();
      const { data, error: err } = await sb.rpc('nl_coupon_validate', { p_code: code.toUpperCase(), p_kind: kind, p_amount_cents: amountCents });
      const r = data as any;
      if (err || !r?.ok) {
        setError(r?.error || err?.message || 'Código inválido');
      } else {
        setApplied(r.coupon);
        onApplied?.(r.coupon);
      }
    });
  }

  function remove() {
    setApplied(null); setCode(''); setError(null);
    onApplied?.(null);
  }

  if (applied) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
        <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <code className="text-sm font-mono font-bold text-emerald-900">{applied.code}</code>
          <span className="text-xs text-emerald-700 ml-2">
            {applied.discount_type === 'percent' ? `−${applied.discount_value}%` : `−€${(applied.discount_value/100).toFixed(2)}`}
          </span>
        </div>
        <button onClick={remove} className="p-1 hover:bg-emerald-100 rounded"><X className="h-3 w-3 text-emerald-700" /></button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700"><Tag className="h-3 w-3" /> Código promocional</label>
      <div className="flex gap-2">
        <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="EX: LAUNCH2026"
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono uppercase" />
        <button onClick={apply} disabled={pending || !code.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
          {pending && <Loader2 className="h-3 w-3 animate-spin" />} Aplicar
        </button>
      </div>
      {error && <p className="text-xs text-rose-700">{error}</p>}
    </div>
  );
}
