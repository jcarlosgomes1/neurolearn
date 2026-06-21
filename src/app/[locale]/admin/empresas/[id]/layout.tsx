import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { EmpresaTabs } from './EmpresaTabs';

export default async function EmpresaLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: org } = await sb.from('nl_organizations').select('id, name, plan').eq('id', id).maybeSingle();
  const name = (org?.name as string) || t('emp_ws.fallback');
  const plan = (org?.plan as string) || '';
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
        <Link href={'/admin/empresas' as any} className="hover:text-slate-900 font-medium">{t('emp_ws.crumb')}</Link>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-900 truncate">{name}</span>
        {plan && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{plan}</span>}
      </div>
      <div className="border-b border-slate-200 mb-5"><EmpresaTabs orgId={id} /></div>
      {children}
    </div>
  );
}
