'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';

interface Credits { balance: number; monthly_allowance: number; days_until_reset: number; role: string }

export function CreditsBadge() {
  const [credits, setCredits] = useState<Credits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data } = await sb.rpc('nl_my_credits');
      const row = (data as Credits[] | null)?.[0];
      if (row) setCredits(row);
      setLoading(false);
    })();
  }, []);

  if (loading || !credits) return null;
  // Admin e instrutor não veem créditos (são ilimitados)
  if (['admin','super_admin','instructor'].includes(credits.role)) return null;

  const lowBalance = credits.balance <= 5;
  const color = lowBalance ? 'text-rose-600 bg-rose-50' : credits.balance <= 10 ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50';

  return (
    <Link href={'/learn/creditos' as any} className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${color} hover:opacity-80 transition-opacity`} title={`Reset em ${credits.days_until_reset} dia${credits.days_until_reset !== 1 ? 's' : ''}`}>
      <span>💎</span>
      <span className="tabular-nums">{credits.balance}</span>
    </Link>
  );
}
