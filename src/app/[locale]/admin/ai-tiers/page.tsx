import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AiTiersClient } from './AiTiersClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return { title: 'Modelo por grau de exigência' };
}

export default async function Page() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin/ai-tiers');
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes((profile as { role: string }).role)) redirect('/');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        emoji="🎚️"
        title="Modelo por grau de exigência"
        description="Escolhe o modelo de IA por tier. A escolha cascateia para todas as operações do tier — coerência garantida. O núcleo de conteúdo de cursos deve ficar num tier forte (qualidade e fiabilidade)."
      />
      <AiTiersClient />
    </div>
  );
}
