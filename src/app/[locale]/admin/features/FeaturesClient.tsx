'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

type Flag = {
  key: string;
  label: string;
  description: string | null;
  category: string;
  enabled: boolean;
  route: string | null;
  sort_order: number;
};

export function FeaturesClient({ initial }: { initial: Flag[] }) {
  const [flags, setFlags] = useState<Flag[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const supabase = createClient();

  async function toggle(key: string, next: boolean) {
    setErr(null);
    setBusy(key);
    setFlags((f) => f.map((x) => (x.key === key ? { ...x, enabled: next } : x)));
    const { error } = await supabase.rpc('nl_feature_flag_set', { p_key: key, p_enabled: next });
    if (error) {
      setErr(error.message);
      setFlags((f) => f.map((x) => (x.key === key ? { ...x, enabled: !next } : x)));
    }
    setBusy(null);
  }

  const categories = Array.from(new Set(flags.map((f) => f.category)));

  return (
    <div className="space-y-8">
      {err ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</div>
      ) : null}
      {categories.map((cat) => (
        <section key={cat}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{cat}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {flags
              .filter((f) => f.category === cat)
              .map((f) => (
                <div
                  key={f.key}
                  className="group relative flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{f.label}</span>
                      {f.route ? (
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">{f.route}</code>
                      ) : null}
                    </div>
                    {f.description ? <p className="mt-1 text-sm leading-relaxed text-slate-500">{f.description}</p> : null}
                  </div>
                  <button
                    onClick={() => toggle(f.key, !f.enabled)}
                    disabled={busy === f.key}
                    aria-pressed={f.enabled}
                    className={'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ' + (f.enabled ? 'bg-emerald-500' : 'bg-slate-300') + (busy === f.key ? ' opacity-60' : '')}
                  >
                    <span className={'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ' + (f.enabled ? 'translate-x-5' : 'translate-x-0.5')} />
                  </button>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
