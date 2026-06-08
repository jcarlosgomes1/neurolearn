import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { routing } from './routing';
import { FALLBACK_MESSAGES } from './fallback';
import { ADMIN_MESSAGES } from './admin-messages';
import pt from './messages/pt.json';
import en from './messages/en.json';
import es from './messages/es.json';
import fr from './messages/fr.json';

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
  // Ordem: fallback → file messages → admin messages (admin tem prioridade máxima)
  const merged = deepMerge(deepMerge(FALLBACK_MESSAGES, nested), ADMIN_MESSAGES[locale] || ADMIN_MESSAGES.pt);

  return { locale, messages: merged };
});

function flattenToNamespaced(flat: Record<string, string>): AbstractIntlMessages {
  const result: any = {};
  // Sort by depth DESC so deeper paths establish nested structure FIRST.
  const sortedKeys = Object.keys(flat).sort(
    (a, b) => b.split('.').length - a.split('.').length
  );

  for (const key of sortedKeys) {
    const value = flat[key];
    const parts = key.split('.');
    let cur = result;
    let blocked = false;

    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i];
      if (typeof cur[seg] === 'string') {
        blocked = true;
        break;
      }
      if (!cur[seg]) cur[seg] = {};
      cur = cur[seg];
    }
    if (blocked) continue;

    const lastPart = parts[parts.length - 1];
    if (typeof cur[lastPart] === 'object' && cur[lastPart] !== null) {
      continue;
    }
    cur[lastPart] = value;
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
