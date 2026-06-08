import { createClient } from '@/lib/supabase/server';
import { TopBarClient } from './TopBarClient';

export async function TopBar({ locale }: { locale: string }) {
  try {
    const sb = await createClient();
    const { data } = await sb.rpc('nl_topbar_get', { p_lang: locale });
    if (!data || !(data as any).enabled) return null;
    return <TopBarClient data={data as any} />;
  } catch {
    return null;
  }
}
