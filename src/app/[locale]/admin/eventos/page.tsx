import { EventsView } from './EventsView';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Eventos · Admin' };

export default async function Page() {
  // RBAC já feita no layout.tsx pai
  const sb = await createClient();
  await sb.auth.getUser();
  return <EventsView />;
}
