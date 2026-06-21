'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Sparkles, Check, X, Loader2, Info, Route } from 'lucide-react';

type Ctx = { path_title?: string | null; level?: string | null; position?: string | null; topics?: string[] | null } | null;
type Suggestion = { id: string; action: string; surface: string; agent_id: string | null; agent_name: string; title: string; summary: string | null; created_at: string; context?: Ctx };

const KNOWN = ['blog', 'social', 'courses', 'talent', 'support'];

/**
 * Primitivo AgentSuggestionsRail — "agente-primeiro".
 * Mostra propostas pendentes do agente (nl_agent_suggestions_for) com contexto de decisão
 * (percurso/nível/posição/tópicos para conceitos de curso), Aprovar/Rejeitar e link para o dossier.
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
        <ul className="space-y-2">
          {items.map((s) => {
            const ctx = s.context || null;
            const topics = Array.isArray(ctx?.topics) ? ctx!.topics! : [];
            return (
              <li key={s.id} className="flex items-start gap-3 rounded-xl border border-white bg-white/80 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wide font-semibold text-violet-600 bg-violet-50 rounded px-1.5 py-0.5">{surfaceLabel(s.surface)}</span>
                    <span className="text-xs text-slate-400 truncate">{s.agent_name}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{s.title}</p>
                  {s.summary && <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{s.summary}</p>}
                  {ctx && (ctx.path_title || ctx.level || topics.length > 0) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {ctx.path_title && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5">
                          <Route className="w-3 h-3" />{ctx.path_title}{ctx.position ? ` · #${ctx.position}` : ''}
                        </span>
                      )}
                      {ctx.level && <span className="text-[10px] font-medium text-slate-600 bg-slate-100 rounded px-1.5 py-0.5">{ctx.level}</span>}
                      {topics.slice(0, 3).map((tp) => (
                        <span key={tp} className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">{tp}</span>
                      ))}
                      {topics.length > 3 && <span className="text-[10px] text-slate-400">+{topics.length - 3}</span>}
                    </div>
                  )}
                  <Link href={`/admin/aprovacao/${s.id}` as any} className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-violet-700 hover:text-violet-900">
                    <Info className="w-3 h-3" />{t('rail.details')}
                  </Link>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  <button onClick={() => decide(s.id, true)} disabled={busy === s.id} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 disabled:opacity-50 hover:bg-slate-800">
                    {busy === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}{t('rail.approve')}
                  </button>
                  <button onClick={() => decide(s.id, false)} disabled={busy === s.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium px-2.5 py-1.5 disabled:opacity-50 hover:border-slate-300">
                    <X className="w-3.5 h-3.5" />{t('rail.reject')}
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
