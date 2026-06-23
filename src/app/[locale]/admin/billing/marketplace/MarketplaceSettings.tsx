'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Save, AlertCircle, Sliders } from 'lucide-react';
import { setMarketplaceSettingAction, listMarketplaceSettingsAction } from '../actions';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

interface Setting {
  key: string; value: unknown; default_value: unknown;
  description?: string; category: string; value_type: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  general: '⚙️ Geral',
  talent: '🎯 Talent Marketplace',
  catalog: '📚 Catálogo B2C',
  inter_org: '🔄 Inter-empresa',
  enforcement: '🛡 Enforcement',
};

export function MarketplaceSettings({ initial }: { initial: Setting[] }) {
  const [items, setItems] = useState<Setting[]>(initial);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  
  async function refresh() {
    const r = await listMarketplaceSettingsAction();
    if (r.ok) setItems((r.data as Setting[]) || []);
  }
  
  function getRaw(s: Setting): string {
    if (s.key in edits) return edits[s.key];
    if (s.value == null) return '';
    return typeof s.value === 'string' ? s.value : JSON.stringify(s.value);
  }
  
  function saveSetting(s: Setting) {
    const raw = edits[s.key];
    if (raw === undefined) return;
    let parsed: unknown;
    try {
      if (raw === '' || raw === 'null') { parsed = null; }
      else if (s.value_type === 'number' || s.value_type === 'percent' || s.value_type === 'currency_cents') { parsed = Number(raw); if (Number.isNaN(parsed)) throw new Error('NaN'); }
      else if (s.value_type === 'boolean') { parsed = raw === 'true'; }
      else if (s.value_type === 'string') { parsed = raw; }
      else { parsed = JSON.parse(raw); }
    } catch (e) { toast.error(`Valor inválido: ${e instanceof Error ? e.message : 'parse error'}`); return; }
    
    setSavingKey(s.key);
    startTransition(async () => {
      const r = await setMarketplaceSettingAction(s.key, parsed);
      if (r.ok) {
        toast.success(`${s.key} atualizado`);
        setEdits((prev) => { const n = { ...prev }; delete n[s.key]; return n; });
        await refresh();
      } else toast.error(r.error || 'Falhou');
      setSavingKey(null);
    });
  }
  
  const grouped = items.reduce<Record<string, Setting[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});
  
  const unset = items.filter((s) => s.value == null).length;
  
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <AdminPageHeader
        backHref="/admin/billing"
        backLabel="Faturação"
        title="Marketplace Settings"
        description="Comportamentos globais. Define os valores que controlam talent placement, catalog access e mais."
        related={[
          { href: '/admin/billing/planos', label: 'Planos', emoji: '📦' },
          { href: '/admin/billing/addons', label: 'Add-ons', emoji: '✨' },
          { href: '/admin/billing/assinaturas', label: 'Subscrições', emoji: '🔁' },
          { href: '/admin/payments', label: 'Pagamentos', emoji: '💳' },
        ]}
      />

      {unset > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <strong>{unset}</strong> settings sem valor (NULL). Define os críticos antes de activar marketplace de talento ou cobrar overage.
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([category, settings]) => (
        <div key={category} className="space-y-2">
          <h2 className="text-sm font-bold text-slate-700">{CATEGORY_LABEL[category] || category}</h2>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {settings.map((s) => {
              const raw = getRaw(s);
              const dirty = s.key in edits;
              return (
                <div key={s.key} className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs font-mono text-slate-800">{s.key}</code>
                        <span className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{s.value_type}</span>
                        {s.value == null && <span className="text-[10px] uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">sem valor</span>}
                      </div>
                      {s.description && <p className="text-xs text-slate-500 mt-1">{s.description}</p>}
                      {s.default_value != null && (
                        <p className="text-[10px] text-slate-400 mt-1">default sugerido: <code>{JSON.stringify(s.default_value)}</code></p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {s.value_type === 'boolean' ? (
                      <select value={raw} onChange={(e) => setEdits({ ...edits, [s.key]: e.target.value })} className="flex-1 text-sm px-2 py-1.5 rounded border border-slate-200 bg-white font-mono">
                        <option value="">— sem valor —</option>
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <input
                        type={s.value_type === 'number' || s.value_type === 'percent' || s.value_type === 'currency_cents' ? 'number' : 'text'}
                        step={s.value_type === 'percent' ? '0.1' : '1'}
                        value={raw}
                        onChange={(e) => setEdits({ ...edits, [s.key]: e.target.value })}
                        placeholder={s.value_type === 'string' ? '' : 'NULL (deixar vazio)'}
                        className="flex-1 text-sm font-mono px-2 py-1.5 rounded border border-slate-200 focus:border-brand-400 outline-none"
                      />
                    )}
                    <button onClick={() => saveSetting(s)} disabled={!dirty || (isPending && savingKey === s.key)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-30">
                      {savingKey === s.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Guardar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
