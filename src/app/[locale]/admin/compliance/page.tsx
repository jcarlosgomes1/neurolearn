import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <ShieldAlert className="h-3.5 w-3.5" /> {safeT('admin.compliance.eyebrow', 'Admin · Compliance')}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{safeT('admin.compliance.title', 'Issues de compliance')}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-3xl leading-relaxed">
          {safeT('admin.compliance.description', 'GDPR, segurança, privacidade e outras questões detectadas automaticamente ou manualmente.')}
        </p>
      </header>
      <ComplianceClient
        initialIssues={Array.isArray(issues) ? issues : []}
        summary={Array.isArray(summary) ? summary : []}
      />
    </div>
  );
}
