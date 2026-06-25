import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { TalentClient } from './TalentClient';

export const dynamic = 'force-dynamic';

export default async function TalentPage() {
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/conta/talento');
  const { data: profile } = await sb.rpc('nl_my_talent_profile');

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="">
      <AdminPageHeader title={safeT('account.talent.title', 'Perfil de talento')} description={safeT('account.talent.description', 'Disponibiliza o teu perfil às empresas para oportunidades de carreira. Controlas o que partilhas e a quem.')} />
      <TalentClient initial={(profile as any) || {}} />
    </div>
  );
}
