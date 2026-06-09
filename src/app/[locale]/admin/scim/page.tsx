import { createClient } from '@/lib/supabase/server';
import { ScimClient } from './ScimClient';
import { KeyRound } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminScimPage() {
  const sb = await createClient();
  const [{ data: tokens }, { data: orgs }] = await Promise.all([
    sb.rpc('nl_admin_scim_tokens_list'),
    sb.from('nl_organizations').select('id, name, slug').order('name'),
  ]);

  return (
    <div className="">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <KeyRound className="h-3.5 w-3.5" /> Enterprise · SCIM 2.0
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SCIM provisioning tokens</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
          Tokens para sincronização automática de utilizadores e grupos a partir de IdPs (Okta, Azure AD, etc) via SCIM 2.0.
        </p>
      </div>

      <ScimClient tokens={Array.isArray(tokens) ? tokens : []} orgs={Array.isArray(orgs) ? orgs : []} />
    </div>
  );
}
