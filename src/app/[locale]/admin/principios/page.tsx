import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { redirect } from 'next/navigation';
import { PrinciposClient } from './PrinciposClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/principios');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/');

  const { data: rows } = await sb
    .from('nl_platform_config')
    .select('key, value')
    .in('key', ['founder_mandates', 'session_handoff_current']);

  const map = new Map((rows || []).map((r: any) => [r.key, r.value]));
  let mandates: Array<{ n: number; t: string; d: string }> = [];
  try { mandates = JSON.parse(map.get('founder_mandates') || '[]'); } catch { mandates = []; }
  const handoff = map.get('session_handoff_current') || '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="🧭"
        eyebrow="Sistema · Estado do projeto"
        title="Princípios & Continuidade"
        description="Os mandamentos não-negociáveis do projeto e o ponto de situação corrente. Este é o âncora entre sessões: mantém-se aqui, no ecrã, editável."
      />
      <PrinciposClient initialMandates={mandates} initialHandoff={handoff} />
    </div>
  );
}
