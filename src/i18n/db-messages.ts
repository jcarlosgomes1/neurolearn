/**
 * Carrega traduções da DB (nl_i18n).
 * Usa SUPABASE_URL hardcoded + anon key (ambos são públicos por design — expostos no client).
 * Necessário hardcoded porque env vars NEXT_PUBLIC_* não estão acessíveis em SSR run-time
 * neste contexto do request.ts (validado em produção via runtime logs).
 */

const SUPABASE_URL = 'https://obpezocujzdaznrdgwoo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icGV6b2N1anpkYXpucmRnd29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Nzc3MjAsImV4cCI6MjA3NTE1MzcyMH0.LWp3xUuJjMpQOFTYRiBALOXMnXm-1ITWLqXVlIY7yIA';

async function fetchLocaleFlat(lang: string): Promise<Record<string, string>> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/nl_i18n_messages_for_lang`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_lang: lang }),
      // Cache 60s nativo do Next; tag para invalidar via revalidateTag
      next: { revalidate: 60, tags: [`i18n-${lang}`, 'i18n-all'] },
    });
    if (!r.ok) {
      console.warn(`[i18n] DB fetch failed status=${r.status} body=${(await r.text()).slice(0, 200)}`);
      return {};
    }
    const flat = await r.json();
    if (flat && typeof flat === 'object' && !Array.isArray(flat)) {
      return flat as Record<string, string>;
    }
    console.warn(`[i18n] DB returned non-object for lang=${lang}: ${JSON.stringify(flat).slice(0, 100)}`);
    return {};
  } catch (e: any) {
    console.warn(`[i18n] DB fetch threw for lang=${lang}: ${e?.message || e}`);
    return {};
  }
}

export const getDbMessages = (lang: string) => fetchLocaleFlat(lang);
