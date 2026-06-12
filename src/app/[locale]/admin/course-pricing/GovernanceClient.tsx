'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { toast } from 'sonner';
import { Loader2, ChevronDown, Gauge, Check } from 'lucide-react';

interface Course { id: string; title: string; emoji?: string | null }
interface Curation { ok: boolean; score: number; curated: boolean; total_lessons: number; lessons_with_questions: number; questions_total: number; questions_with_effort: number; coverage_pct: number; effort_pct: number }
interface Gov {
  ok: boolean; id: string; title: string; emoji?: string | null; instructor?: string | null;
  approval_status?: string | null; currency: string;
  price_cents?: number | null; proposed_price_cents?: number | null; price_status?: string | null; price_decision_note?: string | null;
  curation: Curation;
}

export function GovernanceClient() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [gov, setGov] = useState<Gov | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingGov, setLoadingGov] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_courses_min');
      if (error) throw error;
      const list = ((data as { items?: Course[] })?.items) || [];
      setCourses(list);
      if (list.length > 0) setSelectedId((p) => p || list[0].id);
    } catch { setCourses([]); }
    finally { setLoading(false); }
  }, []);

  const loadGov = useCallback(async (id: string) => {
    if (!id) return;
    setLoadingGov(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_course_governance', { p_course_id: id });
      if (error) throw error;
      const g = data as Gov;
      setGov(g);
      const base = (g?.proposed_price_cents ?? g?.price_cents ?? 0) / 100;
      setPriceInput(base ? String(base) : '');
      setNote('');
    } catch { setGov(null); }
    finally { setLoadingGov(false); }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => { if (selectedId) loadGov(selectedId); }, [selectedId, loadGov]);

  const money = (cents?: number | null, currency = 'EUR') => {
    if (cents === null || cents === undefined) return '—';
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100); }
    catch { return (cents / 100).toFixed(2) + ' ' + currency; }
  };

  const proposedCents = gov?.proposed_price_cents ?? null;
  const finalCents = Math.round((parseFloat(priceInput) || 0) * 100);
  const isOverride = proposedCents !== null && finalCents !== proposedCents;

  async function decide() {
    if (!gov) return;
    if (isOverride && !note.trim()) { toast.error('Justificação necessária para alterar o preço proposto.'); return; }
    setSaving(true);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_decide_price', { p_course_id: gov.id, p_final_price_cents: finalCents, p_note: note.trim() || null });
      if (error) throw error;
      const r = data as { ok: boolean; error?: string };
      if (!r?.ok) { toast.error(r?.error === 'note_required' ? 'Justificação necessária.' : 'Não foi possível decidir.'); return; }
      toast.success('Preço decidido');
      await loadGov(gov.id);
    } catch { toast.error('Não foi possível decidir.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (courses.length === 0) return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-500 text-sm">Sem cursos.</div>;

  const cur = gov?.curation;
  const score = cur?.ok ? cur.score : 0;
  const sc = score >= 67 ? { text: 'text-emerald-600', bar: 'bg-emerald-500' } : score >= 34 ? { text: 'text-amber-600', bar: 'bg-amber-500' } : { text: 'text-rose-600', bar: 'bg-rose-500' };

  return (
    <div>
      <div className="mb-6 max-w-md">
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Curso</label>
        <div className="relative">
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200">
            {courses.map((c) => <option key={c.id} value={c.id}>{(c.emoji ? c.emoji + ' ' : '') + c.title}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {loadingGov || !gov ? (
        <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3 text-slate-500"><Gauge className="w-4 h-4" /><span className="text-xs font-medium uppercase tracking-wide">Curadoria</span></div>
            <div className="flex items-end gap-2">
              <span className={'text-4xl font-bold ' + sc.text}>{score}</span>
              <span className="text-sm text-slate-400 mb-1">/ 100</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className={'h-full ' + sc.bar} style={{ width: Math.min(score, 100) + '%' }} />
            </div>
            {cur?.ok ? (
              <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
                <li>Cobertura de perguntas: <span className="font-medium text-slate-700">{cur.coverage_pct}%</span> ({cur.lessons_with_questions}/{cur.total_lessons} aulas)</li>
                <li>Esforço do instrutor (próprias/editadas): <span className="font-medium text-slate-700">{cur.effort_pct}%</span> ({cur.questions_with_effort}/{cur.questions_total})</li>
              </ul>
            ) : null}
            <p className="mt-3 text-[11px] text-slate-400">A curadoria informa a aprovação e a avaliação do preço.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3 text-slate-500"><span className="text-xs font-medium uppercase tracking-wide">Preço</span></div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-slate-500">Proposto pelo instrutor</span><span className="font-semibold text-slate-900">{money(gov.proposed_price_cents, gov.currency)}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Atual / final</span><span className="font-semibold text-slate-900">{money(gov.price_cents, gov.currency)}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Estado</span>
                <span className={gov.price_status === 'approved' ? 'inline-flex rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2.5 py-1' : gov.price_status === 'overridden' ? 'inline-flex rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium px-2.5 py-1' : 'inline-flex rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium px-2.5 py-1'}>{gov.price_status || 'proposto'}</span>
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <label className="block text-xs font-medium text-slate-500 mb-1">Preço final ({gov.currency})</label>
              <input type="number" min={0} step="0.01" value={priceInput} onChange={(e) => setPriceInput(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              {isOverride ? (
                <div className="mt-2">
                  <label className="block text-xs font-medium text-amber-600 mb-1">Justificação (obrigatória — difere do proposto)</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                    className="w-full rounded-lg border border-amber-200 p-2 text-sm bg-amber-50/40 focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none" />
                </div>
              ) : null}
              <button onClick={decide} disabled={saving || !priceInput || (isOverride && !note.trim())}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-sm font-medium px-4 py-2 disabled:opacity-50 hover:bg-slate-800">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isOverride ? 'Decidir (override)' : 'Aprovar preço'}
              </button>
              {gov.price_decision_note ? <p className="mt-2 text-[11px] text-slate-400">Última nota: {gov.price_decision_note}</p> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
