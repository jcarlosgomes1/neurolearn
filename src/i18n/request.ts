import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { routing } from './routing';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';
import { FALLBACK_MESSAGES } from './fallback';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  let messages: AbstractIntlMessages = FALLBACK_MESSAGES;

  try {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 4000);

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/app-bootstrap?lang=${locale}`,
      {
        signal: ctrl.signal,
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        next: { revalidate: 300, tags: [`bootstrap:${locale}`] },
      }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data?.i18n && typeof data.i18n === 'object' && Object.keys(data.i18n).length > 0) {
        // Merge: backend overrides fallback
        const merged = flattenToNamespaced(data.i18n);
        messages = deepMerge(FALLBACK_MESSAGES, merged);
      }
    } else {
      console.warn(`[i18n] bootstrap returned ${res.status} for ${locale}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[i18n] bootstrap fetch failed for ${locale}: ${msg} — using fallback`);
  }

  return { locale, messages };
});

function flattenToNamespaced(flat: Record<string, string>): AbstractIntlMessages {
  const result: any = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let cur = result;
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }
  return result as AbstractIntlMessages;
}

function deepMerge(base: any, override: any): any {
  if (typeof override !== 'object' || override === null) return override;
  const out: any = { ...base };
  for (const k of Object.keys(override)) {
    if (typeof override[k] === 'object' && override[k] !== null && !Array.isArray(override[k]) && typeof out[k] === 'object' && out[k] !== null) {
      out[k] = deepMerge(out[k], override[k]);
    } else {
      out[k] = override[k];
    }
  }
  return out;
}
