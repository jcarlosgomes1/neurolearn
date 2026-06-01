import { getSessionWithArea } from '@/lib/supabase/server';
import { HeaderClient } from './HeaderClient';

export async function Header() {
  const session = await getSessionWithArea();
  return <HeaderClient session={session ? { email: session.user.email!, area: session.area } : null} />;
}
