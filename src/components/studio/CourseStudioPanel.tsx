'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Layers, Library, HelpCircle, Route, Sparkles, ExternalLink, PencilRuler } from 'lucide-react';
import { toast } from 'sonner';

interface Lesson { m: number; l: number; title: string; cards: number }
interface Overview { ok?: boolean; title?: string; glossary?: number; faq?: number; timeline?: number; lessons?: Lesson[] }
interface Action { label: string; onClick: () => void; primary?: boolean }

function GenCard({ icon: Icon, title, sub, actions, busy, progress, generating }: { icon: React.ElementType; title: string; sub: string; actions: Action[]; busy?: boolean; progress?: string | null; generating: string }) {
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
            {busy && a.primary ? (progress || generating) : a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Painel de Estúdio de Conhecimento scoped a um curso (reutilizável: aba do workspace e hub global). */
export function CourseStudioPanel({ courseId }: { courseId: string }) {
  const t = useTranslations();
  const [ov, setOv] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  async function rpc(fn: string, args: Record<string, unknown>) {
    const sb = createClient();
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw error;
    const r = data as { ok?: boolean; error?: string };
    if (!r?.ok) throw new Error(r?.error || 'error');
    return r as Record<string, unknown>;
  }

  const loadOv = useCallback(async () => {
    setLoading(true);
    try { const r = await rpc('nl_studio_course_overview', { p_course_id: courseId }); setOv(r as Overview); }
    catch (e) { toast.error(e instanceof Error ? e.message : t('course_ws.studio.error')); setOv(null); }
    finally { setLoading(false); }
  }, [courseId]);
  useEffect(() => { loadOv(); }, [loadOv]);

  async function genCourse(kind: 'glossary' | 'faq' | 'timeline') {
    setBusy(kind);
    try { const r = await rpc('nl_studio_generate', { p_kind: kind, p_course_id: courseId, p_m: null, p_l: null }); toast.success(t('course_ws.studio.done') + ' (' + (r.inserted as number) + ')'); await loadOv(); }
    catch (e) { toast.error(e instanceof Error ? e.message : t('course_ws.studio.error')); } finally { setBusy(null); }
  }

  async function genFlashcards(onlyMissing: boolean) {
    if (!ov?.lessons) return;
    const targets = onlyMissing ? ov.lessons.filter((l) => l.cards === 0) : ov.lessons;
    if (targets.length === 0) { toast(t('course_ws.studio.all_cards')); return; }
    setBusy('flashcards');
    let done = 0;
    for (const les of targets) {
      setProgress(t('course_ws.studio.lesson') + ' ' + (++done) + '/' + targets.length);
      try { await rpc('nl_studio_generate', { p_kind: 'flashcards', p_course_id: courseId, p_m: les.m, p_l: les.l }); } catch { /* continua */ }
    }
    setProgress(null); setBusy(null);
    toast.success(t('course_ws.studio.done')); await loadOv();
  }

  if (loading) return <div className="text-sm text-slate-400 py-12 text-center">{t('course_ws.studio.loading')}</div>;
  if (!ov) return <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{t('course_ws.studio.error')}</div>;

  const withCards = ov.lessons?.filter((l) => l.cards > 0).length || 0;
  const total = ov.lessons?.length || 0;
  const generating = t('course_ws.studio.generating');

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <GenCard icon={Layers} title={t('course_ws.studio.flashcards')} sub={withCards + '/' + total + ' ' + t('course_ws.studio.u_lessons_cards')} busy={busy === 'flashcards'} progress={busy === 'flashcards' ? progress : null} generating={generating}
          actions={[
            { label: t('course_ws.studio.gen_missing'), primary: true, onClick: () => genFlashcards(true) },
            { label: t('course_ws.studio.regen_all'), onClick: () => genFlashcards(false) },
          ]} />
        <GenCard icon={Library} title={t('course_ws.studio.glossary')} sub={(ov.glossary || 0) + ' ' + t('course_ws.studio.u_terms')} busy={busy === 'glossary'} generating={generating}
          actions={[{ label: ov.glossary ? t('course_ws.studio.regen') : t('course_ws.studio.gen'), primary: true, onClick: () => genCourse('glossary') }]} />
        <GenCard icon={HelpCircle} title={t('course_ws.studio.faq')} sub={(ov.faq || 0) + ' ' + t('course_ws.studio.u_questions')} busy={busy === 'faq'} generating={generating}
          actions={[{ label: ov.faq ? t('course_ws.studio.regen') : t('course_ws.studio.gen'), primary: true, onClick: () => genCourse('faq') }]} />
        <GenCard icon={Route} title={t('course_ws.studio.timeline')} sub={(ov.timeline || 0) + ' ' + t('course_ws.studio.u_milestones')} busy={busy === 'timeline'} generating={generating}
          actions={[{ label: ov.timeline ? t('course_ws.studio.regen') : t('course_ws.studio.gen'), primary: true, onClick: () => genCourse('timeline') }]} />
      </div>
      <div className="flex flex-wrap gap-4 mt-6 text-sm">
        <Link href={'/admin/estudio/flashcards' as any} className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700"><PencilRuler className="h-4 w-4" /> {t('course_ws.studio.edit_flashcards')}</Link>
        <Link href={`/learn/curso/${courseId}/guia` as any} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700"><ExternalLink className="h-4 w-4" /> {t('course_ws.studio.view_guide')}</Link>
      </div>
    </div>
  );
}
