import { SessionRoom } from './SessionRoom';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  return <SessionRoom sessionId={id} />;
}
