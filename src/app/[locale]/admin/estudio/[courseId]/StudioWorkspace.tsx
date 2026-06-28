'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Layers, Library, HelpCircle, Route, FileText, Sparkles, ArrowLeft, Plus, Trash2, Save, ShieldCheck } from 'lucide-react';

type Tab = 'flashcards' | 'glossary' | 'faq' | 'timeline' | 'sources';

interface Overview { ok?: boolean; title?: string; glossary?: number; faq?: number; timeline?: number; lessons?: { m: number; l: number; title: string; cards: number }[] }
interface Flashcard { id: string; module_index: number; lesson_index: number; front: string; back: string; hint: string | null }
interface GlossaryTerm { id: string; term: string; definition: string }
interface FaqItem { id: string; question: string; answer: string }
interface TimelineStep { id: string; label: string; detail: string | null }
interface Source { id: string; title: string; kind: string; origin_url: string | null; rights_flag: string | null; lang: string | null; summary: string | null; citations: number }
interface Policy { require_attribution?: boolean; show_provenance_to_learner?: boolean; max_quote_words?: number }

const TABS: { key: Tab; icon: React.ElementType; color: string }[] = [
  { key: 'flashcards', icon: Layers, color: 'text-violet-600' },
  { key: 'glossary', icon: Library, color: 'text-emerald-600' },
  { key: 'faq', icon: HelpCircle, color: 'text-amber-600' },
  { key: 'timeline', icon: Route, color: 'text-blue-600' },
  { key: 'sources', icon: FileText, color: 'text-slate-600' },
];

