/**
 * Carrega traduções da DB (nl_i18n) com cache de 60s.
 * Source-of-truth editável via /admin/i18n CRUD.
 */
import { unstable_cache } from 'next/cache';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function fetchLocaleFlat(lang: string): Promise<Record<string, string>> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return {};
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/nl_i18n_messages_for_lang`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_lang: lang }),
      // Next.js cache hint
      next: { revalidate: 60, tags: [`i18n-${lang}`] },
    });
    if (!r.ok) return {};
    const flat = await r.json();
    return (flat && typeof flat === 'object') ? flat as Record<string, string> : {};
  } catch {
    return {};
  }
}

// 60s in-memory cache layer
export const getDbMessages = unstable_cache(
  async (lang: string) => fetchLocaleFlat(lang),
  ['i18n-db'],
  { revalidate: 60, tags: ['i18n-db'] }
);
