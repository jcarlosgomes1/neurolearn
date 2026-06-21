'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

/** Aba Definições do workspace do instrutor: partilha de receita por instrutor. */
export function InstrutorDefinicoesPanel({ instructorId }: { instructorId: string }) {
  const t = useTranslations();
  const [pct, setPct] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data } = await sb.from('nl_instructors').select('revenue_share_pct').eq('id', instructorId).maybeSingle();
      const v = (data as { revenue_share_pct: number | null } | null)?.revenue_share_pct;
      setPct(v !== null && v !== undefined ? String(v) : '');
    } catch { setPct(''); }
    finally { setLoading(false); }
  }, [instructorId]);
  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      const sb = createClient();
      const raw = pct.trim();
      const val = raw === '' ? null : Math.max(0, Math.min(100, Number(raw)));
      const { error } = await sb.rpc('nl_admin_set_instructor_revshare', { p_id: instructorId, p_pct: val });
      if (error) throw error;
      toast.success(t('instr_ws.settings.saved'));
    } catch { toast.error(t('instr_ws.settings.error')); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <label className="block text-sm font-semibold text-slate-900">{t('instr_ws.settings.revshare')}</label>
        <p className="text-xs text-slate-500 mt-0.5 mb-3">{t('instr_ws.settings.revshare_hint')}</p>
        <div className="flex items-center gap-2">
          <input type="number" min={0} max={100} value={pct} onChange={(e) => setPct(e.target.value)} placeholder={t('instr_ws.settings.revshare_ph')} className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm text-right tabular-nums" />
          <span className="text-slate-400 text-sm">%</span>
          <button onClick={save} disabled={saving} className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 disabled:opacity-50 hover:bg-slate-800">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{t('instr_ws.settings.save')}</button>
        </div>
      </div>
    </div>
  );
}
