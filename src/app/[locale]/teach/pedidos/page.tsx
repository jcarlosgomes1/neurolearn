import { createClient } from '@/lib/supabase/server';
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Inbox className="h-3.5 w-3.5" /> {safeT('teach.inquiries.eyebrow', 'Instrutor · Pedidos B2B')}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{safeT('teach.inquiries.title', 'Pedidos recebidos')}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          Empresas que pediram um dos teus serviços. Cota, recusa ou negocia.
        </p>
      </header>
      <InquiriesClient items={Array.isArray(inquiries) ? inquiries : []} orgsMap={orgsMap} svcMap={svcMap} />
    </div>
  );
}
