import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  let messages: AbstractIntlMessages = {};
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/app-bootstrap?lang=${locale}`,
      { next: { revalidate: 60, tags: [`bootstrap:${locale}`] } }
    );
    const data = await res.json();
    messages = flattenToNamespaced(data?.i18n || {});
  } catch (err) {
    console.warn('[i18n] failed to load translations:', err);
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
