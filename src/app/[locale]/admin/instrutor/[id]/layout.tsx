import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';
import { InstrutorTabs } from './InstrutorTabs';

export default async function InstrutorLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: inst } = await sb.from('nl_instructors').select('id, display_name, status, avatar_url, profile_picture_url').eq('id', id).maybeSingle();
  const name = (inst?.display_name as string) || t('instr_ws.fallback');
  const status = (inst?.status as string) || '';
  const avatar = (inst?.avatar_url as string) || (inst?.profile_picture_url as string) || null;
  const statusCls = status === 'approved' ? 'bg-emerald-100 text-emerald-700' : status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600';
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
      <Link href={'/admin/instrutores' as any} className="group inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> {t('instr_ws.back')}
      </Link>
      <div className="flex items-center gap-3 mt-3 mb-4">
        {avatar ? (
          <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg">{(name || '?')[0]?.toUpperCase()}</div>
        )}
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t('instr_ws.eyebrow')}</div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 truncate">{name}</h1>
            {status && <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusCls}`}>{status}</span>}
          </div>
        </div>
      </div>
      <div className="border-b border-slate-200 mb-5"><InstrutorTabs instructorId={id} /></div>
      {children}
    </div>
  );
}
