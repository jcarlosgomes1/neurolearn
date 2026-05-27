import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type HomeBlocks = Record<string, any>;

export async function getHomeBlocks(lang: string): Promise<HomeBlocks> {
  const sb = await createClient();
  const { data, error } = await sb
    .from('nl_home_blocks')
    .select('slug, data')
    .eq('lang', lang);

  if (error || !data) {
    console.error('[getHomeBlocks] error:', error);
    return {};
  }

  return data.reduce<HomeBlocks>((acc, row) => {
    acc[row.slug] = row.data;
    return acc;
  }, {});
}
