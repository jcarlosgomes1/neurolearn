import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { routing } from './routing';
import { FALLBACK_MESSAGES } from './fallback';
import { ADMIN_MESSAGES } from './admin-messages';
import { getDbMessages } from './db-messages';
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

  const fileFlat = FLAT_MESSAGES[locale] || FLAT_MESSAGES.pt;
  const dbFlat = await getDbMessages(locale).catch(() => ({} as Record<string, string>));

  // Ordem de precedência (do menor ao maior):
  // 1. FALLBACK_MESSAGES (defaults estáticos)
  // 2. fileFlat (pt.json estático)
  // 3. ADMIN_MESSAGES[locale] (nested defaults para keys que adicionei recentemente)
  // 4. dbFlat (DB nl_i18n — fonte de verdade editável, vence tudo)
  const mergedFlat: Record<string, string> = { ...fileFlat, ...dbFlat };
  const nestedFromFlat = flattenToNamespaced(mergedFlat);

  // FALLBACK como base, ADMIN como nested defaults, depois file+db sobrepõem
  const messages = deepMerge(
    deepMerge(FALLBACK_MESSAGES, ADMIN_MESSAGES[locale] || ADMIN_MESSAGES.pt),
    nestedFromFlat
  );

  return {
    locale,
    // Default global de fuso para formatação (igual ao cliente em
    // ClientIntlProvider) — evita ENVIRONMENT_FALLBACK e mismatches de
    // hidratação. Sobreponível por chamada quando necessário.
    timeZone: 'Europe/Lisbon',
    messages,
    // Resiliência: uma tradução em falta NUNCA deve derrubar a página inteira
    // (boundary "Algo correu mal"). Degrada graciosamente — regista apenas erros
    // reais e devolve a própria chave como texto de último recurso.
    onError(error) {
      if ((error as any)?.code !== 'MISSING_MESSAGE') {
        console.error('[i18n]', error);
      }
    },
    getMessageFallback({ namespace, key }) {
      return namespace ? `${namespace}.${key}` : key;
    },
  };
});

function flattenToNamespaced(flat: Record<string, string>): AbstractIntlMessages {
  const result: any = {};
  const sortedKeys = Object.keys(flat).sort((a, b) => b.split('.').length - a.split('.').length);

  for (const key of sortedKeys) {
    const value = flat[key];
    if (value == null || value === '') continue;
    const parts = key.split('.');
    let cur = result;
    let blocked = false;

    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i];
      if (typeof cur[seg] === 'string') { blocked = true; break; }
      if (!cur[seg]) cur[seg] = {};
      cur = cur[seg];
    }
    if (blocked) continue;

    const lastPart = parts[parts.length - 1];
    if (typeof cur[lastPart] === 'object' && cur[lastPart] !== null) continue;
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
