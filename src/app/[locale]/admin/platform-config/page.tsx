import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { ArrowLeft, Settings } from 'lucide-react';
import { PlatformConfigClient } from './PlatformConfigClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/platform-config');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin'].includes(profile.role)) redirect('/');

  const { data, error } = await sb.from('nl_platform_config').select('key, value, description').order('key');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={'/admin' as any} className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Cockpit
      </Link>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Settings className="h-3.5 w-3.5" /> Sistema · Configuração da plataforma
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configuração da plataforma</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          Variáveis editáveis em runtime: email de contacto, dados empresa, moedas suportadas, e outras chaves de sistema.
        </p>
      </header>
      <PlatformConfigClient initial={Array.isArray(data) ? data : []} />
    </div>
  );
}
