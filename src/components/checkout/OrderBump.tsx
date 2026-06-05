'use client';

import { useState } from 'react';
import { Plus, Check } from 'lucide-react';

export function OrderBump({ title, description, priceCents, currency = 'EUR', onChange }: { title: string; description: string; priceCents: number; currency?: string; onChange?: (added: boolean) => void }) {
  const [added, setAdded] = useState(false);
  function toggle() {
    const next = !added;
    setAdded(next);
    onChange?.(next);
  }
  const fmt = new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(priceCents/100);
  return (
    <button onClick={toggle}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${added ? 'border-emerald-500 bg-emerald-50' : 'border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50'}`}>
      <div className="flex items-start gap-3">
        <div className={`h-6 w-6 rounded flex items-center justify-center flex-shrink-0 transition-colors ${added ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
          {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
            <span className="font-bold text-slate-900">+ {fmt}</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}
