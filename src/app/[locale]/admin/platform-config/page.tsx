import { createClient } from '@/lib/supabase/server';
import { PlatformConfigClient } from './PlatformConfigClient';
import { Cog } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlatformConfigPage() {
  const sb = await createClient();
  const { data: items } = await sb.rpc('nl_admin_platform_config_list');
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Cog className="h-3.5 w-3.5" /> Sistema · Configuração
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configuração da plataforma</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
          Funcionalidades globais (2FA, signup público, módulos), emails de sistema, integrações.
        </p>
      </div>
      <PlatformConfigClient items={Array.isArray(items) ? items : []} />
    </div>
  );
}
