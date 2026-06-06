'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Plus, CalendarClock, Trash2, X, Clock, BookOpen, Calendar } from 'lucide-react';

export function DripClient({ schedules, courses }: { schedules: any[]; courses: any[] }) {
  const [creating, setCreating] = useState(false);
  const [filterCourse, setFilterCourse] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const byCourse = useMemo(() => {
    const filtered = filterCourse ? schedules.filter((s) => s.course_id === filterCourse) : schedules;
    const map = new Map<string, any[]>();
    for (const s of filtered) {
      const arr = map.get(s.course_id) || [];
      arr.push(s);
      map.set(s.course_id, arr);
    }
    return Array.from(map.entries()).map(([course_id, items]) => ({
      course_id,
      course_title: items[0]?.course_title || '(sem título)',
      items: items.sort((a, b) => a.unlock_day - b.unlock_day || a.module_index - b.module_index || a.lesson_index - b.lesson_index),
    }));
  }, [schedules, filterCourse]);

  async function create(form: any) {
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_drip_schedule_upsert', {
        p_course_id: form.course_id,
        p_module_index: Number(form.module_index),
        p_lesson_index: Number(form.lesson_index),
        p_unlock_day: Number(form.unlock_day),
        p_unlock_time: form.unlock_time || '09:00:00',
      });
      if (error) throw error;
      toast.success('Calendarização guardada');
      setCreating(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!confirm('Remover esta calendarização?')) return;
    try {
      const sb = createClient();
      await sb.rpc('nl_admin_drip_schedule_delete', { p_id: id });
      toast.success('Removida');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none">
              <option value="">Todos os cursos ({byCourse.length})</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.title}</option>)}
            </select>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm">
            <Plus className="h-4 w-4" /> Nova calendarização
          </button>
        </div>

        {byCourse.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 items-center justify-center mb-3">
              <CalendarClock className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">Sem calendarizações ativas</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Sem drip, todas as aulas ficam disponíveis logo na inscrição.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {byCourse.map((group) => (
              <div key={group.course_id} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-semibold text-sm text-slate-900">{group.course_title}</h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">
                    {group.items.length} {group.items.length === 1 ? 'aula' : 'aulas'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {group.items.map((s) => (
                    <div
                      key={s.id}
                      className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-3 group hover:shadow-sm transition-shadow">
                      <div className="h-9 w-9 bg-white rounded-lg flex items-center justify-center text-emerald-700 font-bold text-xs">
                        D{s.unlock_day}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-900">
                          Módulo {s.module_index + 1} · Aula {s.lesson_index + 1}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {s.unlock_time?.substring(0, 5) || '09:00'}
                        </div>
                      </div>
                      <button
                        onClick={() => del(s.id)}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white rounded text-slate-400 hover:text-rose-600 transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {creating && <DripModal courses={courses} busy={busy} onCreate={create} onClose={() => setCreating(false)} />}
    </>
  );
}

function DripModal({ courses, busy, onCreate, onClose }: any) {
  const [form, setForm] = useState({
    course_id: courses[0]?.id || '',
    module_index: 0,
    lesson_index: 0,
    unlock_day: 1,
    unlock_time: '09:00',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-slate-100 p-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Nova calendarização</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Curso</label>
            <select
              value={form.course_id}
              onChange={(e) => setForm({ ...form, course_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none">
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.emoji} {c.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Módulo (0-indexed)</label>
              <input
                type="number" min={0}
                value={form.module_index}
                onChange={(e) => setForm({ ...form, module_index: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Lição (0-indexed)</label>
              <input
                type="number" min={0}
                value={form.lesson_index}
                onChange={(e) => setForm({ ...form, lesson_index: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Dia após inscrição
              </label>
              <input
                type="number" min={1}
                value={form.unlock_day}
                onChange={(e) => setForm({ ...form, unlock_day: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Hora
              </label>
              <input
                type="time"
                value={form.unlock_time}
                onChange={(e) => setForm({ ...form, unlock_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none" />
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 p-4 flex items-center justify-end gap-2 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-white rounded-lg font-medium">Cancelar</button>
          <button
            onClick={() => onCreate(form)}
            disabled={busy || !form.course_id}
            className="px-5 py-2 bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
            {busy ? 'A guardar…' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}
