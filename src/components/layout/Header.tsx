import { getSessionWithArea } from '@/lib/supabase/server';
import { getNavItems } from '@/lib/api/nav-items';
import { HeaderClient } from './HeaderClient';

export async function Header() {
  const [session, nav] = await Promise.all([
    getSessionWithArea(),
    getNavItems('header'),
  ]);
  return <HeaderClient nav={nav} session={session ? { email: session.user.email!, area: session.area, areas: session.areas } : null} />;
}
