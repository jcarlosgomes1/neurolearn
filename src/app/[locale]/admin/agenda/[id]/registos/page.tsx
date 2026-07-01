import { EventoRegistosPanel } from '@/components/evento/EventoRegistosPanel';

export const metadata = { title: 'Registos · Evento' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventoRegistosPanel eventId={id} />;
}
