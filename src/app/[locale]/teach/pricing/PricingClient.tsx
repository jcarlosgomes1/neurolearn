'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, ChevronDown, Sparkles, Check } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

interface Item {
  id: string; title: string; emoji?: string | null; currency: string;
  proposed_price_cents?: number | null; price_cents?: number | null; price_status?: string | null; price_decision_note?: string | null;
}

export function PricingClient() {
  const t = useTranslations();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [priceInput, setPriceInput] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_instructor_pricing_overview');
      if (error) throw error;
      const list = ((data as { items?: Item[] })?.items) || [];
      setItems(list);
      setSelectedId((p) => p || (list[0]?.id ?? ''));
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selected = items.find((i) => i.id === selectedId) || null;

  useEffect(() => {
    if (selected) {
      const base = (selected.proposed_price_cents ?? selected.price_cents ?? 0) / 100;
      setPriceInput(base ? String(base) : '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const money = (cents?: number | null, currency = 'EUR') => {
    if (cents === null || cents === undefined) return '—';
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100); }
    catch { return (cents / 100).toFixed(2) + ' ' + currency; }
  };

  async function propose() {
    if (!selected) return;
    const cents = Math.round((parseFloat(priceInput) || 0) * 100);
    if (cents <= 0) return;
    setSaving(true);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_instructor_propose_price', { p_course_id: selected.id, p_price_cents: cents });
      if (error) throw error;
      if (!((data as { ok: boolean })?.ok)) throw new Error('rpc');
      toast.success(t('teach.pricing.proposed_toast'));
      await load();
    } catch { toast.error(t('teach.pricing.error')); }
    finally { setSaving(false); }
  }

  const stLabel = (s?: string | null) => s === 'approved' ? t('teach.pricing.st_approved') : s === 'overridden' ? t('teach.pricing.st_overridden') : t('teach.pricing.st_proposed');
  const stClass = (s?: string | null) => s === 'approved' ? 'bg-emerald-50 text-emerald-700' : s === 'overridden' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600';

  if (loading) return <div className="py-8"><div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div></div>;

  return (
    <div className="py-8">
      <div className="mb-6">
        <AppPageHeader  title={t('teach.pricing.title')} description={t('teach.pricing.description')} />
      </div>

      <div className="mb-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-900 leading-relaxed">{t('teach.pricing.motivational')}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-500 text-sm">{t('teach.pricing.no_courses')}</div>
      ) : (
        <>
          <div className="mb-6 max-w-md">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">{t('teach.pricing.course')}</label>
            <div className="relative">
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                {items.map((c) => <option key={c.id} value={c.id}>{(c.emoji ? c.emoji + ' ' : '') + c.title}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {selected ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center justify-between"><span className="text-slate-500">{t('teach.pricing.current')}</span><span className="font-semibold text-slate-900">{money(selected.price_cents, selected.currency)}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">{t('teach.pricing.status')}</span>
                  <span className={'inline-flex rounded-full text-[11px] font-medium px-2.5 py-1 ' + stClass(selected.price_status)}>{stLabel(selected.price_status)}</span>
                </div>
                {selected.price_decision_note ? (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">
                    <span className="font-medium">{t('teach.pricing.platform_note')}:</span> {selected.price_decision_note}
                  </div>
                ) : null}
              </div>
              <div className="border-t border-slate-100 pt-4">
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('teach.pricing.your_price')} ({selected.currency})</label>
                <input type="number" min={0} step="0.01" value={priceInput} onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full max-w-xs rounded-lg border border-slate-200 p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                <div>
                  <button onClick={propose} disabled={saving || !priceInput}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-sm font-medium px-4 py-2 disabled:opacity-50 hover:bg-slate-800">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {saving ? t('teach.pricing.proposing') : t('teach.pricing.propose')}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
