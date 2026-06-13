'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Save, Settings2 } from 'lucide-react';

type Setting = { key: string; value: any; description: string | null };

export function GamificationConfig() {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Setting[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase.rpc('nl_admin_gamification_config');
      if (Array.isArray(data)) setRows(data as Setting[]);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function valueStr(s: Setting): string {
    if (edited[s.key] !== undefined) return edited[s.key];
    return typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value);
  }

  async function save(s: Setting) {
    setSavingKey(s.key);
    try {
      const raw = valueStr(s);
      let parsed: any;
      try { parsed = JSON.parse(raw); } catch { parsed = isNaN(Number(raw)) ? raw : Number(raw); }
      const { data, error } = await supabase.rpc('nl_admin_gamification_config_set', { p_key: s.key, p_value: parsed });
      if (error || !(data as { ok?: boolean })?.ok) throw error || new Error('fail');
      toast.success(t('gamcfg.saved'));
      setEdited((e) => { const n = { ...e }; delete n[s.key]; return n; });
      setRows((rs) => rs.map((r) => r.key === s.key ? { ...r, value: parsed } : r));
    } catch { toast.error(t('gamcfg.error')); }
    finally { setSavingKey(null); }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-3">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <Settings2 className="h-4 w-4" /> {t('gamcfg.hint')}
      </div>
      {rows.map((s) => {
        const dirty = edited[s.key] !== undefined;
        return (
          <div key={s.key} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs text-slate-500">{s.key}</div>
              {s.description && <div className="text-sm text-slate-700 mt-0.5">{s.description}</div>}
            </div>
            <input value={valueStr(s)} onChange={(e) => setEdited((ed) => ({ ...ed, [s.key]: e.target.value }))}
              className="w-40 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-mono focus:border-violet-400 outline-none" />
            <button onClick={() => save(s)} disabled={!dirty || savingKey === s.key}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-40">
              {savingKey === s.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
