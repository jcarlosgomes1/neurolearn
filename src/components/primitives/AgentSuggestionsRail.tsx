'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';

type Suggestion = { id: string; action: string; surface: string; agent_id: string | null; agent_name: string; title: string; summary: string | null; created_at: string };

const KNOWN = ['blog', 'social', 'courses', 'talent', 'support'];

/**
 * Primitivo AgentSuggestionsRail — "agente-primeiro".
 * Mostra propostas pendentes do agente (nl_agent_suggestions_for) no topo de uma lista,
 * com Aprovar/Rejeitar (nl_admin_agent_approval_decide_v2). Some-se quando vazio (salvo showWhenEmpty).
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
          {items.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-xl border border-white bg-white/80 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide font-semibold text-violet-600 bg-violet-50 rounded px-1.5 py-0.5">{surfaceLabel(s.surface)}</span>
                  <span className="text-xs text-slate-400 truncate">{s.agent_name}</span>
                </div>
                <p className="text-sm font-medium text-slate-800 truncate mt-0.5">{s.title}</p>
                {s.summary && <p className="text-xs text-slate-500 truncate">{s.summary}</p>}
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
          ))}
        </ul>
      )}
    </div>
  );
}
