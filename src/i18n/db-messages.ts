/**
 * Carrega traduções da DB (nl_i18n).
 * Cache 60s via Next fetch revalidate.
 * Falha SILENCIOSAMENTE retornando {} para não bloquear renders.
 */

async function fetchLocaleFlat(lang: string): Promise<Record<string, string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('[i18n] missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return {};
  }
  try {
    const r = await fetch(`${url}/rest/v1/rpc/nl_i18n_messages_for_lang`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_lang: lang }),
      // Next.js cache: revalidate a cada 60s, tag para invalidar manualmente
      next: { revalidate: 60, tags: [`i18n-${lang}`, 'i18n-all'] },
    });
    if (!r.ok) {
      console.warn(`[i18n] DB fetch failed status=${r.status} body=${(await r.text()).slice(0, 200)}`);
      return {};
    }
    const flat = await r.json();
    if (flat && typeof flat === 'object' && !Array.isArray(flat)) {
      const keys = Object.keys(flat).length;
      if (keys < 100) console.warn(`[i18n] DB returned only ${keys} keys for lang=${lang}`);
      return flat as Record<string, string>;
    }
    return {};
  } catch (e: any) {
    console.warn(`[i18n] DB fetch threw: ${e?.message || e}`);
    return {};
  }
}

export const getDbMessages = (lang: string) => fetchLocaleFlat(lang);
