'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Pencil, Trophy } from 'lucide-react';

const PERIODS = ['daily', 'weekly'] as const;
const METRICS = ['lessons_completed', 'xp_earned', 'courses_completed', 'quizzes_passed', 'streak_days', 'practice_completed'] as const;
const LANGS = ['pt', 'en', 'es', 'fr'] as const;

type LangMap = Record<string, string>;
type Challenge = {
  id: string; code: string; period: string; metric: string; target: number;
  reward_xp: number; reward_badge_code: string | null; icon: string | null;
  label_key: string; desc_key: string; sort_order: number; enabled: boolean;
  label: LangMap; descr: LangMap;
};

const EMPTY = {
  id: null as string | null, code: '', period: 'daily', metric: 'lessons_completed',
  target: 1, reward_xp: 50, reward_badge_code: '', icon: '🎯', sort_order: 100, enabled: true,
  label: { pt: '', en: '', es: '', fr: '' } as LangMap,
  descr: { pt: '', en: '', es: '', fr: '' } as LangMap,
};

export function ChallengesAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const t = useTranslations();
  const [rows, setRows] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase.rpc('nl_admin_challenges_list');
      const d = data as { ok?: boolean; challenges?: Challenge[] };
      if (d?.ok && Array.isArray(d.challenges)) setRows(d.challenges);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function startCreate() { setForm({ ...EMPTY }); setOpen(true); }
  function startEdit(c: Challenge) {
    setForm({
      id: c.id, code: c.code, period: c.period, metric: c.metric, target: Number(c.target),
      reward_xp: c.reward_xp, reward_badge_code: c.reward_badge_code || '', icon: c.icon || '🎯',
      sort_order: c.sort_order, enabled: c.enabled,
      label: { pt: c.label?.pt || '', en: c.label?.en || '', es: c.label?.es || '', fr: c.label?.fr || '' },
      descr: { pt: c.descr?.pt || '', en: c.descr?.en || '', es: c.descr?.es || '', fr: c.descr?.fr || '' },
    });
    setOpen(true);
  }

  async function save() {
    if (!form.code.trim()) { toast.error('Código obrigatório'); return; }
    if (!form.label.pt.trim()) { toast.error('Nome (PT) obrigatório'); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('nl_admin_challenge_upsert', {
        p_id: form.id, p_code: form.code.trim(), p_period: form.period, p_metric: form.metric,
        p_target: Number(form.target) || 1, p_reward_xp: Number(form.reward_xp) || 0,
        p_reward_badge_code: form.reward_badge_code || null, p_icon: form.icon || '🎯',
        p_sort: Number(form.sort_order) || 100, p_enabled: form.enabled,
        p_label: form.label, p_desc: form.descr,
      });
      if (error || !(data as { ok?: boolean })?.ok) throw error || new Error('fail');
      toast.success(form.id ? 'Desafio atualizado' : 'Desafio criado');
      setOpen(false); setForm({ ...EMPTY });
      await load();
    } catch { toast.error('Erro ao guardar'); }
    finally { setSaving(false); }
  }

  async function toggle(c: Challenge) {
    setRows((r) => r.map((x) => (x.id === c.id ? { ...x, enabled: !x.enabled } : x)));
    const { error } = await supabase.rpc('nl_admin_challenge_set_enabled', { p_id: c.id, p_enabled: !c.enabled });
    if (error) { setRows((r) => r.map((x) => (x.id === c.id ? { ...x, enabled: c.enabled } : x))); toast.error('Erro'); }
  }

  const fieldCls = 'rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400';

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {!open ? (
        <button onClick={startCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700">
          <Plus className="h-4 w-4" /> Novo desafio
        </button>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="código (ex: daily_3_lessons)" className={fieldCls + ' font-mono'} disabled={!!form.id} />
            <input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} placeholder="ícone" className={fieldCls} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} className={fieldCls}>
              {PERIODS.map((p) => <option key={p} value={p}>{t('challenge.period.' + p)}</option>)}
            </select>
            <select value={form.metric} onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value }))} className={fieldCls}>
              {METRICS.map((m) => <option key={m} value={m}>{t('challenge.metric.' + m)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs text-slate-500">Objetivo<input type="number" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: Number(e.target.value) }))} className={fieldCls + ' w-full mt-1'} /></label>
            <label className="text-xs text-slate-500">XP<input type="number" value={form.reward_xp} onChange={(e) => setForm((f) => ({ ...f, reward_xp: Number(e.target.value) }))} className={fieldCls + ' w-full mt-1'} /></label>
            <label className="text-xs text-slate-500">Ordem<input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} className={fieldCls + ' w-full mt-1'} /></label>
          </div>
          <input value={form.reward_badge_code} onChange={(e) => setForm((f) => ({ ...f, reward_badge_code: e.target.value }))} placeholder="código do badge (opcional)" className={fieldCls + ' w-full font-mono'} />

          <div className="pt-1">
            <div className="text-xs font-semibold text-slate-500 mb-1">Nome (4 línguas)</div>
            <div className="grid grid-cols-2 gap-2">
              {LANGS.map((l) => (
                <input key={l} value={form.label[l]} onChange={(e) => setForm((f) => ({ ...f, label: { ...f.label, [l]: e.target.value } }))} placeholder={l.toUpperCase()} className={fieldCls} />
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">Descrição (4 línguas, opcional)</div>
            <div className="grid grid-cols-2 gap-2">
              {LANGS.map((l) => (
                <input key={l} value={form.descr[l]} onChange={(e) => setForm((f) => ({ ...f, descr: { ...f.descr, [l]: e.target.value } }))} placeholder={l.toUpperCase()} className={fieldCls} />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} className="rounded" /> Ativo
          </label>

          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
            </button>
            <button onClick={() => { setOpen(false); setForm({ ...EMPTY }); }} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">Cancelar</button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">Sem desafios ainda. Cria o primeiro.</div>
      ) : rows.map((c) => (
        <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 text-lg">{c.icon || <Trophy className="h-4 w-4 text-amber-600" />}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 truncate">{c.label?.pt || c.code}</span>
              <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{c.code}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px] text-slate-500">
              <span className="rounded-full bg-violet-50 text-violet-700 px-2 py-0.5">{t('challenge.period.' + c.period)}</span>
              <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">{t('challenge.metric.' + c.metric)} · {Number(c.target)}</span>
              <span className="text-amber-600 font-semibold">+{c.reward_xp} XP</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button onClick={() => toggle(c)} className={'text-[11px] font-semibold rounded-full px-2.5 py-1 ' + (c.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>{c.enabled ? 'Ativo' : 'Inativo'}</button>
            <button onClick={() => startEdit(c)} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-violet-600"><Pencil className="h-3.5 w-3.5" /> Editar</button>
          </div>
        </div>
      ))}
    </div>
  );
}
