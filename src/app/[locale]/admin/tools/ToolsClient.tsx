'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';

interface Item { href: string; i18n_key: string | null; icon: string | null; group_key: string | null }
type Row = Item & { label: string; group: string };

export function ToolsClient({ items }: { items: Item[] }) {
  const t = useTranslations() as any;
  const [q, setQ] = useState('');

  function safeT(key: string | null, fb: string): string {
    if (!key) return fb;
    try { const v = t(key); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  const rows: Row[] = useMemo(
    () => items.map((it) => ({
      ...it,
      label: safeT(it.i18n_key, (it.href.split('/').filter(Boolean).pop() || it.href)),
      group: safeT(it.group_key, 'Outros'),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items]
  );

  const term = q.trim().toLowerCase();
  const filtered = term
    ? rows.filter((x) => x.label.toLowerCase().includes(term) || x.group.toLowerCase().includes(term) || x.href.toLowerCase().includes(term))
    : rows;

  const groups = useMemo(() => {
    const m: Record<string, Row[]> = {};
    for (const it of filtered) { if (!m[it.group]) m[it.group] = []; m[it.group].push(it); }
    return Object.entries(m);
  }, [filtered]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="relative mb-6 max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquisar ferramentas…"
          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 shadow-sm"
        />
      </div>

      {groups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-sm text-slate-400">Sem resultados.</p>
        </div>
      ) : (
        <div className="space-y-7">
          {groups.map(([group, list]) => (
            <div key={group}>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">{group} <span className="text-slate-300">· {list.length}</span></h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {list.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href as any}
                    className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <span className="text-lg leading-none flex-shrink-0">{it.icon || '•'}</span>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-violet-700 truncate">{it.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
