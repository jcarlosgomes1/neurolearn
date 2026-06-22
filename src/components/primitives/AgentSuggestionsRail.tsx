'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Sparkles, Check, X, Loader2, ChevronDown, Route, Bot } from 'lucide-react';

type Detail = {
  kind?: string; reason?: string | null;
  description?: string | null; path_title?: string | null; position?: string | null; level?: string | null; topics?: string[] | null;
  title?: string | null; slug?: string | null; count?: number | null;
  subject?: string | null; to_email?: string | null; topic?: string | null;
  job_title?: string | null; headline?: string | null; score?: string | null; matched_skills?: string[] | null; missing_skills?: string[] | null;
} | null;
type Suggestion = { id: string; action: string; surface: string; agent_id: string | null; agent_name: string; title: string; summary: string | null; created_at: string; detail?: Detail };

const KNOWN = ['blog', 'social', 'courses', 'talent', 'support'];

function Pills({ items, tone = 'slate' }: { items: string[]; tone?: 'slate' | 'emerald' | 'rose' }) {
  const cls = tone === 'emerald' ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
    : tone === 'rose' ? 'text-rose-700 bg-rose-50 border-rose-100'
    : 'text-slate-600 bg-white border-slate-200';
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((it) => (
        <span key={it} className={`max-w-[230px] truncate text-[10px] font-medium border rounded-md px-2 py-1 whitespace-nowrap ${cls}`}>{it}</span>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-slate-400 shrink-0 w-20">{label}</span>
      <span className="text-slate-700 min-w-0 flex-1">{children}</span>
    </div>
  );
}

function ProposalDetail({ d, t }: { d: Detail; t: ReturnType<typeof useTranslations> }) {
  if (!d) return null;
  const topics = Array.isArray(d.topics) ? d.topics : [];
  const matched = Array.isArray(d.matched_skills) ? d.matched_skills : [];
  const missing = Array.isArray(d.missing_skills) ? d.missing_skills : [];
  return (
    <div className="space-y-2.5">
      {d.kind === 'course' && (
        <>
          {d.description && <p className="text-xs text-slate-600 leading-relaxed">{d.description}</p>}
          {d.path_title && <Row label={t('rail.d.path')}><span className="inline-flex items-center gap-1"><Route className="w-3 h-3 text-indigo-500 shrink-0" />{d.path_title}{d.position ? ` · #${d.position}` : ''}</span></Row>}
          {d.level && <Row label={t('rail.d.level')}>{d.level}</Row>}
          {topics.length > 0 && <Row label={t('rail.d.topics')}><Pills items={topics} /></Row>}
        </>
      )}
      {d.kind === 'blog' && (<>
        {d.title && <Row label={t('rail.d.subject')}>{d.title}</Row>}
        {d.slug && <Row label={t('rail.d.slug')}><span className="font-mono text-[11px] text-slate-500">/{d.slug}</span></Row>}
      </>)}
      {d.kind === 'social' && <Row label={t('rail.d.posts')}>{d.count ?? 0}</Row>}
      {d.kind === 'support' && (<>
        {d.subject && <Row label={t('rail.d.subject')}>{d.subject}</Row>}
        {d.to_email && <Row label={t('rail.d.to')}>{d.to_email}</Row>}
      </>)}
      {d.kind === 'triage' && (<>
        {d.subject && <Row label={t('rail.d.subject')}>{d.subject}</Row>}
        {d.topic && <Row label={t('rail.d.topic')}>{d.topic}</Row>}
      </>)}
      {d.kind === 'match' && (<>
        {d.job_title && <Row label={t('rail.d.job')}>{d.job_title}</Row>}
        {d.headline && <Row label={t('rail.d.subject')}>{d.headline}</Row>}
        {d.score && <Row label={t('rail.d.score')}>{d.score}</Row>}
        {matched.length > 0 && <Row label={t('rail.d.skills_match')}><Pills items={matched} tone="emerald" /></Row>}
        {missing.length > 0 && <Row label={t('rail.d.skills_gap')}><Pills items={missing} tone="rose" /></Row>}
      </>)}
      {d.reason && <p className="text-[11px] text-slate-400 italic pt-1.5 border-t border-slate-100">{t('rail.d.why')}: {d.reason}</p>}
    </div>
  );
}

/**
 * Primitivo AgentSuggestionsRail — "agente-primeiro".
 * O chevron de detalhe vive no TOPO do cartao (longe das acoes, sem risco de toque errado).
 * O detalhe abre em linha com animacao; conteudo legivel por tipo (sem JSON).
 */
export function AgentSuggestionsRail({ surface = 'all', limit = 8, showWhenEmpty = false, onAfterDecide }: {
  surface?: string;
  limit?: number;
  showWhenEmpty?: boolean;
  onAfterDecide?: () => void;
}) {
  const t = useTranslations();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_agent_suggestions_for', { p_surface: surface, p_limit: limit });
      if (error) throw error;
      setItems((((data as { items?: Suggestion[] })?.items) || []) as Suggestion[]);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [surface, limit]);

  useEffect(() => { load(); }, [load]);

  async function decide(id: string, approve: boolean) {
    setBusy(id);
    try {
      assertNotPeekClient();
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_agent_approval_decide_v2', { p_id: id, p_approve: approve, p_note: null, p_followup: null });
      if (error) throw error;
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast.success(approve ? t('rail.approved_toast') : t('rail.rejected_toast'));
      onAfterDecide?.();
    } catch { toast.error(t('rail.error')); }
    finally { setBusy(null); }
  }

  if (loading) return null;
  if (items.length === 0 && !showWhenEmpty) return null;

  const surfaceLabel = (s: string) => t(`rail.surface.${KNOWN.includes(s) ? s : 'other'}` as never);

  return (
    <div className="mb-6 rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/70 to-indigo-50/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100 text-violet-600 shrink-0"><Sparkles className="w-4 h-4" /></span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-tight">{t('rail.title')}</p>
          <p className="text-xs text-slate-500 leading-tight">{t('rail.subtitle')}</p>
        </div>
        <span className="ml-auto shrink-0 text-[11px] font-medium text-violet-700 bg-white/70 rounded-full px-2 py-0.5">{items.length} {t('rail.pending')}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500 px-1 py-2">{t('rail.empty')}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((s) => {
            const isOpen = openId === s.id;
            return (
              <li key={s.id} className="rounded-xl border border-slate-200/70 bg-white/90 p-3.5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wide font-semibold text-violet-600 bg-violet-50 rounded px-1.5 py-0.5">{surfaceLabel(s.surface)}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                      <Bot className="w-3 h-3 text-slate-400" /><span className="capitalize truncate max-w-[120px]">{s.agent_name}</span>
                    </span>
                  </div>
                  <button onClick={() => setOpenId(isOpen ? null : s.id)} aria-expanded={isOpen} aria-label={t('rail.details')} className="shrink-0 -mt-1 -mr-1 inline-flex items-center gap-1 text-[11px] font-medium text-violet-700 hover:text-violet-900 px-1.5 py-1 rounded-lg hover:bg-violet-50">
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <p className="text-[15px] font-semibold text-slate-900 leading-snug mt-1.5">{s.title}</p>
                {s.summary && !isOpen && <p className="text-xs text-slate-500 line-clamp-2 mt-1">{s.summary}</p>}

                <div className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2.5' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="rounded-lg bg-slate-50/80 border border-slate-100 p-3">
                      <ProposalDetail d={s.detail || null} t={t} />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button onClick={() => decide(s.id, false)} disabled={busy === s.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium px-3.5 py-2 disabled:opacity-50 hover:border-slate-300">
                    <X className="w-3.5 h-3.5" />{t('rail.reject')}
                  </button>
                  <button onClick={() => decide(s.id, true)} disabled={busy === s.id} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 text-white text-xs font-medium px-3.5 py-2 disabled:opacity-50 hover:bg-slate-800">
                    {busy === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}{t('rail.approve')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
