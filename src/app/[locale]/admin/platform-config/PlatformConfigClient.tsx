'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Save, ToggleLeft, ToggleRight, AtSign, KeyRound, Cog, Plus } from 'lucide-react';

type Item = { key: string; value: string; description: string };

function inferKind(key: string, value: string): 'bool' | 'email' | 'uuid' | 'text' {
  if (key.startsWith('feature.')) return 'bool';
  if (value === 'true' || value === 'false') return 'bool';
  if (key.includes('email')) return 'email';
  if (key.includes('user_id') || (value && /^[0-9a-f-]{36}$/i.test(value))) return 'uuid';
  return 'text';
}

const SECTIONS: Array<{ key: string; label: string; match: (k: string) => boolean; icon: any; accent: string }> = [
  { key: 'features', label: 'Funcionalidades', match: (k) => k.startsWith('feature.'), icon: ToggleRight, accent: 'from-indigo-500 to-violet-600' },
  { key: 'emails', label: 'Emails de sistema', match: (k) => k.includes('email'), icon: AtSign, accent: 'from-emerald-500 to-teal-600' },
  { key: 'config', label: 'Outros parâmetros', match: (k) => k.startsWith('config.') && !k.includes('email'), icon: Cog, accent: 'from-amber-500 to-orange-600' },
  { key: 'other', label: 'Avançado', match: () => true, icon: KeyRound, accent: 'from-slate-700 to-slate-900' },
];

export function PlatformConfigClient({ items }: { items: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const grouped = useMemo(() => {
    const claimed = new Set<string>();
    const out: Record<string, Item[]> = {};
    for (const sec of SECTIONS) {
      out[sec.key] = items.filter((it) => !claimed.has(it.key) && sec.match(it.key));
      out[sec.key].forEach((it) => claimed.add(it.key));
    }
    return out;
  }, [items]);

  async function save(it: Item, value: string) {
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_platform_config_set', {
        p_key: it.key, p_value: value, p_description: it.description || null,
      });
      if (error) throw error;
      toast.success('Guardado');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      {SECTIONS.map((sec) => {
        if (!grouped[sec.key]?.length) return null;
        const Icon = sec.icon;
        return (
          <section key={sec.key} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <header className="p-4 border-b border-slate-100 flex items-center gap-2.5">
              <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${sec.accent} text-white flex items-center justify-center shadow-sm`}>
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="font-semibold text-sm text-slate-900">{sec.label}</h2>
            </header>
            <div className="divide-y divide-slate-100">
              {grouped[sec.key].map((it) => (
                <Row key={it.key} item={it} busy={busy} onSave={save} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Row({ item, busy, onSave }: { item: Item; busy: boolean; onSave: (i: Item, v: string) => void }) {
  const kind = inferKind(item.key, item.value);
  const [val, setVal] = useState(item.value);
  const [dirty, setDirty] = useState(false);

  function set(v: string) { setVal(v); setDirty(v !== item.value); }
  function flush(v?: string) {
    const final = v ?? val;
    if (final === item.value) return;
    onSave(item, final);
    setDirty(false);
  }

  return (
    <div className="p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <code className="text-[11px] font-mono text-slate-700 font-semibold">{item.key}</code>
        {item.description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {kind === 'bool' ? (
          <button
            onClick={() => { const next = val === 'true' ? 'false' : 'true'; set(next); flush(next); }}
            disabled={busy}
            className={`inline-flex items-center h-6 w-11 rounded-full p-0.5 transition-colors ${val === 'true' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
            <span className={`h-5 w-5 bg-white rounded-full shadow-sm transition-transform ${val === 'true' ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        ) : (
          <>
            <input
              value={val}
              onChange={(e) => set(e.target.value)}
              onBlur={() => dirty && flush()}
              placeholder={kind === 'email' ? 'email@...' : kind === 'uuid' ? '00000000-...' : ''}
              className={`px-2.5 py-1.5 border rounded text-xs font-mono w-72 outline-none focus:border-indigo-500 ${dirty ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200'}`} />
            {dirty && (
              <button onClick={() => flush()} disabled={busy} className="p-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200">
                <Save className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
