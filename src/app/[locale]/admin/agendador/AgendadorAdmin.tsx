'use client';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Play, Power, Pencil, Save, X, History, AlertTriangle, Clock } from 'lucide-react';

type Task = {
  key: string; command: string; mode: string; period_seconds: number | null;
  at_hour: number | null; at_minute: number | null; dow: number | null; dom: number | null;
  category: string | null; enabled: boolean; last_run_at: string | null;
  last_status: string | null; last_detail: string | null; fail_24h: number; runs_24h: number;
};
type Run = { status: string; detail: string | null; started_at: string; finished_at: string | null };

export function AgendadorAdmin({ locale }: { locale: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Task[]>([]);
  const [msgs, setMsgs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [runsFor, setRunsFor] = useState<string | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);

  const t = (k: string) => msgs[k] ?? k;

  async function load() {
    setLoading(true);
    try {
      const [tasksRes, msgsRes] = await Promise.all([
        supabase.rpc('nl_admin_scheduled_tasks_list'),
        supabase.rpc('nl_i18n_messages_for_lang', { p_lang: locale }),
      ]);
      if (Array.isArray(tasksRes.data)) setRows(tasksRes.data as Task[]);
      if (msgsRes.data && typeof msgsRes.data === 'object') setMsgs(msgsRes.data as Record<string, string>);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function cadence(x: Task): string {
    if (x.mode === 'interval' && x.period_seconds != null) {
      const s = x.period_seconds;
      if (s % 3600 === 0) return t('agendador.mode.interval') + ' · ' + (s / 3600) + 'h';
      if (s % 60 === 0) return t('agendador.mode.interval') + ' · ' + (s / 60) + 'min';
      return t('agendador.mode.interval') + ' · ' + s + 's';
    }
    const hh = String(x.at_hour ?? 0).padStart(2, '0');
    const mm = String(x.at_minute ?? 0).padStart(2, '0');
    if (x.mode === 'daily') return t('agendador.mode.daily') + ' · ' + hh + ':' + mm;
    if (x.mode === 'weekly') return t('agendador.mode.weekly') + ' · ' + hh + ':' + mm + ' (dow ' + (x.dow ?? '?') + ')';
    if (x.mode === 'monthly') return t('agendador.mode.monthly') + ' · ' + hh + ':' + mm + ' (' + (x.dom ?? '?') + ')';
    return x.mode;
  }

  async function runNow(key: string) {
    try {
      const { data } = await supabase.rpc('nl_admin_scheduled_task_run_now', { p_key: key });
      const ok = (data as { ok?: boolean })?.ok;
      if (ok) toast.success(key + ': ' + t('agendador.ran_ok'));
      else toast.error(key + ': ' + t('agendador.ran_err'));
      await load();
    } catch { toast.error(t('agendador.ran_err')); }
  }

  async function toggle(x: Task) {
    try {
      await supabase.rpc('nl_admin_scheduled_task_set_enabled', { p_key: x.key, p_enabled: !x.enabled });
      await load();
    } catch { toast.error('erro'); }
  }

  async function openRuns(key: string) {
    setRunsFor(key); setRuns([]);
    try {
      const { data } = await supabase.rpc('nl_admin_scheduled_task_runs', { p_key: key, p_limit: 20 });
      if (Array.isArray(data)) setRuns(data as Run[]);
    } catch { /* noop */ }
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const e = editing;
      const { data, error } = await supabase.rpc('nl_admin_scheduled_task_upsert', {
        p_key: e.key, p_command: e.command, p_mode: e.mode,
        p_period_seconds: e.period_seconds, p_at_hour: e.at_hour, p_at_minute: e.at_minute,
        p_dow: e.dow, p_dom: e.dom, p_category: e.category, p_enabled: e.enabled,
      });
      if (error || !(data as { ok?: boolean })?.ok) throw error || new Error('fail');
      toast.success('OK');
      setEditing(null);
      await load();
    } catch { toast.error('erro'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  const groups = Array.from(new Set(rows.map((r) => r.category ?? ''))).sort();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div>
        <AdminPageHeader title={t('agendador.title')} />
        <p className="text-sm text-slate-500 mt-1">{t('agendador.subtitle')}</p>
      </div>

      {rows.length === 0 && <p className="text-sm text-slate-400">{t('agendador.empty')}</p>}

      {groups.map((g) => (
        <div key={g} className="space-y-2">
          {g && <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{g}</h2>}
          <div className="space-y-2">
            {rows.filter((r) => (r.category ?? '') === g).map((x) => (
              <div key={x.key} className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 truncate">{x.key}</span>
                    {x.fail_24h > 0 && <span className="inline-flex items-center gap-1 text-xs text-rose-600"><AlertTriangle className="h-3.5 w-3.5" />{x.fail_24h} {t('agendador.fail24h')}</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{cadence(x)}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {t('agendador.col.last')}: {x.last_run_at ? new Date(x.last_run_at).toLocaleString(locale) : t('agendador.never')}
                    {x.last_status && <span className={x.last_status === 'error' ? 'text-rose-500 ml-1' : 'text-emerald-600 ml-1'}>· {x.last_status}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button title={t('agendador.run_now')} onClick={() => runNow(x.key)} className="p-2 rounded-lg hover:bg-violet-50 text-violet-600"><Play className="h-4 w-4" /></button>
                  <button title={t('agendador.runs')} onClick={() => openRuns(x.key)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><History className="h-4 w-4" /></button>
                  <button title={t('agendador.edit')} onClick={() => setEditing(x)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="h-4 w-4" /></button>
                  <button title={x.enabled ? t('agendador.enabled') : t('agendador.disabled')} onClick={() => toggle(x)} className={'p-2 rounded-lg ' + (x.enabled ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-100')}><Power className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {runsFor && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setRunsFor(null)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-4 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">{runsFor} · {t('agendador.runs')}</h3>
              <button onClick={() => setRunsFor(null)} className="p-1 text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            {runs.length === 0 ? <p className="text-sm text-slate-400">—</p> : (
              <ul className="space-y-1 text-xs">
                {runs.map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 border-b border-slate-100 py-1">
                    <span className={r.status === 'error' ? 'text-rose-600' : r.status === 'ok' ? 'text-emerald-600' : 'text-slate-500'}>{r.status}</span>
                    <span className="text-slate-400">{new Date(r.started_at).toLocaleString(locale)}</span>
                    {r.detail && <span className="text-rose-500 truncate max-w-[50%]" title={r.detail}>{r.detail}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setEditing(null)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-4 max-h-[85vh] overflow-auto space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 truncate">{editing.key}</h3>
              <button onClick={() => setEditing(null)} className="p-1 text-slate-400"><X className="h-5 w-5" /></button>
            </div>

            <label className="block text-xs font-medium text-slate-600">{t('agendador.mode')}
              <select value={editing.mode} onChange={(e) => setEditing({ ...editing, mode: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="interval">{t('agendador.mode.interval')}</option>
                <option value="daily">{t('agendador.mode.daily')}</option>
                <option value="weekly">{t('agendador.mode.weekly')}</option>
                <option value="monthly">{t('agendador.mode.monthly')}</option>
              </select>
            </label>

            {editing.mode === 'interval' ? (
              <label className="block text-xs font-medium text-slate-600">{t('agendador.field.period')}
                <input type="number" value={editing.period_seconds ?? 0} onChange={(e) => setEditing({ ...editing, period_seconds: parseInt(e.target.value || '0', 10) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs font-medium text-slate-600">{t('agendador.field.hour')}
                  <input type="number" min={0} max={23} value={editing.at_hour ?? 0} onChange={(e) => setEditing({ ...editing, at_hour: parseInt(e.target.value || '0', 10) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block text-xs font-medium text-slate-600">{t('agendador.field.minute')}
                  <input type="number" min={0} max={59} value={editing.at_minute ?? 0} onChange={(e) => setEditing({ ...editing, at_minute: parseInt(e.target.value || '0', 10) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                {editing.mode === 'weekly' && (
                  <label className="block text-xs font-medium text-slate-600">{t('agendador.field.dow')}
                    <input type="number" min={0} max={6} value={editing.dow ?? 1} onChange={(e) => setEditing({ ...editing, dow: parseInt(e.target.value || '0', 10) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                )}
                {editing.mode === 'monthly' && (
                  <label className="block text-xs font-medium text-slate-600">{t('agendador.field.dom')}
                    <input type="number" min={1} max={31} value={editing.dom ?? 1} onChange={(e) => setEditing({ ...editing, dom: parseInt(e.target.value || '1', 10) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                )}
              </div>
            )}

            <label className="block text-xs font-medium text-slate-600">{t('agendador.field.category')}
              <input value={editing.category ?? ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>

            <label className="block text-xs font-medium text-slate-600">{t('agendador.field.command')}
              <textarea value={editing.command} onChange={(e) => setEditing({ ...editing, command: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono" />
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditing(null)} className="px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">{t('agendador.cancel')}</button>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t('agendador.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
