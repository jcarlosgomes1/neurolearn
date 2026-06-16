'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Check } from 'lucide-react';

interface ModelOpt { model: string; label: string | null; provider: string | null; in_price: number | null; out_price: number | null; }
interface Tier { key: string; label: string; model: string; description: string | null; sort_order: number; model_label: string | null; operations: string[]; }

const TIER_ACCENT: Record<string, string> = {
  economico: 'from-emerald-500 to-teal-500',
  avancado: 'from-violet-500 to-indigo-500',
  premium: 'from-amber-500 to-orange-500',
};

export function AiTiersClient() {
  const supabase = useMemo(() => createClient(), []);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [models, setModels] = useState<ModelOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('nl_admin_ai_tiers_list');
    if (error) toast.error(error.message);
    else { setTiers((data?.tiers as Tier[]) || []); setModels((data?.models as ModelOpt[]) || []); }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function setModel(key: string, model: string) {
    setSaving(key);
    const { data, error } = await supabase.rpc('nl_admin_ai_tier_set_model', { p_key: key, p_model: model });
    if (error) toast.error(error.message);
    else if (data && (data as { ok?: boolean }).ok === false) toast.error((data as { error?: string }).error || 'Falhou');
    else { toast.success('Modelo do tier atualizado'); await load(); }
    setSaving(null);
  }

  const priceOf = (m: string) => models.find((x) => x.model === m);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>;

  return (
    <div className="mt-6 space-y-5">
      {tiers.map((t) => {
        const accent = TIER_ACCENT[t.key] || 'from-slate-500 to-slate-600';
        const p = priceOf(t.model);
        return (
          <section key={t.key} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className={`h-1.5 bg-gradient-to-r ${accent}`} />
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900">{t.label}</h2>
                  {t.description && <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">{t.description}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <select
                    value={t.model}
                    disabled={saving === t.key}
                    onChange={(e) => setModel(t.key, e.target.value)}
                    className="input text-sm font-medium min-w-[200px]"
                  >
                    {models.map((m) => (
                      <option key={m.model} value={m.model}>{m.label || m.model}</option>
                    ))}
                  </select>
                  {p && (
                    <span className="text-[10px] text-slate-400 tabular-nums">
                      ${Number(p.in_price ?? 0).toFixed(2)} in · ${Number(p.out_price ?? 0).toFixed(2)} out /M
                    </span>
                  )}
                  {saving === t.key && <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.operations.length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic">Sem operações atribuídas (reservado)</span>
                ) : t.operations.map((op) => (
                  <span key={op} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{op}</span>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
        <p className="font-semibold mb-1 flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Como funciona</p>
        <p>Cada operação herda o modelo do seu tier. Mudar o modelo de um tier aplica-se de imediato a todas as operações desse tier. O custo concentra-se no volume (traduções) — manter esse tier num modelo barato poupa sem afetar o núcleo, que fica num modelo forte.</p>
      </div>
    </div>
  );
}
