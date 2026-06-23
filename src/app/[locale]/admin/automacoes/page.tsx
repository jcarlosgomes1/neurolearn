import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AutomationsClient } from './AutomationsClient';

export const dynamic = 'force-dynamic';

export default async function AutomacoesPage() {
  const sb = await createClient();
  const { data } = await sb.rpc('nl_admin_event_subscriptions_list');
  const payload = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
  const rules = Array.isArray((payload as { rules?: unknown }).rules) ? (payload as { rules: unknown[] }).rules : [];
  const arbiter = ((payload as { arbiter?: unknown }).arbiter as Record<string, number>) || {};
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="⚡"
        eyebrow="Automação"
        title="Eventos → Agentes"
        description="A máquina event-driven: que eventos acordam que agentes, com prioridade, dedupe e o árbitro de ações ao utilizador. Config-driven e governável."
      />
      <AutomationsClient initialRules={rules as never[]} initialArbiter={arbiter} />
    </div>
  );
}
