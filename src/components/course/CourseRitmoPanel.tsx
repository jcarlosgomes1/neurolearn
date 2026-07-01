'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Clock, CalendarClock, ListChecks } from 'lucide-react';
import { EmptyState } from '@/components/primitives/EmptyState';

interface Sched { id: string; module_index: number; lesson_index: number; unlock_day: number; unlock_time: string | null }

/** Aba Ritmo: calendarização (drip) das aulas deste curso. Reutiliza nl_admin_drip_schedules_list/upsert/delete. */
export function CourseRitmoPanel({ courseId }: { courseId: string }) {
  const t = useTranslations();
  const [items, setItems] = useState<Sched[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ module_index: 0, lesson_index: 0, unlock_day: 1, unlock_time: '09:00' });
  const [progMode, setProgMode] = useState<string>('inherit');
  const [globalMode, setGlobalMode] = useState<string>('sequential');
  const [progBusy, setProgBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_drip_schedules_list', { p_course_id: courseId });
      if (error) throw error;
      const arr = (Array.isArray(data) ? data : []) as Sched[];
      arr.sort((a, b) => a.unlock_day - b.unlock_day || a.module_index - b.module_index || a.lesson_index - b.lesson_index);
      setItems(arr);
      try {
        const pg = await sb.rpc('nl_admin_progression_get');
        const g = (pg.data as any)?.global_mode; if (g) setGlobalMode(g);
        const c = ((pg.data as any)?.courses || []).find((x: any) => String(x.id) === String(courseId));
        if (c) setProgMode(c.progression || 'inherit');
      } catch {}
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [courseId]);
  useEffect(() => { load(); }, [load]);

  async function add() {
    setBusy(true);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_drip_schedule_upsert', {
        p_course_id: courseId, p_module_index: Number(form.module_index), p_lesson_index: Number(form.lesson_index),
        p_unlock_day: Number(form.unlock_day), p_unlock_time: (form.unlock_time || '09:00') + ':00',
      });
      if (error) throw error;
      toast.success(t('course_ws.ritmo.saved'));
      await load();
    } catch { toast.error(t('course_ws.ritmo.error')); }
    finally { setBusy(false); }
  }

  async function setProg(mode: string) {
    setProgBusy(true);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_progression_set_course', { p_course_id: courseId, p_mode: mode });
      if (error) throw error;
      setProgMode(mode);
      toast.success(t('course_ws.ritmo.prog_saved'));
    } catch { toast.error(t('course_ws.ritmo.error')); }
    finally { setProgBusy(false); }
  }

  async function del(id: string) {
    if (!confirm(t('course_ws.ritmo.del_confirm'))) return;
    try {
      assertNotPeekClient();
      const sb = createClient();
      await sb.rpc('nl_admin_drip_schedule_delete', { p_id: id });
      toast.success(t('course_ws.ritmo.removed'));
      await load();
    } catch { toast.error(t('course_ws.ritmo.error')); }
  }

  const progOpts = [
    { v: 'inherit', label: `${t('course_ws.ritmo.prog_inherit')} · ${globalMode === 'free' ? t('course_ws.ritmo.prog_free') : t('course_ws.ritmo.prog_sequential')}` },
    { v: 'sequential', label: t('course_ws.ritmo.prog_sequential') },
    { v: 'free', label: t('course_ws.ritmo.prog_free') },
  ];
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-1"><ListChecks className="h-4 w-4 text-brand-600" /><h3 className="text-sm font-semibold text-slate-900">{t('course_ws.ritmo.prog_title')}</h3></div>
        <p className="text-[11px] text-slate-400 mb-3">{t('course_ws.ritmo.prog_hint')}</p>
        <div className="flex flex-wrap gap-2">
          {progOpts.map((o) => (
            <button key={o.v} type="button" disabled={progBusy} onClick={() => setProg(o.v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${progMode === o.v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-3"><CalendarClock className="h-4 w-4 text-emerald-600" /><h3 className="text-sm font-semibold text-slate-900">{t('course_ws.ritmo.add_title')}</h3></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <label className="text-xs text-slate-500">{t('course_ws.ritmo.module')}<input type="number" min={0} value={form.module_index} onChange={(e) => setForm({ ...form, module_index: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" /></label>
          <label className="text-xs text-slate-500">{t('course_ws.ritmo.lesson')}<input type="number" min={0} value={form.lesson_index} onChange={(e) => setForm({ ...form, lesson_index: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" /></label>
          <label className="text-xs text-slate-500">{t('course_ws.ritmo.day')}<input type="number" min={1} value={form.unlock_day} onChange={(e) => setForm({ ...form, unlock_day: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" /></label>
          <label className="text-xs text-slate-500">{t('course_ws.ritmo.time')}<input type="time" value={form.unlock_time} onChange={(e) => setForm({ ...form, unlock_time: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" /></label>
        </div>
        <button onClick={add} disabled={busy} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium px-3.5 py-2 disabled:opacity-50 hover:bg-slate-800">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{t('course_ws.ritmo.add')}</button>
        <p className="mt-2 text-[11px] text-slate-400">{t('course_ws.ritmo.hint')}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white"><EmptyState icon={CalendarClock} title={t('course_ws.ritmo.empty_title')} hint={t('course_ws.ritmo.empty_hint')} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {items.map((s) => (
            <div key={s.id} className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-3 group">
              <div className="h-9 w-9 bg-white rounded-lg flex items-center justify-center text-emerald-700 font-bold text-xs">D{s.unlock_day}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-900">{t('course_ws.ritmo.module')} {s.module_index + 1} · {t('course_ws.ritmo.lesson')} {s.lesson_index + 1}</div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" />{(s.unlock_time || '09:00:00').substring(0, 5)}</div>
              </div>
              <button onClick={() => del(s.id)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white rounded text-slate-400 hover:text-rose-600 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
