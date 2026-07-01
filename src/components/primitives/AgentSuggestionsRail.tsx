'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Sparkles, Check, X, Loader2, ChevronDown, Route, Bot, CornerDownRight, ExternalLink } from 'lucide-react';
import { ProposalDossier } from '@/components/admin/ProposalDossier';

type Detail = {
  kind?: string; reason?: string | null;
  description?: string | null; path_title?: string | null; position?: string | null; level?: string | null; topics?: string[] | null;
  title?: string | null; slug?: string | null; count?: number | null;
  subject?: string | null; to_email?: string | null; reply?: string | null; topic?: string | null;
  job_title?: string | null; headline?: string | null; score?: string | null; matched_skills?: string[] | null; missing_skills?: string[] | null;
} | null;
type Suggestion = { id: string; action: string; surface: string; agent_id: string | null; agent_name: string; title: string; summary: string | null; created_at: string; detail?: Detail };

const KNOWN = ['blog', 'social', 'courses', 'talent', 'support'];
// Pagina onde "esta tudo escrito" para rever em contexto e decidir
const SURFACE_LINK: Record<string, string> = {
  courses: '/admin/learning-paths',
  blog: '/admin/marketing',
  social: '/admin/social',
  support: '/admin/contactos',
  talent: '/admin/jobs',
};

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
      <span className="text-slate-400 shrink-0 w-16 sm:w-20">{label}</span>
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
          {d.path_title && <Row label={t('rail.d.path')}><span className="inline-flex items-center gap-1"><Route className="w-3 h-3 text-brand-500 shrink-0" />{d.path_title}{d.position ? ` · #${d.position}` : ''}</span></Row>}
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
        {d.reply
          ? (
            <div className="rounded-lg bg-white border border-slate-200 p-2.5 max-h-52 overflow-y-auto">
              <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 mb-1"><CornerDownRight className="w-3 h-3" />{t('rail.d.reply')}</div>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{d.reply}</p>
            </div>
          )
          : <p className="text-xs text-slate-400 italic">{t('rail.d.no_reply')}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-400">
          {d.subject && <span>{t('rail.d.subject')}: <span className="text-slate-600">{d.subject}</span></span>}
          {d.to_email && <span>{t('rail.d.to')}: <span className="text-slate-600">{d.to_email}</span></span>}
        </div>
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
      {d.reason && d.kind !== 'support' && <p className="text-[11px] text-slate-400 italic pt-1.5 border-t border-slate-100">{t('rail.d.why')}: {d.reason}</p>}
    </div>
  );
}

/**
 * Primitivo AgentSuggestionsRail — "agente-primeiro".
 * Cada cartao tem link "Abrir" para a pagina onde esta tudo escrito (decidir em contexto).
 * Conceitos de curso incluem o estudo de mercado (ProposalDossier).
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
    <div className="mb-6 rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-50/70 to-brand-50/40 p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-brand-100 text-brand-600 shrink-0"><Sparkles className="w-4 h-4" /></span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-tight">{t('rail.title')}</p>
          <p className="text-xs text-slate-500 leading-tight">{t('rail.subtitle')}</p>
        </div>
        <span className="ml-auto shrink-0 text-[11px] font-medium text-brand-700 bg-white/70 rounded-full px-2 py-0.5">{items.length} {t('rail.pending')}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500 px-1 py-2">{t('rail.empty')}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((s) => {
            const isOpen = openId === s.id;
            const href = SURFACE_LINK[s.surface] || null;
            return (
              <li key={s.id} className="rounded-xl border border-slate-200/70 bg-white/90 p-3 sm:p-3.5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700 bg-brand-50 border border-brand-100 rounded px-1.5 py-0.5">
                      <Bot className="w-3 h-3 shrink-0" /><span className="capitalize truncate max-w-[140px]">{s.agent_name}</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wide font-medium text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">{surfaceLabel(s.surface)}</span>
                  </div>
                  <button onClick={() => setOpenId(isOpen ? null : s.id)} aria-expanded={isOpen} aria-label={t('rail.details')} className="shrink-0 -mt-1 -mr-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:text-brand-900 px-1.5 py-1 rounded-lg hover:bg-brand-50">
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <p className="text-[15px] font-semibold text-slate-900 leading-snug mt-1.5">{s.title}</p>
                {s.summary && !isOpen && <p className="text-xs text-slate-500 line-clamp-2 mt-1">{s.summary}</p>}

                <div className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2.5' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="rounded-lg bg-slate-50/80 border border-slate-100 p-2.5 sm:p-3 space-y-3">
                      <ProposalDetail d={s.detail || null} t={t} />
                      {isOpen && s.surface === 'courses' && <ProposalDossier approvalId={s.id} />}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {href ? (
                    <Link href={href as any} className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-brand-700">
                      <ExternalLink className="w-3.5 h-3.5" />{t('rail.open')}
                    </Link>
                  ) : <span />}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => decide(s.id, false)} disabled={busy === s.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium px-3.5 py-2 disabled:opacity-50 hover:border-slate-300">
                      <X className="w-3.5 h-3.5" />{t('rail.reject')}
                    </button>
                    <button onClick={() => decide(s.id, true)} disabled={busy === s.id} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 text-white text-xs font-medium px-3.5 py-2 disabled:opacity-50 hover:bg-slate-800">
                      {busy === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}{t('rail.approve')}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
