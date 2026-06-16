import { EventsAdmin } from './EventsAdmin';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <>
      <AdminPageHeader emoji="📅" title="Eventos & Webinars" description="Cria e publica eventos (webinars, AMAs, workshops). Visíveis por língua (a do utilizador + inglês universal); horas em UTC, mostradas no fuso de cada um." />
      <EventsAdmin />
    </>
  );
}
