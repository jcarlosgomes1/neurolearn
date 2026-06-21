import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { InstrutorTabs } from './InstrutorTabs';

export default async function InstrutorLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: inst } = await sb.from('nl_instructors').select('id, display_name, status').eq('id', id).maybeSingle();
  const name = (inst?.display_name as string) || t('instr_ws.fallback');
  const status = (inst?.status as string) || '';
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
        <Link href={'/admin/instrutores' as any} className="hover:text-slate-900 font-medium">{t('instr_ws.crumb')}</Link>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-900 truncate">{name}</span>
        {status && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{status}</span>}
      </div>
      <div className="border-b border-slate-200 mb-5"><InstrutorTabs instructorId={id} /></div>
      {children}
    </div>
  );
}
