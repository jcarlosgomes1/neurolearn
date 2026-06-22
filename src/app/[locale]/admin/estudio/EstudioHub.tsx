'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Layers, Library, HelpCircle, Route, Sparkles, ExternalLink, PencilRuler, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface Course { id: string; title: string }
interface Lesson { m: number; l: number; title: string; cards: number }
interface Overview { ok?: boolean; title?: string; glossary?: number; faq?: number; timeline?: number; lessons?: Lesson[] }
interface Autogen { enabled: boolean; max_per_run: number; since?: string }

interface Action { label: string; onClick: () => void; primary?: boolean }

function GenCard({ icon: Icon, title, sub, actions, busy, progress }: { icon: React.ElementType; title: string; sub: string; actions: Action[]; busy?: boolean; progress?: string | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span>
        <div>
          <h3 className="font-display text-base font-bold text-slate-900 leading-tight">{title}</h3>
          <p className="text-xs text-slate-500">{sub}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((a, i) => (
          <button key={i} disabled={busy} onClick={a.onClick}
            className={(a.primary ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200') + ' rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1.5'}>
            {busy && a.primary ? <Sparkles className="h-3.5 w-3.5 animate-pulse" /> : null}
            {busy && a.primary ? (progress || 'A gerar…') : a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EstudioHub() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [courseId, setCourseId] = useState('');
  const [ov, setOv] = useState<Overview | null>(null);
  const [loadingOv, setLoadingOv] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [autogen, setAutogen] = useState<Autogen | null>(null);
  const [savingAg, setSavingAg] = useState(false);

  async function rpc(fn: string, args: Record<string, unknown>) {
    const sb = createClient();
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw error;
    const r = data as { ok?: boolean; error?: string };
    if (!r?.ok) throw new Error(r?.error || 'error');
    return r as Record<string, unknown>;
  }

  const loadCourses = useCallback(async () => {
    try { const r = await rpc('nl_studio_courses', {}); setCourses((r.courses as Course[]) || []); }
    catch (e) { setErr(e instanceof Error ? e.message : 'error'); }
  }, []);
  useEffect(() => { loadCourses(); }, [loadCourses]);

  const loadAutogen = useCallback(async () => {
    try { const r = await rpc('nl_studio_autogen_get', {}); setAutogen({ enabled: !!r.enabled, max_per_run: (r.max_per_run as number) || 6, since: r.since as string }); }
    catch { /* silencioso */ }
  }, []);
  useEffect(() => { loadAutogen(); }, [loadAutogen]);

  const loadOv = useCallback(async (id: string) => {
    if (!id) { setOv(null); return; }
    setLoadingOv(true);
    try { const r = await rpc('nl_studio_course_overview', { p_course_id: id }); setOv(r as Overview); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); setOv(null); }
    finally { setLoadingOv(false); }
  }, []);
  useEffect(() => { loadOv(courseId); }, [courseId, loadOv]);

  async function toggleAutogen(next: boolean) {
    if (!autogen) return;
    setSavingAg(true);
    try { await rpc('nl_studio_autogen_set', { p_enabled: next, p_max: autogen.max_per_run }); setAutogen({ ...autogen, enabled: next }); toast.success(next ? 'Autogeração ativada' : 'Autogeração desativada'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); } finally { setSavingAg(false); }
  }

  async function genCourse(kind: 'glossary' | 'faq' | 'timeline') {
    setBusy(kind);
    try { const r = await rpc('nl_studio_generate', { p_kind: kind, p_course_id: courseId, p_m: null, p_l: null }); toast.success('Gerado (' + (r.inserted as number) + ')'); await loadOv(courseId); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); } finally { setBusy(null); }
  }

  async function genFlashcards(onlyMissing: boolean) {
    if (!ov?.lessons) return;
    const targets = onlyMissing ? ov.lessons.filter((l) => l.cards === 0) : ov.lessons;
    if (targets.length === 0) { toast('Todas as aulas já têm cartões'); return; }
    setBusy('flashcards');
    let done = 0;
    for (const les of targets) {
      setProgress('Aula ' + (++done) + '/' + targets.length);
      try { await rpc('nl_studio_generate', { p_kind: 'flashcards', p_course_id: courseId, p_m: les.m, p_l: les.l }); } catch { /* continua */ }
    }
    setProgress(null); setBusy(null);
    toast.success('Flashcards gerados'); await loadOv(courseId);
  }

  const lessonsWithCards = ov?.lessons?.filter((l) => l.cards > 0).length || 0;
  const totalLessons = ov?.lessons?.length || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader eyebrow="Estúdio de conhecimento" title="Gerar auxiliares de estudo" description="Escolhe um curso e gera flashcards, glossário, FAQ e percurso. A geração é ao vivo e cada gerador está registado como tarefa do agente de formação." icon={Sparkles} />

      {err && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{err === 'forbidden' ? 'Sem acesso. Esta área é exclusiva de administradores.' : 'Não foi possível carregar.'}</div>}

      {autogen && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2"><Wand2 className="h-4 w-4 text-brand-500" /> Autogeração para cursos novos</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-prose">Quando um curso novo é publicado com aulas, os auxiliares são gerados automaticamente em segundo plano ({autogen.max_per_run} por ciclo). Não afeta cursos já existentes.</p>
          </div>
          <button onClick={() => toggleAutogen(!autogen.enabled)} disabled={savingAg} role="switch" aria-checked={autogen.enabled}
            className={(autogen.enabled ? 'bg-brand-600' : 'bg-slate-300') + ' relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50'}>
            <span className={(autogen.enabled ? 'translate-x-6' : 'translate-x-1') + ' inline-block h-4 w-4 rounded-full bg-white transition-transform'} />
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Curso</label>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white">
          <option value="">— Escolher curso —</option>
          {(courses || []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {loadingOv && <div className="text-sm text-slate-400 py-8 text-center">A carregar…</div>}

      {ov && courseId && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <GenCard icon={Layers} title="Flashcards" sub={lessonsWithCards + '/' + totalLessons + ' aulas com cartões'} busy={busy === 'flashcards'} progress={busy === 'flashcards' ? progress : null}
              actions={[
                { label: 'Gerar nas aulas em falta', primary: true, onClick: () => genFlashcards(true) },
                { label: 'Regerar todas', onClick: () => genFlashcards(false) },
              ]} />
            <GenCard icon={Library} title="Glossário" sub={(ov.glossary || 0) + ' termos'} busy={busy === 'glossary'}
              actions={[{ label: ov.glossary ? 'Regerar' : 'Gerar', primary: true, onClick: () => genCourse('glossary') }]} />
            <GenCard icon={HelpCircle} title="FAQ" sub={(ov.faq || 0) + ' perguntas'} busy={busy === 'faq'}
              actions={[{ label: ov.faq ? 'Regerar' : 'Gerar', primary: true, onClick: () => genCourse('faq') }]} />
            <GenCard icon={Route} title="Percurso" sub={(ov.timeline || 0) + ' marcos'} busy={busy === 'timeline'}
              actions={[{ label: ov.timeline ? 'Regerar' : 'Gerar', primary: true, onClick: () => genCourse('timeline') }]} />
          </div>

          <div className="flex flex-wrap gap-4 mt-6 text-sm">
            <a href="/pt/admin/estudio/flashcards" className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700"><PencilRuler className="h-4 w-4" /> Editar flashcards</a>
            <a href={'/pt/learn/curso/' + courseId + '/guia'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700"><ExternalLink className="h-4 w-4" /> Ver guia de estudo</a>
          </div>
        </>
      )}
    </div>
  );
}
