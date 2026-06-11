import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { ArrowLeft, ToggleRight } from 'lucide-react';
import { FeaturesClient } from './FeaturesClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/features');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/');

  const { data } = await sb
    .from('nl_feature_flags')
    .select('key, label, description, category, enabled, route, sort_order')
    .order('sort_order');

  return (
    <div>
      <Link href={'/admin' as any} className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Cockpit
      </Link>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <ToggleRight className="h-3.5 w-3.5" /> Sistema · Funcionalidades
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Funcionalidades</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          Ativa ou desativa funcionalidades da plataforma em runtime. As alterações aplicam-se em segundos, sem deploy.
        </p>
      </header>
      <FeaturesClient initial={Array.isArray(data) ? data : []} />
    </div>
  );
}
