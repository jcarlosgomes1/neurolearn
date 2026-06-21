'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Gauge, Check, Sparkles } from 'lucide-react';

interface Curation { ok: boolean; score: number; total_lessons: number; lessons_with_questions: number; questions_total: number; questions_with_effort: number; coverage_pct: number; effort_pct: number }
interface Engagement { ok: boolean; total?: number; accepted?: number; edited?: number; authored?: number; edit_rate?: number | null }
interface Gov { ok: boolean; id: string; currency: string; price_cents?: number | null; proposed_price_cents?: number | null; price_status?: string | null; price_decision_note?: string | null; curation: Curation; engagement?: Engagement }

/** Painel de preço/governança scoped a um curso (reutiliza nl_admin_course_governance + nl_admin_decide_price). */
export function CoursePricePanel({ courseId }: { courseId: string }) {
  const t = useTranslations();
  const [gov, setGov] = useState<Gov | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceInput, setPriceInput] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const loadGov = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_course_governance', { p_course_id: courseId });
      if (error) throw error;
      const g = data as Gov;
      setGov(g);
      const base = (g?.proposed_price_cents ?? g?.price_cents ?? 0) / 100;
      setPriceInput(base ? String(base) : '');
      setNote('');
    } catch { setGov(null); }
    finally { setLoading(false); }
  }, [courseId]);
  useEffect(() => { loadGov(); }, [loadGov]);

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
    if (isOverride && !note.trim()) { toast.error(t('course_ws.price.justification_required')); return; }
    setSaving(true);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_decide_price', { p_course_id: gov.id, p_final_price_cents: finalCents, p_note: note.trim() || null });
      if (error) throw error;
      const r = data as { ok: boolean; error?: string };
      if (!r?.ok) { toast.error(t('course_ws.price.decide_error')); return; }
      toast.success(t('course_ws.price.price_decided'));
      await loadGov();
    } catch { toast.error(t('course_ws.price.decide_error')); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (!gov) return <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{t('course_ws.price.error')}</div>;

  const cur = gov.curation;
  const score = cur?.ok ? cur.score : 0;
  const sc = score >= 67 ? { text: 'text-emerald-600', bar: 'bg-emerald-500' } : score >= 34 ? { text: 'text-amber-600', bar: 'bg-amber-500' } : { text: 'text-rose-600', bar: 'bg-rose-500' };
  const eng = gov.engagement;
  const engOk = eng?.ok && (eng?.total ?? 0) > 0;
  const editRatePct = eng?.edit_rate !== null && eng?.edit_rate !== undefined ? Math.round((eng.edit_rate as number) * 100) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3 text-slate-500"><Gauge className="w-4 h-4" /><span className="text-xs font-medium uppercase tracking-wide">{t('course_ws.price.curation')}</span></div>
          <div className="flex items-end gap-2"><span className={'text-4xl font-bold ' + sc.text}>{score}</span><span className="text-sm text-slate-400 mb-1">/ 100</span></div>
          <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden"><div className={'h-full ' + sc.bar} style={{ width: Math.min(score, 100) + '%' }} /></div>
          {cur?.ok ? (
            <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
              <li>{t('course_ws.price.curation_coverage')}: <span className="font-medium text-slate-700">{cur.coverage_pct}%</span> ({cur.lessons_with_questions}/{cur.total_lessons})</li>
              <li>{t('course_ws.price.curation_effort')}: <span className="font-medium text-slate-700">{cur.effort_pct}%</span> ({cur.questions_with_effort}/{cur.questions_total})</li>
            </ul>
          ) : null}
          <p className="mt-3 text-[11px] text-slate-400">{t('course_ws.price.curation_note')}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3 text-slate-500"><span className="text-xs font-medium uppercase tracking-wide">{t('course_ws.price.price')}</span></div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span className="text-slate-500">{t('course_ws.price.proposed')}</span><span className="font-semibold text-slate-900">{money(gov.proposed_price_cents, gov.currency)}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">{t('course_ws.price.current')}</span><span className="font-semibold text-slate-900">{money(gov.price_cents, gov.currency)}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">{t('course_ws.price.status')}</span>
              <span className={gov.price_status === 'approved' ? 'inline-flex rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2.5 py-1' : gov.price_status === 'overridden' ? 'inline-flex rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium px-2.5 py-1' : 'inline-flex rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium px-2.5 py-1'}>{gov.price_status || '—'}</span>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">{t('course_ws.price.final_price')} ({gov.currency})</label>
            <input type="number" min={0} step="0.01" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200" />
            {isOverride ? (
              <div className="mt-2">
                <label className="block text-xs font-medium text-amber-600 mb-1">{t('course_ws.price.justification')}</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full rounded-lg border border-amber-200 p-2 text-sm bg-amber-50/40 focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none" />
              </div>
            ) : null}
            <button onClick={decide} disabled={saving || !priceInput || (isOverride && !note.trim())} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-sm font-medium px-4 py-2 disabled:opacity-50 hover:bg-slate-800">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isOverride ? t('course_ws.price.decide_override') : t('course_ws.price.approve')}
            </button>
            {gov.price_decision_note ? <p className="mt-2 text-[11px] text-slate-400">{t('course_ws.price.last_note')}: {gov.price_decision_note}</p> : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
        <div className="flex items-center gap-2 mb-3 text-indigo-600"><Sparkles className="w-4 h-4" /><span className="text-xs font-medium uppercase tracking-wide">{t('course_ws.price.engagement')}</span></div>
        {engOk ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/70 p-3 text-center"><div className="text-2xl font-bold text-indigo-700">{eng?.authored ?? 0}</div><div className="text-[11px] text-slate-500 mt-0.5">{t('course_ws.price.eng_authored')}</div></div>
              <div className="rounded-xl bg-white/70 p-3 text-center"><div className="text-2xl font-bold text-violet-700">{eng?.edited ?? 0}</div><div className="text-[11px] text-slate-500 mt-0.5">{t('course_ws.price.eng_edited')}</div></div>
              <div className="rounded-xl bg-white/70 p-3 text-center"><div className="text-2xl font-bold text-slate-500">{eng?.accepted ?? 0}</div><div className="text-[11px] text-slate-500 mt-0.5">{t('course_ws.price.eng_accepted')}</div></div>
            </div>
            {editRatePct !== null ? <p className="mt-3 text-xs text-indigo-900">{t('course_ws.price.eng_rate')}: <span className="font-semibold">{editRatePct}%</span></p> : null}
          </>
        ) : (
          <p className="text-sm text-indigo-900/70">{t('course_ws.price.eng_none')}</p>
        )}
        <p className="mt-3 text-[11px] text-indigo-900/60">{t('course_ws.price.eng_note')}</p>
      </div>
    </div>
  );
}
