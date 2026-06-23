import { EventsAgentClient } from './EventsAgentClient';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="🎟️"
        title="Agente de Eventos"
        description="Sugestões de eventos a partir dos temas populares e da procura, e identificação de convidados (plataforma por competências/lead score e externos por leads reais). Governado pelo agente eventos."
      />
      <EventsAgentClient />
    </div>
  );
}
