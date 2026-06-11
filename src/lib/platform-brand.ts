import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export interface PlatformBrand { name: string; description: string; url: string }

// Single source of truth for the platform brand, read from the backoffice (nl_platform_config).
// React cache() dedupes the read within a single request. Falls back to safe defaults if the DB is unavailable.
export const getPlatformBrand = cache(async (): Promise<PlatformBrand> => {
  const fallback: PlatformBrand = { name: 'NeuroLearn', description: '', url: 'https://neurolearn-rosy.vercel.app' };
  try {
    const sb = await createClient();
    const { data } = await sb
      .from('nl_platform_config')
      .select('key, value')
      .in('key', ['company_name', 'company_description', 'site_url']);
    const map: Record<string, string> = {};
    for (const row of (data || []) as Array<{ key: string; value: string }>) map[row.key] = row.value;
    return {
      name: (map.company_name || fallback.name).trim(),
      description: (map.company_description || '').trim(),
      url: (map.site_url || fallback.url).trim(),
    };
  } catch {
    return fallback;
  }
});
