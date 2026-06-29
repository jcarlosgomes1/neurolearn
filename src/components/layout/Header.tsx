import { getSessionWithArea } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { getNavItems } from '@/lib/api/nav-items';
import { HeaderClient } from './HeaderClient';

async function getMenuStyle(): Promise<string> {
  try {
    const sb = await createClient();
    const { data } = await sb.rpc('nl_design_active_full');
    const row = Array.isArray(data) ? data[0] : data;
    const style = row?.tokens?.menu?.style;
    return typeof style === 'string' ? style : 'underline';
  } catch {
    return 'underline';
  }
}

export async function Header() {
  const [session, nav, menuStyle] = await Promise.all([
    getSessionWithArea(),
    getNavItems('header'),
    getMenuStyle(),
  ]);
  return <HeaderClient nav={nav} menuStyle={menuStyle} session={session ? { email: session.user.email!, area: session.area, areas: session.areas } : null} />;
}
