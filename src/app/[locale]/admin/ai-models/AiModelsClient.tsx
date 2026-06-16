'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Check, X } from 'lucide-react';

interface Model {
  model: string;
  label: string | null;
  provider: string | null;
  kind: string | null;
  input_price_per_mtok: number | null;
  output_price_per_mtok: number | null;
  active: boolean;
  notes: string | null;
  sort_order: number | null;
  endpoint: string | null;
  secret_key: string | null;
}

const PROVIDER_BADGE: Record<string, string> = {
  anthropic: 'bg-violet-100 text-violet-700',
  openai: 'bg-emerald-100 text-emerald-700',
  deepseek: 'bg-indigo-100 text-indigo-700',
  voyage: 'bg-amber-100 text-amber-700',
  google: 'bg-blue-100 text-blue-700',
};

const SAFE_COLS = 'model,label,provider,kind,input_price_per_mtok,output_price_per_mtok,active,notes,sort_order,endpoint,secret_key';

const emptyDraft = (): Partial<Model> => ({
  model: '', label: '', provider: 'anthropic', kind: 'chat',
  input_price_per_mtok: 0, output_price_per_mtok: 0, active: true, notes: '', endpoint: '', secret_key: '',
});

export function AiModelsClient() {
  const t = useTranslations();
  const supabase = useMemo(() => createClient(), []);

  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Model>>({});
  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState<Partial<Model>>(emptyDraft());

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('nl_ai_models').select(SAFE_COLS)
      .order('sort_order', { ascending: true }).order('model', { ascending: true });
    if (error) toast.error(error.message);
    setModels((data as Model[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(m: Model) {
    setSaving(m.model);
    const { error } = await supabase.from('nl_ai_models').update({ active: !m.active }).eq('model', m.model);
    if (error) toast.error(error.message); else { toast.success(t('aimodels.saved')); load(); }
    setSaving(null);
  }

  function startEdit(m: Model) {
    setEditing(m.model);
    setDraft({ label: m.label, provider: m.provider, kind: m.kind,
      input_price_per_mtok: m.input_price_per_mtok, output_price_per_mtok: m.output_price_per_mtok, notes: m.notes, endpoint: m.endpoint, secret_key: m.secret_key });
  }

  async function saveEdit(model: string) {
    setSaving(model);
    const { error } = await supabase.from('nl_ai_models').update({
      label: draft.label || null,
      provider: (draft.provider || '').trim() || null,
      kind: (draft.kind || '').trim() || null,
      input_price_per_mtok: Number(draft.input_price_per_mtok) || 0,
      output_price_per_mtok: Number(draft.output_price_per_mtok) || 0,
      notes: draft.notes || null,
      endpoint: (draft.endpoint || '').trim() || null,
      secret_key: (draft.secret_key || '').trim() || null,
    }).eq('model', model);
    if (error) toast.error(error.message);
    else { toast.success(t('aimodels.saved')); setEditing(null); load(); }
    setSaving(null);
  }

  async function createModel() {
    const id = (newDraft.model || '').trim();
    if (!id) { toast.error(t('aimodels.model_required')); return; }
    setSaving('__new__');
    const { error } = await supabase.from('nl_ai_models').insert({
      model: id,
      label: newDraft.label || null,
      provider: (newDraft.provider || '').trim() || null,
      kind: (newDraft.kind || '').trim() || 'chat',
      input_price_per_mtok: Number(newDraft.input_price_per_mtok) || 0,
      output_price_per_mtok: Number(newDraft.output_price_per_mtok) || 0,
      active: newDraft.active ?? true,
      notes: newDraft.notes || null,
      endpoint: (newDraft.endpoint || '').trim() || null,
      secret_key: (newDraft.secret_key || '').trim() || null,
      sort_order: 100,
    });
    if (error) toast.error(error.message);
    else { toast.success(t('aimodels.created')); setCreating(false); setNewDraft(emptyDraft()); load(); }
    setSaving(null);
  }

  const byProvider = models.reduce<Record<string, Model[]>>((acc, m) => {
    const k = m.provider || 'other';
    (acc[k] = acc[k] || []).push(m);
    return acc;
  }, {});

  const priceField = (label: string, val: number | null | undefined, on: (v: number) => void) => (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</label>
      <div className="mt-1 flex items-center gap-1">
        <span className="text-slate-400 text-sm">$</span>
        <input type="number" min="0" step="0.01" value={val ?? 0}
          onChange={(e) => on(parseFloat(e.target.value) || 0)}
          className="input text-sm tabular-nums" />
        <span className="text-[10px] text-slate-400 whitespace-nowrap">{t('aimodels.per_mtok')}</span>
      </div>
    </div>
  );

  return (
    <div className="mt-6 space-y-6">
      {/* Adicionar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {!creating ? (
          <button onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900">
            <Plus className="h-4 w-4" /> {t('aimodels.add')}
          </button>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">{t('aimodels.new_model')}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t('aimodels.col.model')}</label>
                <input value={newDraft.model || ''} onChange={(e) => setNewDraft({ ...newDraft, model: e.target.value })}
                  placeholder={t('aimodels.model_ph')} className="input mt-1 text-sm font-mono" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t('aimodels.col.label')}</label>
                <input value={newDraft.label || ''} onChange={(e) => setNewDraft({ ...newDraft, label: e.target.value })}
                  placeholder={t('aimodels.label_ph')} className="input mt-1 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t('aimodels.col.provider')}</label>
                <input list="nl-providers" value={newDraft.provider || ''} onChange={(e) => setNewDraft({ ...newDraft, provider: e.target.value })}
                  className="input mt-1 text-sm" />
                <datalist id="nl-providers"><option value="anthropic" /><option value="openai" /><option value="google" /><option value="deepseek" /><option value="voyage" /></datalist>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t('aimodels.col.kind')}</label>
                <select value={newDraft.kind || 'chat'} onChange={(e) => setNewDraft({ ...newDraft, kind: e.target.value })} className="input mt-1 text-sm">
                  <option value="chat">{t('aimodels.kind.chat')}</option>
                  <option value="embedding">{t('aimodels.kind.embedding')}</option>
                </select>
              </div>
              {priceField(t('aimodels.col.in_price'), newDraft.input_price_per_mtok, (v) => setNewDraft({ ...newDraft, input_price_per_mtok: v }))}
              {priceField(t('aimodels.col.out_price'), newDraft.output_price_per_mtok, (v) => setNewDraft({ ...newDraft, output_price_per_mtok: v }))}
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t('aimodels.col.notes')}</label>
              <input value={newDraft.notes || ''} onChange={(e) => setNewDraft({ ...newDraft, notes: e.target.value })}
                placeholder={t('aimodels.notes_ph')} className="input mt-1 text-sm" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Endpoint (URL da API)</label>
                <input value={newDraft.endpoint || ''} onChange={(e) => setNewDraft({ ...newDraft, endpoint: e.target.value })}
                  placeholder="https://api.openai.com/v1/chat/completions" className="input mt-1 text-sm font-mono" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Segredo (chave em Integrações)</label>
                <input list="nl-secret-keys" value={newDraft.secret_key || ''} onChange={(e) => setNewDraft({ ...newDraft, secret_key: e.target.value })}
                  placeholder="OPENAI_API_KEY" className="input mt-1 text-sm font-mono" />
                <datalist id="nl-secret-keys"><option value="ANTHROPIC_API_KEY" /><option value="OPENAI_API_KEY" /><option value="GEMINI_API_KEY" /><option value="DEEPSEEK_API_KEY" /><option value="VOYAGE_API_KEY" /></datalist>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={newDraft.active ?? true} onChange={(e) => setNewDraft({ ...newDraft, active: e.target.checked })} className="h-4 w-4 accent-violet-600" />
              <span className="text-xs text-slate-600">{t('aimodels.col.active')}</span>
            </label>
            <div className="flex gap-2">
              <button onClick={createModel} disabled={saving === '__new__'}
                className="inline-flex items-center gap-1.5 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
                {saving === '__new__' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {t('aimodels.save')}
              </button>
              <button onClick={() => { setCreating(false); setNewDraft(emptyDraft()); }}
                className="text-sm bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg">{t('aimodels.cancel')}</button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>
      ) : models.length === 0 ? (
        <p className="text-center text-slate-500 py-12">{t('aimodels.empty')}</p>
      ) : (
        Object.entries(byProvider).map(([provider, list]) => (
          <section key={provider}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">{provider}</h2>
            <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
              {list.map((m) => (
                <div key={m.model} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">{m.label || m.model}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PROVIDER_BADGE[m.provider || ''] || 'bg-slate-100 text-slate-600'}`}>{m.kind === 'embedding' ? t('aimodels.kind.embedding') : t('aimodels.kind.chat')}</span>
                        {!m.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold uppercase tracking-wider">{t('aimodels.active_off')}</span>}
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{m.model}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={m.active} disabled={saving === m.model} onChange={() => toggleActive(m)} className="h-4 w-4 accent-violet-600" />
                        <span className="text-xs text-slate-600">{t('aimodels.col.active')}</span>
                      </label>
                      {editing === m.model ? (
                        <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
                      ) : (
                        <button onClick={() => startEdit(m)} className="text-slate-400 hover:text-violet-700"><Pencil className="h-4 w-4" /></button>
                      )}
                    </div>
                  </div>

                  {editing === m.model ? (
                    <div className="mt-3 space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t('aimodels.col.label')}</label>
                          <input value={draft.label || ''} onChange={(e) => setDraft({ ...draft, label: e.target.value })} className="input mt-1 text-sm" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t('aimodels.col.provider')}</label>
                          <input list="nl-providers" value={draft.provider || ''} onChange={(e) => setDraft({ ...draft, provider: e.target.value })} className="input mt-1 text-sm" />
                        </div>
                        {priceField(t('aimodels.col.in_price'), draft.input_price_per_mtok, (v) => setDraft({ ...draft, input_price_per_mtok: v }))}
                        {priceField(t('aimodels.col.out_price'), draft.output_price_per_mtok, (v) => setDraft({ ...draft, output_price_per_mtok: v }))}
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t('aimodels.col.notes')}</label>
                        <input value={draft.notes || ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="input mt-1 text-sm" />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Endpoint (URL da API)</label>
                          <input value={draft.endpoint || ''} onChange={(e) => setDraft({ ...draft, endpoint: e.target.value })} placeholder="https://…" className="input mt-1 text-sm font-mono" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Segredo (chave em Integrações)</label>
                          <input list="nl-secret-keys" value={draft.secret_key || ''} onChange={(e) => setDraft({ ...draft, secret_key: e.target.value })} placeholder="OPENAI_API_KEY" className="input mt-1 text-sm font-mono" />
                        </div>
                      </div>
                      <button onClick={() => saveEdit(m.model)} disabled={saving === m.model}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
                        {saving === m.model ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {t('aimodels.save')}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                      <span>{t('aimodels.col.in_price')}: <span className="font-semibold tabular-nums">${Number(m.input_price_per_mtok || 0).toFixed(2)}</span> <span className="text-slate-400">/ M</span></span>
                      <span>{t('aimodels.col.out_price')}: <span className="font-semibold tabular-nums">${Number(m.output_price_per_mtok || 0).toFixed(2)}</span> <span className="text-slate-400">/ M</span></span>
                      {m.notes && <span className="text-slate-400 truncate">· {m.notes}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
        <p className="font-semibold mb-1">ℹ️ {t('aimodels.tip_title')}</p>
        <p>{t('aimodels.tip_body')}</p>
      </div>
    </div>
  );
}
