import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Handshake } from 'lucide-react';
import { ServicesClient } from './ServicesClient';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/teach/servicos');
  const { data: services } = await sb.rpc('nl_my_instructor_services');

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="">
      <AdminPageHeader title={safeT('teach.services.title', 'Os meus serviços')} description={safeT('teach.services.description', 'Workshops, formações in-company, mentorias. As empresas podem contactar-te através destes serviços.')} />
      <ServicesClient initial={Array.isArray(services) ? services : []} />
    </div>
  );
}
