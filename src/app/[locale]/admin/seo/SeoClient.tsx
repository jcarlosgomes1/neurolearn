'use client';

import { useMemo, useState } from 'react';

type Issue = { rule?: string; message?: string; severity?: string };
type Audit = {
  id: string;
  page_type: string | null;
  page_id: string | null;
  lang: string | null;
  score: number | null;
  issues: Issue[] | null;
  suggestions: unknown[] | null;
  audited_at: string | null;
};

function scoreColor(s: number) {
  if (s >= 90) return 'bg-emerald-100 text-emerald-700';
  if (s >= 70) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}
function sevColor(sev?: string) {
  if (sev === 'error') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (sev === 'warning') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

export function SeoClient({ audits }: { audits: Audit[] }) {
  const [type, setType] = useState('all');
  const [lang, setLang] = useState('all');
  const [open, setOpen] = useState<string | null>(null);

  const types = useMemo(() => Array.from(new Set(audits.map((a) => a.page_type).filter(Boolean))) as string[], [audits]);
  const langs = useMemo(() => Array.from(new Set(audits.map((a) => a.lang).filter(Boolean))) as string[], [audits]);

  const filtered = useMemo(
    () => audits.filter((a) => (type === 'all' || a.page_type === type) && (lang === 'all' || a.lang === lang)),
    [audits, type, lang],
  );

  const avg = filtered.length ? Math.round(filtered.reduce((s, a) => s + (a.score ?? 0), 0) / filtered.length) : 0;
  const withIssues = filtered.filter((a) => (a.issues?.length ?? 0) > 0).length;

  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Auditorias" value={filtered.length} />
        <Stat label="Pontuacao media" value={avg} />
        <Stat label="Com problemas" value={withIssues} />
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
          <option value="all">Todos os tipos</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
          <option value="all">Todas as linguas</option>
          {langs.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map((a) => {
          const issues = a.issues ?? [];
          const isOpen = open === a.id;
          return (
            <div key={a.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button onClick={() => setOpen(isOpen ? null : a.id)} className="flex w-full items-center justify-between gap-4 p-4 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ' + scoreColor(a.score ?? 0)}>{a.score ?? '-'}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] uppercase text-slate-500">{a.page_type}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] uppercase text-slate-500">{a.lang}</span>
                      <span className="truncate text-slate-400">{a.page_id}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {issues.length} {issues.length === 1 ? 'problema' : 'problemas'} · {a.audited_at ? new Date(a.audited_at).toLocaleDateString() : '-'}
                    </div>
                  </div>
                </div>
                <span className="text-slate-400">{isOpen ? '-' : '+'}</span>
              </button>
              {isOpen && issues.length > 0 ? (
                <div className="border-t border-slate-100 p-4 space-y-2">
                  {issues.map((it, i) => (
                    <div key={i} className={'rounded-lg border px-3 py-2 text-sm ' + sevColor(it.severity)}>
                      <span className="font-semibold">{it.rule}</span> — {it.message}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {filtered.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Sem auditorias.</div> : null}
      </div>
    </div>
  );
}
