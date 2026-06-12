'use client';
// rebuild retrigger (infra wobble during prior build)

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StickyNote, Plus, Trash2, X, Highlighter, Loader2 } from 'lucide-react';
import { assertNotPeekClient } from '@/lib/peek-client';

export function LessonNotesPanel({ courseId, moduleIndex, lessonIndex, collapsed: defaultCollapsed = true }: {
  courseId: string; moduleIndex: number; lessonIndex: number; collapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [tab, setTab] = useState<'notes' | 'highlights'>('notes');
  const [notes, setNotes] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newHl, setNewHl] = useState('');
  const [hlColor, setHlColor] = useState('yellow');
  const [pending, startTransition] = useTransition();
  const sb = createClient();

  async function reload() {
    const { data: notesRpc } = await sb.rpc('nl_lesson_notes_list', { p_course_id: courseId, p_module: moduleIndex, p_lesson: lessonIndex });
    const { data: hlRpc } = await sb.rpc('nl_lesson_highlights_list', { p_course_id: courseId, p_module: moduleIndex, p_lesson: lessonIndex });
    if ((notesRpc as any)?.ok) setNotes((notesRpc as any).notes || []);
    if ((hlRpc as any)?.ok) setHighlights((hlRpc as any).highlights || []);
  }

  useEffect(() => { if (!collapsed) reload(); }, [collapsed, courseId, moduleIndex, lessonIndex]);

  function addNote() {
    const t = newNote.trim();
    if (!t) return;
    setNewNote('');
    startTransition(async () => {
      await sb.rpc('nl_lesson_note_upsert', { p_course_id: courseId, p_module: moduleIndex, p_lesson: lessonIndex, p_content: t });
      reload();
    });
  }

  function delNote(id: string) {
    startTransition(async () => { await sb.rpc('nl_lesson_note_delete', { p_id: id }); reload(); });
  }
  function delHl(id: string) {
    startTransition(async () => { await sb.rpc('nl_lesson_highlight_delete', { p_id: id }); reload(); });
  }
  function addHl() {
    const txt = newHl.trim();
    if (!txt) return;
    setNewHl('');
    startTransition(async () => {
      try { assertNotPeekClient(); } catch { return; }
      await sb.rpc('nl_lesson_highlight_create', { p_course_id: courseId, p_module: moduleIndex, p_lesson: lessonIndex, p_text: txt, p_color: hlColor });
      reload();
    });
  }

  if (collapsed) {
    return (
      <button onClick={() => setCollapsed(false)}
        className="fixed bottom-6 right-32 z-40 inline-flex items-center gap-2 px-4 py-3 bg-white text-slate-700 shadow-xl border border-slate-200 rounded-full hover:scale-105 transition-transform">
        <StickyNote className="h-5 w-5 text-amber-500" />
        <span className="font-semibold text-sm">Notas</span>
        {(notes.length + highlights.length) > 0 && <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{notes.length + highlights.length}</span>}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:right-32 z-40 w-[calc(100vw-2rem)] sm:w-80 h-[60vh] sm:h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
      <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-amber-600" />
          <h3 className="font-semibold text-sm text-amber-900">Notas & Highlights</h3>
        </div>
        <button onClick={() => setCollapsed(true)} className="p-1 hover:bg-amber-100 rounded"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex border-b border-slate-200">
        <button onClick={() => setTab('notes')}
          className={`flex-1 py-2 text-xs font-medium ${tab === 'notes' ? 'border-b-2 border-amber-500 text-amber-700' : 'text-slate-500'}`}>
          Notas ({notes.length})
        </button>
        <button onClick={() => setTab('highlights')}
          className={`flex-1 py-2 text-xs font-medium ${tab === 'highlights' ? 'border-b-2 border-amber-500 text-amber-700' : 'text-slate-500'}`}>
          Highlights ({highlights.length})
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tab === 'notes' ? (
          <>
            {notes.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Ainda sem notas nesta aula.</p>}
            {notes.map((n) => (
              <div key={n.id} className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 group relative">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.content}</p>
                <button onClick={() => delNote(n.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded">
                  <Trash2 className="h-3 w-3 text-red-500" />
                </button>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString('pt-PT')}</p>
              </div>
            ))}
          </>
        ) : (
          <>
            {highlights.length === 0 && (
              <div className="text-center py-6 px-2">
                <Highlighter className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Seleciona texto na aula para destacar.</p>
              </div>
            )}
            {highlights.map((h) => (
              <div key={h.id} className={`border rounded-lg p-2.5 group relative ${
                h.color === 'green' ? 'bg-green-50 border-green-100' :
                h.color === 'blue' ? 'bg-blue-50 border-blue-100' :
                h.color === 'pink' ? 'bg-pink-50 border-pink-100' :
                h.color === 'purple' ? 'bg-purple-50 border-purple-100' :
                'bg-yellow-50 border-yellow-100'
              }`}>
                <p className="text-sm text-slate-700 italic">"{h.highlighted_text}"</p>
                {h.note && <p className="text-xs text-slate-600 mt-1 not-italic">— {h.note}</p>}
                <button onClick={() => delHl(h.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded">
                  <Trash2 className="h-3 w-3 text-red-500" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
      {tab === 'notes' && (
        <div className="border-t border-slate-200 p-2 flex gap-1">
          <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !pending && addNote()}
            placeholder="Nova nota…"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <button onClick={addNote} disabled={pending || !newNote.trim()}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      )}
      {tab === 'highlights' && (
        <div className="border-t border-slate-200 p-2 flex gap-1 items-center">
          <input type="text" value={newHl} onChange={(e) => setNewHl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !pending && addHl()}
            placeholder="Destacar texto…"
            className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <select value={hlColor} onChange={(e) => setHlColor(e.target.value)}
            className="px-1.5 py-2 border border-slate-200 rounded-lg text-xs bg-white" aria-label="Cor">
            <option value="yellow">🟡</option>
            <option value="green">🟢</option>
            <option value="blue">🔵</option>
            <option value="pink">🩷</option>
            <option value="purple">🟣</option>
          </select>
          <button onClick={addHl} disabled={pending || !newHl.trim()}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  );
}