export function StudioWorkspace({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const t = useTranslations();
  const [sb] = useState(() => createClient());
  const [tab, setTab] = useState<Tab>('flashcards');
  const [ov, setOv] = useState<Overview | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [newSrc, setNewSrc] = useState({ title: '', origin_url: '', summary: '', rights_flag: 'unknown' });
  const [loading, setLoading] = useState(false);

  async function rpcOk(fn: string, args: Record<string, unknown>) {
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw error;
    const r = data as { ok?: boolean; error?: string };
    if (r && r.ok === false) throw new Error(r.error || 'error');
    return r as Record<string, unknown>;
  }

  const loadOv = useCallback(async () => {
    try { const r = await sb.rpc('nl_studio_course_overview', { p_course_id: courseId }); if ((r.data as Overview)?.ok) setOv(r.data as Overview); } catch { /* */ }
  }, [sb, courseId]);

  const loadTab = useCallback(async (which: Tab) => {
    setLoading(true);
    try {
      if (which === 'glossary') { const r = await sb.rpc('nl_glossary_for_course', { p_course_id: courseId }); setGlossary(((r.data as { terms?: GlossaryTerm[] })?.terms) || []); }
      else if (which === 'faq') { const r = await sb.rpc('nl_faq_for_course', { p_course_id: courseId }); setFaq(((r.data as { faq?: FaqItem[] })?.faq) || []); }
      else if (which === 'timeline') { const r = await sb.rpc('nl_timeline_for_course', { p_course_id: courseId }); setTimeline(((r.data as { steps?: TimelineStep[] })?.steps) || []); }
      else if (which === 'sources') { const r = await sb.rpc('nl_course_sources_list', { p_course_id: courseId }); const d = r.data as { sources?: Source[]; policy?: Policy }; setSources(d?.sources || []); setPolicy(d?.policy || null); }
      else if (which === 'flashcards' && ov?.lessons) {
        const all: Flashcard[] = [];
        for (const les of ov.lessons.filter((l) => l.cards > 0)) {
          const r = await sb.rpc('nl_flashcards_for_lesson', { p_course_id: courseId, p_m: les.m, p_l: les.l });
          const items = ((r.data as { cards?: Flashcard[] })?.cards) || [];
          for (const it of items) all.push({ ...it, module_index: les.m, lesson_index: les.l });
        }
        setCards(all);
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
    finally { setLoading(false); }
  }, [sb, courseId, ov]);

  useEffect(() => { loadOv(); }, [loadOv]);
  useEffect(() => { if (ov) loadTab(tab); }, [tab, ov, loadTab]);

  async function genCourse(kind: 'glossary' | 'faq' | 'timeline') {
    setBusy(kind);
    try { const r = await rpcOk('nl_studio_generate', { p_kind: kind, p_course_id: courseId, p_m: null, p_l: null }); toast.success(t('studio.saved') + ' (' + (r.inserted as number) + ')'); await loadOv(); await loadTab(kind); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); } finally { setBusy(null); }
  }

  async function genFlashcards(onlyMissing: boolean) {
    if (!ov?.lessons) return;
    const targets = onlyMissing ? ov.lessons.filter((l) => l.cards === 0) : ov.lessons;
    if (targets.length === 0) { toast(t('studio.saved')); return; }
    setBusy('flashcards');
    let done = 0;
    for (const les of targets) {
      setProgress((++done) + '/' + targets.length);
      try { await rpcOk('nl_studio_generate', { p_kind: 'flashcards', p_course_id: courseId, p_m: les.m, p_l: les.l }); } catch { /* continua */ }
    }
    setProgress(null); setBusy(null);
    toast.success(t('studio.saved')); await loadOv(); await loadTab('flashcards');
  }

  // edição in-place
  async function saveCard(c: Flashcard) {
    try { await rpcOk('nl_flashcard_upsert', { p_id: c.id, p_course_id: courseId, p_m: c.module_index, p_l: c.lesson_index, p_front: c.front, p_back: c.back, p_hint: c.hint || '' }); toast.success(t('studio.saved')); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
  }
  async function delCard(id: string) {
    try { await rpcOk('nl_flashcard_delete', { p_id: id }); setCards((p) => p.filter((x) => x.id !== id)); toast.success(t('studio.saved')); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
  }
  async function saveGlossary() {
    try { await rpcOk('nl_glossary_set', { p_course_id: courseId, p_items: glossary.map((g) => ({ term: g.term, definition: g.definition })) }); toast.success(t('studio.saved')); await loadOv(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
  }
  async function saveFaq() {
    try { await rpcOk('nl_faq_set', { p_course_id: courseId, p_items: faq.map((f) => ({ question: f.question, answer: f.answer })) }); toast.success(t('studio.saved')); await loadOv(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
  }
  async function saveTimeline() {
    try { await rpcOk('nl_timeline_set', { p_course_id: courseId, p_steps: timeline.map((s) => ({ label: s.label, detail: s.detail || '' })) }); toast.success(t('studio.saved')); await loadOv(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
  }

  async function addSource() {
    if (!newSrc.title.trim()) { toast.error(t('studio.source_title')); return; }
    try {
      await rpcOk('nl_course_source_upsert', { p_id: null, p_course_id: courseId, p_title: newSrc.title, p_kind: 'url', p_origin_url: newSrc.origin_url || null, p_rights_flag: newSrc.rights_flag, p_lang: null, p_summary: newSrc.summary || null, p_module_index: null, p_lesson_index: null });
      setNewSrc({ title: '', origin_url: '', summary: '', rights_flag: 'unknown' });
      toast.success(t('studio.saved')); await loadTab('sources');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
  }
  async function delSource(id: string) {
    try { await rpcOk('nl_course_source_delete', { p_id: id }); setSources((p) => p.filter((x) => x.id !== id)); toast.success(t('studio.saved')); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro'); }
  }
  function rightsLabel(f: string | null): string {
    return t('studio.rights_' + (f === 'licensed' ? 'licensed' : f === 'owned' ? 'owned' : f === 'public_domain' ? 'public' : 'unknown'));
  }

  const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <a href="/pt/admin/estudio" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3"><ArrowLeft className="h-4 w-4" /> {t('studio.back_to_courses')}</a>
      <AdminPageHeader emoji="🎬" title={courseTitle} description={t('studio.hub_desc')} />

      {/* Abas */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 mb-5">
        {TABS.map((tb) => {
          const Icon = tb.icon; const active = tab === tb.key;
          const count = tb.key === 'flashcards' ? cards.length : tb.key === 'glossary' ? (ov?.glossary || 0) : tb.key === 'faq' ? (ov?.faq || 0) : (ov?.timeline || 0);
          return (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium border-b-2 transition-colors ${active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <Icon className={`h-4 w-4 ${active ? tb.color : ''}`} />{t('studio.' + tb.key)} {count > 0 && <span className="text-xs text-slate-400">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Barra de geração */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-5 flex flex-wrap gap-2 items-center">
        {tab === 'flashcards' && (<>
          <button disabled={!!busy} onClick={() => genFlashcards(true)} className="rounded-lg bg-brand-600 text-white hover:bg-brand-700 px-3 py-2 text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1.5">
            {busy === 'flashcards' ? <><Sparkles className="h-3.5 w-3.5 animate-pulse" /> {progress || t('studio.generating')}</> : <>{t('studio.generate')} (aulas em falta)</>}
          </button>
          <button disabled={!!busy} onClick={() => genFlashcards(false)} className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-50">{t('studio.regenerate')}</button>
        </>)}
        {tab !== 'flashcards' && (
          <button disabled={!!busy} onClick={() => genCourse(tab as 'glossary' | 'faq' | 'timeline')} className="rounded-lg bg-brand-600 text-white hover:bg-brand-700 px-3 py-2 text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1.5">
            {busy === tab ? <><Sparkles className="h-3.5 w-3.5 animate-pulse" /> {t('studio.generating')}</> : <><Sparkles className="h-3.5 w-3.5" /> {t('studio.generate')}</>}
          </button>
        )}
      </div>

      {loading && <div className="text-sm text-slate-400 py-8 text-center">{t('candlist.loading')}</div>}

      {/* FLASHCARDS */}
      {!loading && tab === 'flashcards' && (
        cards.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">{t('studio.empty_material')}</p> :
        <div className="space-y-3">
          {cards.map((c, i) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="grid sm:grid-cols-2 gap-2">
                <textarea value={c.front} onChange={(e) => setCards((p) => p.map((x, j) => j === i ? { ...x, front: e.target.value } : x))} placeholder={t('studio.front')} rows={2} className={inputCls} />
                <textarea value={c.back} onChange={(e) => setCards((p) => p.map((x, j) => j === i ? { ...x, back: e.target.value } : x))} placeholder={t('studio.back')} rows={2} className={inputCls} />
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => saveCard(c)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"><Save className="h-3.5 w-3.5" /> {t('studio.save')}</button>
                <button onClick={() => delCard(c.id)} className="inline-flex items-center gap-1 rounded-lg bg-rose-50 hover:bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-600"><Trash2 className="h-3.5 w-3.5" /> {t('studio.delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GLOSSARY */}
      {!loading && tab === 'glossary' && (
        <div className="space-y-3">
          {glossary.map((g, i) => (
            <div key={g.id || i} className="rounded-xl border border-slate-200 bg-white p-4 grid sm:grid-cols-[1fr_2fr_auto] gap-2 items-start">
              <input value={g.term} onChange={(e) => setGlossary((p) => p.map((x, j) => j === i ? { ...x, term: e.target.value } : x))} placeholder={t('studio.term')} className={inputCls} />
              <textarea value={g.definition} onChange={(e) => setGlossary((p) => p.map((x, j) => j === i ? { ...x, definition: e.target.value } : x))} placeholder={t('studio.definition')} rows={2} className={inputCls} />
              <button onClick={() => setGlossary((p) => p.filter((_, j) => j !== i))} className="rounded-lg bg-rose-50 hover:bg-rose-100 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => setGlossary((p) => [...p, { id: '', term: '', definition: '' }])} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"><Plus className="h-3.5 w-3.5" /> {t('studio.add')}</button>
            <button onClick={saveGlossary} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 hover:bg-brand-700 px-3 py-2 text-xs font-semibold text-white"><Save className="h-3.5 w-3.5" /> {t('studio.save')}</button>
          </div>
        </div>
      )}

      {/* FAQ */}
      {!loading && tab === 'faq' && (
        <div className="space-y-3">
          {faq.map((f, i) => (
            <div key={f.id || i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <input value={f.question} onChange={(e) => setFaq((p) => p.map((x, j) => j === i ? { ...x, question: e.target.value } : x))} placeholder={t('studio.question')} className={inputCls} />
              <textarea value={f.answer} onChange={(e) => setFaq((p) => p.map((x, j) => j === i ? { ...x, answer: e.target.value } : x))} placeholder={t('studio.answer')} rows={2} className={inputCls} />
              <button onClick={() => setFaq((p) => p.filter((_, j) => j !== i))} className="inline-flex items-center gap-1 rounded-lg bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 text-xs font-semibold text-rose-600"><Trash2 className="h-3.5 w-3.5" /> {t('studio.delete')}</button>
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => setFaq((p) => [...p, { id: '', question: '', answer: '' }])} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"><Plus className="h-3.5 w-3.5" /> {t('studio.add')}</button>
            <button onClick={saveFaq} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 hover:bg-brand-700 px-3 py-2 text-xs font-semibold text-white"><Save className="h-3.5 w-3.5" /> {t('studio.save')}</button>
          </div>
        </div>
      )}

      {/* TIMELINE */}
      {!loading && tab === 'timeline' && (
        <div className="space-y-3">
          {timeline.map((s, i) => (
            <div key={s.id || i} className="rounded-xl border border-slate-200 bg-white p-4 grid sm:grid-cols-[1fr_2fr_auto] gap-2 items-start">
              <input value={s.label} onChange={(e) => setTimeline((p) => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="—" className={inputCls} />
              <textarea value={s.detail || ''} onChange={(e) => setTimeline((p) => p.map((x, j) => j === i ? { ...x, detail: e.target.value } : x))} rows={2} className={inputCls} />
              <button onClick={() => setTimeline((p) => p.filter((_, j) => j !== i))} className="rounded-lg bg-rose-50 hover:bg-rose-100 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => setTimeline((p) => [...p, { id: '', label: '', detail: '' }])} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"><Plus className="h-3.5 w-3.5" /> {t('studio.add')}</button>
            <button onClick={saveTimeline} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 hover:bg-brand-700 px-3 py-2 text-xs font-semibold text-white"><Save className="h-3.5 w-3.5" /> {t('studio.save')}</button>
          </div>
        </div>
      )}

      {/* SOURCES */}
      {!loading && tab === 'sources' && (
        <div className="space-y-4">
          {policy?.show_provenance_to_learner && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> {t('studio.provenance')} · {t('studio.rights')} · máx. {policy?.max_quote_words || 25} {t('studio.citations_count')}
            </div>
          )}
          {/* Anexar nova fonte */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
            <input value={newSrc.title} onChange={(e) => setNewSrc({ ...newSrc, title: e.target.value })} placeholder={t('studio.source_title')} className={inputCls} />
            <input value={newSrc.origin_url} onChange={(e) => setNewSrc({ ...newSrc, origin_url: e.target.value })} placeholder={t('studio.source_url')} className={inputCls} />
            <textarea value={newSrc.summary} onChange={(e) => setNewSrc({ ...newSrc, summary: e.target.value })} placeholder={t('studio.source_summary')} rows={2} className={inputCls} />
            <div className="flex flex-wrap gap-2 items-center">
              <select value={newSrc.rights_flag} onChange={(e) => setNewSrc({ ...newSrc, rights_flag: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="unknown">{t('studio.rights_unknown')}</option>
                <option value="owned">{t('studio.rights_owned')}</option>
                <option value="licensed">{t('studio.rights_licensed')}</option>
                <option value="public_domain">{t('studio.rights_public')}</option>
              </select>
              <button onClick={addSource} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 hover:bg-brand-700 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> {t('studio.add_source')}</button>
            </div>
          </div>
          {/* Lista de fontes */}
          {sources.length === 0 ? <p className="text-sm text-slate-400 text-center py-6">{t('studio.no_sources')}</p> :
            sources.map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">{s.title}</span>
                    <span className={'text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ' + (s.rights_flag === 'licensed' || s.rights_flag === 'owned' || s.rights_flag === 'public_domain' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{rightsLabel(s.rights_flag)}</span>
                    {s.citations > 0 && <span className="text-[10px] text-slate-400">{s.citations} {t('studio.citations_count')}</span>}
                  </div>
                  {s.origin_url && <a href={s.origin_url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline break-all">{s.origin_url}</a>}
                  {s.summary && <p className="text-xs text-slate-500 mt-1">{s.summary}</p>}
                </div>
                <button onClick={() => delSource(s.id)} className="rounded-lg bg-rose-50 hover:bg-rose-100 p-2 text-rose-600 shrink-0"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
