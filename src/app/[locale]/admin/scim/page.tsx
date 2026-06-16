import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ScimClient } from './ScimClient';

export const dynamic = 'force-dynamic';

export default async function AdminScimPage() {
  const sb = await createClient();
  const [{ data: tokens }, { data: orgs }] = await Promise.all([
    sb.rpc('nl_admin_scim_tokens_list'),
    sb.from('nl_organizations').select('id, name, slug').order('name'),
  ]);

  return (
    <div className="">
      <AdminPageHeader
        emoji="🔑"
        eyebrow="Enterprise · SCIM 2.0"
        title="SCIM provisioning tokens"
        description="Tokens para sincronização automática de utilizadores e grupos a partir de IdPs (Okta, Azure AD, etc) via SCIM 2.0."
      />

      <ScimClient tokens={Array.isArray(tokens) ? tokens : []} orgs={Array.isArray(orgs) ? orgs : []} />
    </div>
  );
}
