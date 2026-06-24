'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useState, useTransition } from 'react';
import { bulkSetMonetizationAction } from './actions';
import { Save, AlertCircle, CheckCircle, DollarSign, Percent, Globe, Calendar, Tag, Users, Zap, Settings as SettingsIcon, FileText } from 'lucide-react';

const CATEGORY_META: Record<string, { label: string; icon: any; color: string; desc: string }> = {
  fees: { label: 'Comissões / Take Rates', icon: Percent, color: 'text-rose-600 bg-rose-50', desc: '% que a plataforma fica em cada tipo de transação' },
  pricing: { label: 'Preços', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50', desc: 'Preços base de subscriptions e produtos' },
  billing: { label: 'Billing', icon: FileText, color: 'text-blue-600 bg-blue-50', desc: 'Configurações de cobrança' },
  trial: { label: 'Trials', icon: Calendar, color: 'text-amber-600 bg-amber-50', desc: 'Durações e funis de trial' },
  currency: { label: 'Moedas / FX', icon: Globe, color: 'text-cyan-600 bg-cyan-50', desc: 'Moedas suportadas e taxas de câmbio' },
  tax: { label: 'IVA / VAT', icon: Tag, color: 'text-purple-600 bg-purple-50', desc: 'Taxas de IVA por país' },
  discount: { label: 'Descontos', icon: Tag, color: 'text-pink-600 bg-pink-50', desc: 'Volume discounts, caps de cupões' },
  affiliate: { label: 'Affiliate', icon: Users, color: 'text-indigo-600 bg-indigo-50', desc: 'Programa de afiliados' },
  usage: { label: 'Usage-based', icon: Zap, color: 'text-orange-600 bg-orange-50', desc: 'Cobrança baseada em uso (AI, storage)' },
  limits: { label: 'Limites', icon: SettingsIcon, color: 'text-slate-600 bg-slate-50', desc: 'Janelas de refund, payouts, etc' },
};

export function MonetizacaoClient({ initial }: { initial: any[] }) {
  const [configs] = useState(initial);
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped: Record<string, any[]> = {};
  for (const c of configs) {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category].push(c);
  }

  function updateEdit(key: string, value: any) {
    setEdits((e) => ({ ...e, [key]: value }));
    setSuccess(false);
  }

  function save() {
    setError(null); setSuccess(false);
    const updates: Record<string, any> = {};
    for (const k of Object.keys(edits)) {
      let v = edits[k];
      const cfg = configs.find((c) => c.key === k);
      if (cfg) {
        if (['percent', 'cents', 'integer'].includes(cfg.data_type)) {
          v = parseFloat(v);
          if (isNaN(v)) { setError(`Valor inválido em ${k}`); return; }
        } else if (cfg.data_type === 'boolean') {
          v = v === 'true' || v === true;
        } else if (cfg.data_type === 'json') {
          try { v = typeof v === 'string' ? JSON.parse(v) : v; } catch { setError(`JSON inválido em ${k}`); return; }
        }
      }
      updates[k] = v;
    }
    startTransition(async () => {
      const r = await bulkSetMonetizationAction(updates);
      if (r.ok) { setSuccess(true); setEdits({}); }
      else setError(r.error || 'erro');
    });
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="💰"
        title="Monetização"
        description="Todas as configurações financeiras da plataforma. Mudanças aplicam-se imediatamente a todas as transações futuras."
        actions={Object.keys(edits).length > 0 ? (
          <button onClick={save} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
            <Save className="h-4 w-4" /> Guardar {Object.keys(edits).length} alteração{Object.keys(edits).length === 1 ? '' : 'ões'}
          </button>
        ) : undefined}
      />

      {success && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Configurações guardadas</div>}
      {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>}

      <div className="space-y-4">
        {Object.keys(CATEGORY_META).map((cat) => {
          const items = grouped[cat] || [];
          if (items.length === 0) return null;
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          return (
            <section key={cat} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${meta.color} flex items-center justify-center`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">{meta.label}</h2>
                  <p className="text-xs text-slate-500">{meta.desc}</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((c) => (
                  <div key={c.key} className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">{c.label}</div>
                      {c.description && <div className="text-xs text-slate-500 mt-0.5">{c.description}</div>}
                      <code className="text-[10px] text-slate-400 font-mono">{c.key}</code>
                    </div>
                    <div className="w-full sm:w-64 flex items-center gap-2">
                      <ConfigInput config={c} value={edits[c.key] ?? c.value} onChange={(v) => updateEdit(c.key, v)} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ConfigInput({ config, value, onChange }: { config: any; value: any; onChange: (v: any) => void }) {
  const dt = config.data_type;
  const raw = typeof value === 'string' ? value.replace(/^"|"$/g, '') : value;
  
  if (dt === 'boolean') {
    const v = typeof raw === 'boolean' ? raw : raw === 'true' || raw === true;
    return (
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={v} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded" />
        <span className="text-sm">{v ? 'Activo' : 'Inactivo'}</span>
      </label>
    );
  }
  if (dt === 'json') {
    const v = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2);
    return <textarea value={v} onChange={(e) => onChange(e.target.value)} rows={3}
      className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono" />;
  }
  if (dt === 'percent') {
    return (
      <div className="flex items-center gap-1 w-full">
        <input type="number" value={raw} onChange={(e) => onChange(e.target.value)} step="0.5" min={config.min_value || 0} max={config.max_value || 100}
          className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm" />
        <span className="text-xs text-slate-500">%</span>
      </div>
    );
  }
  if (dt === 'cents') {
    return (
      <div className="flex items-center gap-1 w-full">
        <span className="text-xs text-slate-500">€</span>
        <input type="number" value={raw} onChange={(e) => onChange(e.target.value)} step="100"
          className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm" />
        <span className="text-[10px] text-slate-400">cents</span>
      </div>
    );
  }
  if (dt === 'integer') {
    return <input type="number" value={raw} onChange={(e) => onChange(e.target.value)} step="1"
      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />;
  }
  return <input type="text" value={raw} onChange={(e) => onChange(e.target.value)}
    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />;
}
