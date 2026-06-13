import { cache } from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getPlatformBrand } from '@/lib/platform-brand';

export interface SeoOverride {
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
}

// Lê um override SEO do backoffice (nl_seo_overrides via RPC nl_seo_override_for).
// cache() dedupe por request. Falha em silêncio para fallback.
export const getSeoOverride = cache(async (pageType: string, pageId: string | null, lang: string): Promise<SeoOverride | null> => {
  try {
    const sb = await createClient();
    const { data } = await sb.rpc('nl_seo_override_for', { p_page_type: pageType, p_page_id: pageId, p_lang: lang });
    const o = data as SeoOverride | null;
    if (o && (o.meta_title || o.meta_description || o.og_title || o.og_description)) return o;
    return null;
  } catch {
    return null;
  }
});

interface SeoFallback { title: string; description?: string }

// Compõe um objeto Metadata do Next aplicando o override por cima do fallback da página.
export async function seoMetadata(pageType: string, pageId: string | null, lang: string, fallback: SeoFallback): Promise<Metadata> {
  const [override, brand] = await Promise.all([getSeoOverride(pageType, pageId, lang), getPlatformBrand()]);
  const title = override?.meta_title || fallback.title;
  const description = override?.meta_description || fallback.description || brand.description || undefined;
  const ogTitle = override?.og_title || title;
  const ogDescription = override?.og_description || description;
  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      siteName: brand.name,
    },
  };
}
