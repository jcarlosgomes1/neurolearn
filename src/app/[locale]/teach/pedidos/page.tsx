import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Inbox } from 'lucide-react';
import { InquiriesClient } from './InquiriesClient';

export const dynamic = 'force-dynamic';

export default async function InquiriesPage() {
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/teach/pedidos');
  const { data: inquiries } = await sb.rpc('nl_my_corporate_inquiries');
  const ids = (Array.isArray(inquiries) ? inquiries : []).map((i: any) => i.org_id).filter(Boolean);
  let orgsMap: Record<string, string> = {};
  if (ids.length) {
    const { data: orgs } = await sb.from('nl_organizations').select('id, name').in('id', ids);
    orgsMap = Object.fromEntries((orgs || []).map((o: any) => [o.id, o.name]));
  }
  const svcIds = (Array.isArray(inquiries) ? inquiries : []).map((i: any) => i.service_id).filter(Boolean);
  let svcMap: Record<string, string> = {};
  if (svcIds.length) {
    const { data: svcs } = await sb.from('nl_instructor_services').select('id, title').in('id', svcIds);
    svcMap = Object.fromEntries((svcs || []).map((s: any) => [s.id, s.title]));
  }

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <AdminPageHeader title={safeT('teach.inquiries.title', 'Pedidos recebidos')} description={safeT('teach.inquiries.description', 'Empresas que pediram um dos teus serviços. Cota, recusa ou negocia.')} />
      <InquiriesClient items={Array.isArray(inquiries) ? inquiries : []} orgsMap={orgsMap} svcMap={svcMap} />
    </div>
  );
}
