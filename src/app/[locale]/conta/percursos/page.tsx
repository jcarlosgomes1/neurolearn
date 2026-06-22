import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PathRequestClient } from './PathRequestClient';

export const metadata = { title: 'Propor percurso · NeuroLearn' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/conta/percursos`);
  return <PathRequestClient />;
}
