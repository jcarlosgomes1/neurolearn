'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Save, X, ChevronDown } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

interface Lesson { id?: string; title?: string }
interface Module { id?: string; title?: string; lessons?: Lesson[] }
interface Course { id: string; title: string; emoji?: string | null; modules?: Module[] }
interface Question {
  id: string; module_index: number; lesson_index: number; position: number;
  prompt_md: string; guidance_md: string | null; max_score: number; source: string; status: string;
}
interface EditorState {
  moduleIndex: number; lessonIndex: number; id: string | null;
  prompt: string; guidance: string; maxScore: number;
}

export function QuizzesClient() {
  const t = useTranslations();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQ, setLoadingQ] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_instructor_courses_min');
      if (error) throw error;
      const list = (data as Course[]) || [];
      setCourses(list);
      if (list.length > 0) setSelectedId((prev) => prev || list[0].id);
    } catch { setCourses([]); }
    finally { setLoading(false); }
  }, []);

  const loadQuestions = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setLoadingQ(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_instructor_lesson_quizzes_list', { p_course_id: courseId });
      if (error) throw error;
      const res = data as { ok: boolean; items?: Question[] };
      setQuestions(res?.items || []);
    } catch { setQuestions([]); }
    finally { setLoadingQ(false); }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => { if (selectedId) loadQuestions(selectedId); }, [selectedId, loadQuestions]);

  const course = courses.find((c) => c.id === selectedId) || null;

  function openAdd(mi: number, li: number) {
    setEditor({ moduleIndex: mi, lessonIndex: li, id: null, prompt: '', guidance: '', maxScore: 100 });
  }
  function openEdit(q: Question) {
    setEditor({ moduleIndex: q.module_index, lessonIndex: q.lesson_index, id: q.id, prompt: q.prompt_md, guidance: q.guidance_md || '', maxScore: Number(q.max_score) || 100 });
  }

  async function save() {
    if (!editor || !editor.prompt.trim() || !selectedId) return;
    setSaving(true);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_instructor_lesson_quiz_upsert', {
        p_id: editor.id, p_course_id: selectedId,
        p_module_index: editor.moduleIndex, p_lesson_index: editor.lessonIndex,
        p_prompt_md: editor.prompt.trim(), p_guidance_md: editor.guidance.trim() || null,
        p_max_score: editor.maxScore || 100,
      });
      if (error) throw error;
      const res = data as { ok: boolean };
      if (!res?.ok) throw new Error('rpc');
      toast.success(t('teach.qb.saved'));
      setEditor(null);
      await loadQuestions(selectedId);
    } catch { toast.error(t('teach.qb.error')); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm(t('teach.qb.confirm_delete'))) return;
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { error } = await sb.rpc('nl_instructor_lesson_quiz_delete', { p_id: id });
      if (error) throw error;
      toast.success(t('teach.qb.deleted'));
      await loadQuestions(selectedId);
    } catch { toast.error(t('teach.qb.error')); }
  }

  const qFor = (mi: number, li: number) => questions.filter((q) => q.module_index === mi && q.lesson_index === li);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AppPageHeader eyebrow={t('teach.qb.eyebrow')} title={t('teach.qb.title')} description={t('teach.qb.description')} />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-500 text-sm">{t('teach.qb.empty_courses')}</div>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">{t('teach.qb.course')}</label>
            <div className="relative">
              <select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setEditor(null); }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-200">
                {courses.map((c) => <option key={c.id} value={c.id}>{(c.emoji ? c.emoji + ' ' : '') + c.title}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {loadingQ ? (
            <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : (
            <div className="space-y-6">
              {(course?.modules || []).map((m, mi) => (
                <div key={m.id || mi}>
                  <h2 className="text-sm font-semibold text-slate-800 mb-2">{m.title || (t('teach.qb.module') + ' ' + (mi + 1))}</h2>
                  <div className="space-y-2">
                    {(m.lessons || []).map((ls, li) => {
                      const qs = qFor(mi, li);
                      const editing = editor && editor.moduleIndex === mi && editor.lessonIndex === li;
                      return (
                        <div key={ls.id || li} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-700 min-w-0 truncate">{ls.title || String(li + 1)}</p>
                            {!editing && (
                              <button onClick={() => openAdd(mi, li)} className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 px-2.5 py-1.5 hover:bg-slate-50">
                                <Plus className="w-3.5 h-3.5 text-violet-500" />{t('teach.qb.add')}
                              </button>
                            )}
                          </div>

                          {qs.length > 0 && (
                            <ul className="mt-3 space-y-2">
                              {qs.map((q) => (
                                <li key={q.id} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap min-w-0">{q.prompt_md}</p>
                                    <div className="shrink-0 flex items-center gap-1">
                                      <button onClick={() => openEdit(q)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"><Pencil className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => remove(q.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}

                          {editing && (
                            <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3 space-y-2">
                              <textarea value={editor.prompt} onChange={(e) => setEditor({ ...editor, prompt: e.target.value })} rows={3}
                                placeholder={t('teach.qb.prompt_ph')} className="w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none" />
                              <textarea value={editor.guidance} onChange={(e) => setEditor({ ...editor, guidance: e.target.value })} rows={2}
                                placeholder={t('teach.qb.guidance_ph')} className="w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none" />
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-slate-500">{t('teach.qb.max_score')}</label>
                                <input type="number" min={1} value={editor.maxScore} onChange={(e) => setEditor({ ...editor, maxScore: parseInt(e.target.value, 10) || 0 })}
                                  className="w-20 rounded-lg border border-slate-200 p-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-200" />
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <button onClick={save} disabled={saving || !editor.prompt.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium px-3.5 py-1.5 disabled:opacity-50 hover:bg-slate-800">
                                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saving ? t('teach.qb.saving') : t('teach.qb.save')}
                                </button>
                                <button onClick={() => setEditor(null)} className="inline-flex items-center gap-1 text-sm text-slate-500 px-2 py-1.5 hover:text-slate-700"><X className="w-4 h-4" />{t('teach.qb.cancel')}</button>
                              </div>
                            </div>
                          )}

                          {qs.length === 0 && !editing && (
                            <p className="mt-2 text-xs text-slate-400">{t('teach.qb.no_questions')}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
