'use client';

import { useTranslations } from 'next-intl';
import { Coins, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface Entry {
  amount: number;
  reason: string;
  ref_kind: string | null;
  ref_id: string | null;
  expires_at: string | null;
  expired: boolean;
  created_at: string;
}

export function CreditsClient({ balance, history }: { balance: number; history: Entry[] }) {
  const t = useTranslations();

  function reasonLabel(reason: string) {
    // rótulos i18n; fallback ao próprio código do motivo
    const key = `credits.reason.${reason}`;
    const label = t(key as any);
    return label === key ? reason : label;
  }

  const fmtDate = (s: string) => new Date(s).toLocaleDateString();

  return (
    <div className="space-y-6">
      {/* Saldo */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 shadow-lg">
        <div className="flex items-center gap-2 text-amber-50/90 text-sm font-medium">
          <Coins className="h-4 w-4" /> {t('credits.balance_label')}
        </div>
        <div className="mt-2 text-4xl font-bold tabular-nums">{balance.toLocaleString()}</div>
        <p className="mt-2 text-sm text-amber-50/80">{t('credits.balance_hint')}</p>
      </div>

      {/* Histórico */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900 mb-4">{t('credits.history_title')}</h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">{t('credits.history_empty')}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {history.map((e, i) => {
              const positive = e.amount > 0;
              return (
                <li key={i} className="flex items-center gap-3 py-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{reasonLabel(e.reason)}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      {fmtDate(e.created_at)}
                      {e.expired && <span className="inline-flex items-center gap-1 text-slate-400"><Clock className="h-3 w-3" /> {t('credits.expired')}</span>}
                    </div>
                  </div>
                  <div className={`text-sm font-semibold tabular-nums ${positive ? 'text-emerald-600' : 'text-slate-500'} ${e.expired ? 'line-through opacity-50' : ''}`}>
                    {positive ? '+' : ''}{e.amount}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
