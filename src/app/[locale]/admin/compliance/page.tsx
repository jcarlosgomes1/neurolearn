import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { ComplianceClient } from './ComplianceClient';

export const dynamic = 'force-dynamic';

export default async function CompliancePage() {
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/compliance');
  const { data: isAdmin } = await sb.rpc('nl_is_platform_admin');
  if (!isAdmin) redirect('/');

  const [{ data: issues }, { data: summary }] = await Promise.all([
    sb.rpc('nl_admin_compliance_issues_list', { p_status: null, p_limit: 200 }),
    sb.rpc('nl_admin_compliance_issues_summary'),
  ]);

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="">
      <AdminPageHeader
        emoji="🛡️"
        eyebrow={safeT('admin.compliance.eyebrow', 'Admin · Compliance')}
        title={safeT('admin.compliance.title', 'Issues de compliance')}
        description={safeT('admin.compliance.description', 'GDPR, segurança, privacidade e outras questões detectadas automaticamente ou manualmente.')}
      />
      <ComplianceClient
        initialIssues={Array.isArray(issues) ? issues : []}
        summary={Array.isArray(summary) ? summary : []}
      />
    </div>
  );
}
