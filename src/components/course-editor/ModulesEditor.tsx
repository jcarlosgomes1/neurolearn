'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LessonEditor } from './LessonEditor';

export interface Lesson {
  id?: string;
  title: string;
  type: 'video' | 'reading' | 'exercise';
  duration_minutes?: number;
  content?: { p?: string[]; kp?: string[]; code?: string | null; tip?: string | null; q?: any };
}
export interface Module {
  id?: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

interface Props {
  course: { id: string; title: string; level: string };
  modules: Module[];
  onChange: (modules: Module[]) => void;
}

function genId() { return 'm_' + Math.random().toString(36).slice(2, 8); }

export function ModulesEditor({ course, modules, onChange }: Props) {
  const t = useTranslations('mod_editor');
  const [openModule, setOpenModule] = useState<number | null>(modules.length === 0 ? null : 0);
  const [editingLesson, setEditingLesson] = useState<{ mod: number; les: number } | null>(null);

  function addModule() {
    const next = [...modules, { id: genId(), title: t('module_n', { n: modules.length + 1 }), description: '', lessons: [] }];
    onChange(next);
    setOpenModule(next.length - 1);
  }
  function updateModule(idx: number, patch: Partial<Module>) {
    onChange(modules.map((m, i) => i === idx ? { ...m, ...patch } : m));
  }
  function deleteModule(idx: number) {
    if (!confirm(t('confirm_del_module'))) return;
    onChange(modules.filter((_, i) => i !== idx));
    setOpenModule(null);
  }
  function moveModule(idx: number, dir: -1 | 1) {
    const j = idx + dir; if (j < 0 || j >= modules.length) return;
    const next = [...modules]; [next[idx], next[j]] = [next[j], next[idx]]; onChange(next);
  }
  function addLesson(modIdx: number) {
    const lesIdx = modules[modIdx].lessons.length;
    onChange(modules.map((m, i) => i === modIdx ? { ...m, lessons: [...m.lessons, { id: genId(), title: t('lesson_n', { n: lesIdx + 1 }), type: 'reading' as const, duration_minutes: 15 }] } : m));
    setEditingLesson({ mod: modIdx, les: lesIdx });
  }
  function updateLesson(modIdx: number, lesIdx: number, patch: Partial<Lesson>) {
    onChange(modules.map((m, i) => i === modIdx ? { ...m, lessons: m.lessons.map((l, j) => j === lesIdx ? { ...l, ...patch } : l) } : m));
  }
  function deleteLesson(modIdx: number, lesIdx: number) {
    if (!confirm(t('confirm_del_lesson'))) return;
    onChange(modules.map((m, i) => i === modIdx ? { ...m, lessons: m.lessons.filter((_, j) => j !== lesIdx) } : m));
    setEditingLesson(null);
  }
  function moveLesson(modIdx: number, lesIdx: number, dir: -1 | 1) {
    const mod = modules[modIdx]; const j = lesIdx + dir;
    if (j < 0 || j >= mod.lessons.length) return;
    const lessons = [...mod.lessons]; [lessons[lesIdx], lessons[j]] = [lessons[j], lessons[lesIdx]];
    updateModule(modIdx, { lessons });
  }

  if (editingLesson) {
    const mod = modules[editingLesson.mod];
    const lesson = mod?.lessons[editingLesson.les];
    if (!lesson) { setEditingLesson(null); return null; }
    return (
      <LessonEditor
        course={course} moduleName={mod.title} lesson={lesson}
        lessonIndex={editingLesson.les} totalLessons={mod.lessons.length}
        prevLesson={mod.lessons[editingLesson.les - 1]?.title}
        nextLesson={mod.lessons[editingLesson.les + 1]?.title}
        onUpdate={(patch) => updateLesson(editingLesson.mod, editingLesson.les, patch)}
        onDelete={() => deleteLesson(editingLesson.mod, editingLesson.les)}
        onBack={() => setEditingLesson(null)}
      />
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {modules.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-slate-600 mb-4">{t('empty_msg')}</p>
          <button onClick={addModule} className="btn-primary">{t('add_first')}</button>
        </div>
      ) : (
        <>
          {modules.map((mod, i) => (
            <div key={mod.id || i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 flex items-center gap-3 hover:bg-slate-50 cursor-pointer" onClick={() => setOpenModule(openModule === i ? null : i)}>
                <span className="text-slate-300 text-sm font-mono w-6">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{mod.title || t('untitled')}</div>
                  <div className="text-xs text-slate-500">{t('lessons_count', { n: mod.lessons.length })}</div>
                </div>
                <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => moveModule(i, -1)} disabled={i === 0} className="w-8 h-8 rounded hover:bg-slate-100 disabled:opacity-30">↑</button>
                  <button onClick={() => moveModule(i, 1)} disabled={i === modules.length - 1} className="w-8 h-8 rounded hover:bg-slate-100 disabled:opacity-30">↓</button>
                  <button onClick={() => deleteModule(i)} className="w-8 h-8 rounded hover:bg-rose-50 text-rose-600">×</button>
                  <span className="w-8 h-8 flex items-center justify-center text-slate-400">{openModule === i ? '▾' : '▸'}</span>
                </div>
              </div>
              {openModule === i && (
                <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">{t('title_label')}</label>
                      <input className="input" value={mod.title} onChange={(e) => updateModule(i, { title: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">{t('desc_label')}</label>
                      <input className="input" value={mod.description || ''} onChange={(e) => updateModule(i, { description: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-700">{t('lessons_header')}</h4>
                      <button onClick={() => addLesson(i)} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-md hover:bg-brand-700">{t('add_lesson')}</button>
                    </div>
                    {mod.lessons.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3">{t('no_lessons')}</p>
                    ) : (
                      <ul className="space-y-2">
                        {mod.lessons.map((les, j) => (
                          <li key={les.id || j} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200">
                            <span className="text-slate-300 text-xs font-mono w-6">{i + 1}.{j + 1}</span>
                            <span className="text-lg">{les.type === 'video' ? '🎬' : les.type === 'exercise' ? '✍️' : '📖'}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-slate-900 truncate">{les.title || t('untitled')}</div>
                              <div className="text-xs text-slate-500">{les.content?.p?.length ? t('with_content', { m: les.duration_minutes || 0, n: les.content.p.length }) : t('without_content', { m: les.duration_minutes || 0 })}</div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => moveLesson(i, j, -1)} disabled={j === 0} className="w-7 h-7 rounded hover:bg-slate-100 disabled:opacity-30 text-xs">↑</button>
                              <button onClick={() => moveLesson(i, j, 1)} disabled={j === mod.lessons.length - 1} className="w-7 h-7 rounded hover:bg-slate-100 disabled:opacity-30 text-xs">↓</button>
                              <button onClick={() => setEditingLesson({ mod: i, les: j })} className="text-xs bg-slate-100 hover:bg-brand-100 hover:text-brand-700 px-3 py-1.5 rounded-md font-medium">{t('edit')}</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          <button onClick={addModule} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/30 transition-colors text-sm font-medium">{t('add_module')}</button>
        </>
      )}
    </div>
  );
}
