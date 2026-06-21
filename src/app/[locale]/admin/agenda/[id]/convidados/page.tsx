import { EventoConvidadosPanel } from '@/components/evento/EventoConvidadosPanel';

export const metadata = { title: 'Convidados · Evento' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventoConvidadosPanel eventId={id} />;
}
