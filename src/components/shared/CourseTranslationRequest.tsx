'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Languages, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const LANG_NAMES: Record<string, string> = { pt: 'Português', en: 'English', es: 'Español', fr: 'Français' };

type State = {
  available?: boolean;
  demand_count?: number;
  requested_by_me?: boolean;
  job_status?: string | null;
};

/**
 * Tradução a pedido (demand-gated). Mostra-se apenas quando o curso está em fallback
 * (servido noutra língua). Regista procura passiva ao montar e permite pedido explícito.
 * Nunca dispara tradução por si: só sinaliza interesse — o agente trata quando há procura.
 */
export function CourseTranslationRequest({
  courseId,
  locale,
  sourceLangName,
}: {
  courseId: string;
  locale: string;
  sourceLangName: string;
}) {
  const t = useTranslations();
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const targetLangName = LANG_NAMES[locale] || locale.toUpperCase();

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        setAuthed(!!user);
        if (user) {
          // procura passiva (peso leve) + lê estado
          const { data } = await sb.rpc('nl_course_translation_demand_add', {
            p_course_id: courseId, p_lang: locale, p_explicit: false,
          });
          if (data) setState(data as State);
        } else {
          const { data } = await sb.rpc('nl_course_translation_state', {
            p_course_id: courseId, p_lang: locale,
          });
          if (data) setState(data as State);
        }
      } catch { /* silencioso */ }
    })();
  }, [courseId, locale]);

  async function request() {
    setLoading(true);
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setAuthed(false); toast.error(t('cdp.ctr.sign_in')); return; }
      const { data, error } = await sb.rpc('nl_course_translation_demand_add', {
        p_course_id: courseId, p_lang: locale, p_explicit: true,
      });
      if (error) throw error;
      setState(data as State);
      toast.success(t('cdp.ctr.thanks'));
    } catch (e: any) {
      toast.error(e?.message || 'erro');
    } finally { setLoading(false); }
  }

  // já disponível na língua → nada a mostrar
  if (state?.available) return null;

  const inProgress = state?.job_status === 'queued' || state?.job_status === 'running';
  const requested = !!state?.requested_by_me;

  return (
    <div
      className="mt-4 flex flex-col gap-2 rounded-xl px-3.5 py-3 text-sm"
      style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}
    >
      <span className="inline-flex items-center gap-2 font-medium">
        <Languages className="h-4 w-4 shrink-0" />
        {t('cdp.lang_fallback', { lang: sourceLangName })}
      </span>

      {inProgress ? (
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('cdp.ctr.in_progress')}
        </span>
      ) : requested ? (
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <Check className="h-3.5 w-3.5" /> {t('cdp.ctr.requested')}
        </span>
      ) : (
        <button
          onClick={request}
          disabled={loading}
          className="self-start inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:scale-105 hover:shadow-md disabled:opacity-60"
          style={{ background: 'var(--accent)' }}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
          {t('cdp.ctr.request', { lang: targetLangName })}
        </button>
      )}
    </div>
  );
}
