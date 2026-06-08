/**
 * Carrega traduções da DB (nl_i18n) via PostgREST RPC.
 * SUPABASE_URL + SUPABASE_ANON_KEY hardcoded (ambos são públicos por design — expostos no client).
 * Hardcoded porque env vars NEXT_PUBLIC_* não estão acessíveis no contexto SSR onde este ficheiro corre.
 * Cache 60s via Next fetch nativo. Tag i18n-{lang} permite revalidação on-demand.
 */

const SUPABASE_URL = 'https://obpezocujzdaznrdgwoo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icGV6b2N1anpkYXpucmRnd29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NTU4MzAsImV4cCI6MjA5MDAzMTgzMH0.SZx4ilUcyaA732zB6qInKVLuFHntzU9C_K0x7Y_dbuc';

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
    return {};
  } catch (e: any) {
    console.warn(`[i18n] DB fetch threw for lang=${lang}: ${e?.message || e}`);
    return {};
  }
}

export const getDbMessages = (lang: string) => fetchLocaleFlat(lang);
