import { EventsAdmin } from './EventsAdmin';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader emoji="📅" title="Eventos & Webinars" description="Cria e publica eventos (webinars, AMAs, workshops). Visíveis por língua (a do utilizador + inglês universal); horas em UTC, mostradas no fuso de cada um." />
      <EventsAdmin />
    </div>
  );
}
