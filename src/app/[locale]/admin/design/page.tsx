import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { redirect } from 'next/navigation';
import { DesignClient } from './DesignClient';

export const dynamic = 'force-dynamic';

interface Direction { id: string; name: string; tagline: string; file: string; accent: string; sort_order: number; motion: boolean; }

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/design');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/');

  const { data } = await sb.rpc('nl_design_directions_list');
  const active: string = data?.active ?? 'dir4';
  const directions: Direction[] = Array.isArray(data?.directions) ? data.directions : [];

  return (
    <div className="">
      <AdminPageHeader
        emoji="🎨"
        eyebrow="Sistema · Aparência"
        title="Direção de design"
        description="Pré-visualiza qualquer direção e define a ativa — a escolha re-tematiza o site inteiro (público incluído): cor de acento, tipografia e superfície mudam em todas as páginas. O movimento (animações) liga/desliga por direção."
      />
      <DesignClient initialActive={active} directions={directions} />
    </div>
  );
}
