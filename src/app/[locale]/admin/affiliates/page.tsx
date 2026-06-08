import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { ArrowLeft, Handshake } from 'lucide-react';
import { AffiliatesClient } from './AffiliatesClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/affiliates');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect('/');

  const [{ data: list }, { data: kpis }] = await Promise.all([
    sb.rpc('nl_admin_affiliates_list', { p_search: null, p_status: null }),
    sb.rpc('nl_admin_affiliate_kpis'),
  ]);

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={'/admin' as any}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Cockpit
      </Link>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Handshake className="h-3.5 w-3.5" /> {safeT('admin.affiliates.eyebrow', 'Administração · Afiliados')}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{safeT('admin.affiliates.title', 'Programa de afiliados')}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          {safeT('admin.affiliates.description', 'Aprova candidaturas, define comissões e acompanha o desempenho.')}
        </p>
      </header>
      <AffiliatesClient
        kpis={(kpis as any) || {}}
        initial={Array.isArray(list) ? list : []}
      />
    </div>
  );
}
