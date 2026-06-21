'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Loader2, TrendingUp, Layers, Tag, ArrowUpRight } from 'lucide-react';

type Similar = { id: string; title: string; level: string | null; price_cents: number | null; currency: string | null; enrollments: number | null; published: boolean | null };
type Dossier = { ok: boolean; applicable?: boolean; similar?: Similar[]; similar_count?: number; demand_enrollments?: number; catalog_published?: number; suggested_price_cents?: number; currency?: string };

/** Dossier de decisão para conceitos de curso: semelhantes (anti-duplicação), procura e preço sugerido, derivados do catálogo. */
export function ProposalDossier({ approvalId }: { approvalId: string }) {
  const t = useTranslations();
  const [d, setD] = useState<Dossier | null>(null);

  useEffect(() => {
    (async () => {
      try { const sb = createClient(); const { data } = await sb.rpc('nl_admin_proposal_dossier', { p_approval_id: approvalId }); setD(data as Dossier); } catch { setD({ ok: false }); }
    })();
  }, [approvalId]);

  if (d === null) return <div className="flex items-center gap-2 text-xs text-slate-400 py-3"><Loader2 className="w-4 h-4 animate-spin" />{t('dossier.loading')}</div>;
  if (!d.ok || d.applicable === false) return null;

  const fmtPrice = (c: number | null | undefined, cur?: string | null) => c ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: cur || 'EUR', maximumFractionDigits: 0 }).format(c / 100) : '—';
  const similar = d.similar || [];

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 space-y-3">
      <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-violet-600" /><h3 className="text-sm font-semibold text-slate-900">{t('dossier.title')}</h3></div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg p-2.5"><Layers className="w-4 h-4 text-slate-400 mb-1" /><div className="text-lg font-bold text-slate-900">{d.similar_count ?? 0}</div><div className="text-[11px] text-slate-500">{t('dossier.similar')}</div></div>
        <div className="bg-white rounded-lg p-2.5"><TrendingUp className="w-4 h-4 text-slate-400 mb-1" /><div className="text-lg font-bold text-slate-900">{d.demand_enrollments ?? 0}</div><div className="text-[11px] text-slate-500">{t('dossier.demand')}</div></div>
        <div className="bg-white rounded-lg p-2.5"><Tag className="w-4 h-4 text-slate-400 mb-1" /><div className="text-lg font-bold text-slate-900">{fmtPrice(d.suggested_price_cents, d.currency)}</div><div className="text-[11px] text-slate-500">{t('dossier.price')}</div></div>
      </div>
      {similar.length > 0 ? (
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-500 mb-1.5">{t('dossier.similar_list')}</div>
          <div className="space-y-1">
            {similar.map((c) => (
              <Link key={c.id} href={`/admin/curso/${c.id}/editar` as any} className="flex items-center justify-between gap-2 bg-white rounded-lg px-2.5 py-1.5 hover:bg-slate-50">
                <span className="text-xs text-slate-800 truncate">{c.title}{c.published === false ? ' ·' : ''}{c.published === false ? <span className="text-[10px] text-amber-600"> rascunho</span> : ''}</span>
                <span className="text-[11px] text-slate-400 flex items-center gap-2 shrink-0">{c.enrollments ?? 0} · {fmtPrice(c.price_cents, c.currency)}<ArrowUpRight className="w-3 h-3" /></span>
              </Link>
            ))}
          </div>
        </div>
      ) : <p className="text-xs text-slate-600">{t('dossier.no_similar')}</p>}
      <p className="text-[11px] text-slate-400">{t('dossier.basis')}</p>
    </div>
  );
}
