'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface Route {
  operation: string;
  model_primary: string;
  model_fallback: string | null;
  max_tokens: number;
  temperature: number | null;
  description: string | null;
  cost_per_1m_input_cents: number | null;
  cost_per_1m_output_cents: number | null;
  category: string;
  enabled: boolean;
  updated_at: string;
}

interface ModelOption { value: string; label: string; badge: string }
const PROVIDER_BADGE: Record<string, string> = {
  anthropic: 'bg-violet-100 text-violet-700',
  openai: 'bg-emerald-100 text-emerald-700',
  deepseek: 'bg-indigo-100 text-indigo-700',
  voyage: 'bg-amber-100 text-amber-700',
};

const CATEGORY_COLORS: Record<string, string> = {
  content: 'border-emerald-200 bg-emerald-50/40',
  translation: 'border-sky-200 bg-sky-50/40',
  classification: 'border-amber-200 bg-amber-50/40',
  generation: 'border-violet-200 bg-violet-50/40',
  review: 'border-rose-200 bg-rose-50/40',
  general: 'border-slate-200 bg-slate-50/40',
};

export function AiRoutingEditor() {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);

  const [routes, setRoutes] = useState<Route[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOp, setSavingOp] = useState<string | null>(null);
  const [showRecentCalls, setShowRecentCalls] = useState(false);
  const [recentCalls, setRecentCalls] = useState<Array<{ operation: string; model: string; input_tokens: number | null; output_tokens: number | null; cost_cents: number | null; created_at: string }>>([]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('nl_ai_routing').select('*').order('category').order('operation');
    if (error) toast.error(error.message);
    setRoutes((data as Route[]) || []);
    setLoading(false);
  }

  async function loadCalls() {
    const { data } = await supabase.from('nl_ai_calls')
      .select('operation, model, input_tokens, output_tokens, cost_cents, created_at')
      .order('created_at', { ascending: false }).limit(50);
    setRecentCalls((data as any[]) || []);
  }

  async function loadModels() {
    const { data } = await supabase.from('nl_ai_models')
      .select('model,label,provider,kind,sort_order')
      .eq('kind', 'chat').order('sort_order', { ascending: true });
    setModels(((data as any[]) || []).map((m) => ({
      value: m.model,
      label: m.label || m.model,
      badge: PROVIDER_BADGE[m.provider || ''] || 'bg-slate-100 text-slate-600',
    })));
  }

  useEffect(() => { load(); loadModels(); }, []);

  async function updateRoute(operation: string, patch: Partial<Route>) {
    setSavingOp(operation);
    const { error } = await supabase.from('nl_ai_routing')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('operation', operation);
    if (error) toast.error(error.message);
    else { toast.success(t('ai_routing.updated')); load(); }
    setSavingOp(null);
  }

  function modelBadge(model: string) {
    const m = models.find((x) => x.value === model);
    return m ? <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${m.badge}`}>{m.label}</span> : <span className="text-[10px] text-slate-500 font-mono">{model}</span>;
  }

  const byCategory = routes.reduce<Record<string, Route[]>>((acc, r) => {
    (acc[r.category] = acc[r.category] || []).push(r);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="🎚️"
        title={t('ai_routing.title')}
        description={t('ai_routing.subtitle')}
        actions={
          <div className="flex gap-2">
            <button onClick={() => { setShowRecentCalls((v) => !v); if (!showRecentCalls) loadCalls(); }} className="text-sm bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg">
              {showRecentCalls ? t('ai_routing.hide_calls') : t('ai_routing.show_calls')}
            </button>
            <button onClick={load} className="text-sm bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg">{t('candlist.reload')}</button>
          </div>
        }
      />

      {showRecentCalls && (
        <section className="mt-5 bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">{t('ai_routing.recent_calls')}</h3>
          {recentCalls.length === 0 ? (
            <p className="text-sm text-slate-500">{t('ai_routing.no_calls')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-slate-500 border-b border-slate-100">
                  <tr><th className="text-left py-2 pr-4">{t('ai_routing.col.when')}</th><th className="text-left pr-4">{t('ai_routing.col.op')}</th><th className="text-left pr-4">{t('ai_routing.col.model')}</th><th className="text-right pr-4">{t('ai_routing.col.tokens')}</th><th className="text-right">{t('ai_routing.col.cost')}</th></tr>
                </thead>
                <tbody>
                  {recentCalls.map((c, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-2 pr-4 text-slate-500 whitespace-nowrap">{new Date(c.created_at).toLocaleTimeString()}</td>
                      <td className="pr-4 font-mono">{c.operation}</td>
                      <td className="pr-4">{modelBadge(c.model)}</td>
                      <td className="pr-4 text-right tabular-nums">{c.input_tokens || 0}/{c.output_tokens || 0}</td>
                      <td className="text-right tabular-nums">{c.cost_cents !== null ? `${(c.cost_cents / 100).toFixed(4)}€` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {loading ? (
        <div className="text-center text-slate-500 py-12">{t('candlist.loading')}</div>
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(byCategory).map(([category, ops]) => (
            <section key={category}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">{t(`ai_routing.cat.${category}`)}</h2>
              <div className={`rounded-xl border ${CATEGORY_COLORS[category] || CATEGORY_COLORS.general} divide-y divide-slate-100`}>
                {ops.map((r) => (
                  <div key={r.operation} className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-mono text-sm font-semibold text-slate-900">{r.operation}</h3>
                          {!r.enabled && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold uppercase tracking-wider">{t('ai_routing.disabled')}</span>}
                        </div>
                        {r.description && <p className="text-xs text-slate-600 mt-0.5">{r.description}</p>}
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={r.enabled}
                          onChange={(e) => updateRoute(r.operation, { enabled: e.target.checked })}
                          disabled={savingOp === r.operation}
                          className="h-4 w-4 accent-brand-600" />
                        <span className="text-xs text-slate-600">{t('ai_routing.enabled')}</span>
                      </label>
                    </div>

                    <div className="mt-3 grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t('ai_routing.primary')}</label>
                        <select value={r.model_primary} onChange={(e) => updateRoute(r.operation, { model_primary: e.target.value })}
                          disabled={savingOp === r.operation} className="input mt-1 text-sm">
                          {models.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t('ai_routing.fallback')}</label>
                        <select value={r.model_fallback || ''} onChange={(e) => updateRoute(r.operation, { model_fallback: e.target.value || null })}
                          disabled={savingOp === r.operation} className="input mt-1 text-sm">
                          <option value="">{t('ai_routing.none')}</option>
                          {models.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Max tokens</label>
                        <input type="number" min="256" max="16384" value={r.max_tokens}
                          onChange={(e) => updateRoute(r.operation, { max_tokens: parseInt(e.target.value) || 4096 })}
                          disabled={savingOp === r.operation} className="input mt-1 text-sm tabular-nums" />
                      </div>
                    </div>

                    {r.cost_per_1m_input_cents && r.cost_per_1m_output_cents && (
                      <p className="mt-2 text-[10px] text-slate-500">
                        💰 {t('ai_routing.cost_estimate', {
                          in_cents: r.cost_per_1m_input_cents,
                          out_cents: r.cost_per_1m_output_cents
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
        <p className="font-semibold mb-1">ℹ️ {t('ai_routing.tip_title')}</p>
        <p>{t('ai_routing.tip_body')}</p>
      </div>
    </div>
  );
}
