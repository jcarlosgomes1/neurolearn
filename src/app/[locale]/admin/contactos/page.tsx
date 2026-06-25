import { createClient } from '@/lib/supabase/server';
import { ContactsCockpit } from './ContactsCockpit';

export const dynamic = 'force-dynamic';
export async function generateMetadata() { return { title: 'Contactos · NeuroLearn' }; }

export default async function Page() {
  const sb = await createClient();
  const [{ data: stats }, { data: list }] = await Promise.all([
    sb.rpc('nl_admin_contacts_stats'),
    sb.rpc('nl_admin_contacts_list', { p_limit: 25, p_offset: 0 }),
  ]);
  return <ContactsCockpit initialStats={(stats as any) || {}} initialList={(list as any) || { rows: [], total: 0 }} />;
}
