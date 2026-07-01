'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Search, Loader2 } from 'lucide-react';

export type PickerSkill = { skill_id: string; label: string; domain?: string };

/** Autocomplete de skills do catálogo (nl_skills_search). Add/remove delegados ao pai. */
export function SkillPicker({ selected, onAdd, onRemove, lang, placeholder, accent = 'violet' }: {
  selected: PickerSkill[]; onAdd: (s: PickerSkill) => void; onRemove: (id: string) => void;
  lang: string; placeholder?: string; accent?: 'violet' | 'emerald' | 'sky';
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<PickerSkill[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    let active = true;
    const tmr = setTimeout(async () => {
      setLoading(true);
      try {
        const sb = createClient();
        const { data } = await sb.rpc('nl_skills_search', { p_q: q, p_lang: lang, p_limit: 10 });
        if (!active) return;
        const items = ((data as any)?.items || []) as PickerSkill[];
        const sel = new Set(selected.map((s) => s.skill_id));
        setResults(items.filter((i) => !sel.has(i.skill_id)));
        setOpen(true);
      } catch { if (active) setResults([]); }
      finally { if (active) setLoading(false); }
    }, 220);
    return () => { active = false; clearTimeout(tmr); };
  }, [q, lang, selected]);

  useEffect(() => {
    function onDoc(e: MouseEvent) { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', onDoc); return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const chip = accent === 'emerald' ? 'bg-emerald-100 text-emerald-700' : accent === 'sky' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700';

  return (
    <div ref={boxRef} className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((s) => (
            <span key={s.skill_id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${chip}`}>
              {s.label}
              <button type="button" onClick={() => onRemove(s.skill_id)} className="opacity-70 hover:opacity-100"><X className="h-2.5 w-2.5" /></button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder} className="w-full pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-violet-500" />
        {loading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-slate-400" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.map((r) => (
            <button key={r.skill_id} type="button" onClick={() => { onAdd(r); setQ(''); setResults([]); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between gap-2">
              <span className="text-sm text-slate-800">{r.label}</span>
              {r.domain && <span className="text-[10px] text-slate-400 truncate max-w-[45%]">{r.domain}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
