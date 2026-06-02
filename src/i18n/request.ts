import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { routing } from './routing';
import { FALLBACK_MESSAGES } from './fallback';
import pt from './messages/pt.json';
import en from './messages/en.json';
import es from './messages/es.json';
import fr from './messages/fr.json';

// Static imports — bundled at build time. No runtime fetch, no network dependency.
// To update: re-run the build pipeline that regenerates these JSON files.
const FLAT_MESSAGES: Record<string, Record<string, string>> = {
  pt: pt as Record<string, string>,
  en: en as Record<string, string>,
  es: es as Record<string, string>,
  fr: fr as Record<string, string>,
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const flat = FLAT_MESSAGES[locale] || FLAT_MESSAGES.pt;
  const nested = flattenToNamespaced(flat);
  const messages: AbstractIntlMessages = deepMerge(FALLBACK_MESSAGES, nested);

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
