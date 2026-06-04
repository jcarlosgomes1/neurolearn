import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SecurityClient } from './SecurityClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  
  // Verificar factors MFA enrollados
  const { data: factorsData } = await sb.auth.mfa.listFactors();
  const totpFactors = factorsData?.totp || [];
  
  return <SecurityClient userEmail={user.email || ''} totpFactors={totpFactors as any} />;
}
