import { EventoOverviewPanel } from '@/components/evento/EventoOverviewPanel';

export const metadata = { title: 'Evento · Admin' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventoOverviewPanel eventId={id} />;
}
