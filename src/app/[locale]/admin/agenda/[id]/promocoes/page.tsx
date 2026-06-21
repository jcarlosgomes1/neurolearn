import { EventoPromocoesPanel } from '@/components/evento/EventoPromocoesPanel';

export const metadata = { title: 'Promoções · Evento' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventoPromocoesPanel eventId={id} />;
}
