'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Users, GraduationCap, Loader2, Check, TrendingUp } from 'lucide-react';

interface DemandItem {
  gap_id: string;
  title: string;
  description: string | null;
  level: string | null;
  topics: string[] | null;
  path: { id: string; slug: string; title: string; emoji: string | null } | null;
  preenroll_count: number;
  instructor_interest_count: number;
  i_preenrolled: boolean;
  i_expressed: boolean;
}

export function DemandClient({ initial }: { initial: DemandItem[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [items, setItems] = useState<DemandItem[]>(initial || []);
  const [busy, setBusy] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState('');

  function patch(gapId: string, p: Partial<DemandItem>) {
    setItems((xs) => xs.map((x) => (x.gap_id === gapId ? { ...x, ...p } : x)));
  }

  async function togglePreenroll(it: DemandItem) {
    setBusy(it.gap_id);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_gap_preenroll_toggle', { p_gap_id: it.gap_id });
      if (error) throw error;
      const r = data as { ok: boolean; error?: string; preenrolled?: boolean; preenroll_count?: number };
      if (!r.ok && r.error === 'unauthenticated') { router.push('/auth/login' as any); return; }
      if (!r.ok) throw new Error(r.error);
      patch(it.gap_id, { i_preenrolled: !!r.preenrolled, preenroll_count: r.preenroll_count ?? it.preenroll_count });
    } catch { toast.error(t('demand.error')); }
    finally { setBusy(null); }
  }

  async function sendInterest(it: DemandItem) {
    setBusy(it.gap_id);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_gap_instructor_express', { p_gap_id: it.gap_id, p_note: note.trim() || null });
      if (error) throw error;
      const r = data as { ok: boolean; error?: string };
      if (!r.ok && r.error === 'unauthenticated') { router.push('/auth/login' as any); return; }
      if (!r.ok) throw new Error(r.error);
      patch(it.gap_id, { i_expressed: true, instructor_interest_count: it.instructor_interest_count + 1 });
      setNoteFor(null); setNote('');
      toast.success(t('demand.instructor_done'));
    } catch { toast.error(t('demand.error')); }
    finally { setBusy(null); }
  }

  if (!items.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-900 mb-1">{t('demand.empty')}</h3>
        <p className="text-sm text-slate-500">{t('demand.empty_sub')}</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {items.map((it) => (
        <div key={it.gap_id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
          {it.path && (
            <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <span>{it.path.emoji || '🎓'}</span>
              <span>{t('demand.in_path')} <span className="font-medium text-slate-700">{it.path.title}</span></span>
            </div>
          )}
          <h3 className="font-bold text-slate-900 text-lg leading-snug">{it.title}</h3>
          {it.level && (
            <span className="mt-1 inline-flex w-fit items-center px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[11px] font-medium">
              {it.level}
            </span>
          )}
          {it.description && <p className="text-sm text-slate-600 mt-2 line-clamp-3">{it.description}</p>}
          {it.topics && it.topics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {it.topics.slice(0, 4).map((tp, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{tp}</span>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {it.preenroll_count} {t('demand.preenrolled_label')}</span>
            <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {it.instructor_interest_count} {t('demand.instructors_label')}</span>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
            <button onClick={() => togglePreenroll(it)} disabled={busy === it.gap_id}
              className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold px-4 py-2.5 transition-colors disabled:opacity-50 ${
                it.i_preenrolled ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-fuchsia-600 text-white hover:bg-fuchsia-700'}`}>
              {busy === it.gap_id ? <Loader2 className="h-4 w-4 animate-spin" /> : it.i_preenrolled ? <Check className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              {it.i_preenrolled ? t('demand.preenrolled_done') : t('demand.preenroll_cta')}
            </button>

            {it.i_expressed ? (
              <div className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-medium px-4 py-2.5 bg-slate-50 text-slate-500">
                <Check className="h-4 w-4" /> {t('demand.instructor_done')}
              </div>
            ) : noteFor === it.gap_id ? (
              <div className="space-y-2">
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder={t('demand.note_ph')}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100 resize-y" />
                <div className="flex gap-2">
                  <button onClick={() => sendInterest(it)} disabled={busy === it.gap_id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-white text-sm font-medium px-4 py-2 disabled:opacity-50 hover:bg-slate-800">
                    {busy === it.gap_id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{t('demand.send')}
                  </button>
                  <button onClick={() => { setNoteFor(null); setNote(''); }} className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100">{t('demand.cancel')}</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setNoteFor(it.gap_id); setNote(''); }}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold px-4 py-2.5 border border-slate-200 text-slate-700 hover:border-violet-300 hover:bg-violet-50 transition-colors">
                <GraduationCap className="h-4 w-4" /> {t('demand.instructor_cta')}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
