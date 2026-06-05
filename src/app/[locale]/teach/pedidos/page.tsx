import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { listInquiriesForInstructorAction } from '../corporate-actions';
import { PedidosInstructorClient } from './PedidosInstructorClient';

export const metadata = { title: 'Pedidos Corporate · Teach' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: ins } = await sb.from('nl_instructors').select('id, status').eq('id', user.id).maybeSingle();
  if (!ins || ins.status !== 'approved') redirect(`/${locale}`);
  
  const r = await listInquiriesForInstructorAction();
  return <PedidosInstructorClient locale={locale} inquiries={r.ok ? r.inquiries : []} />;
}
