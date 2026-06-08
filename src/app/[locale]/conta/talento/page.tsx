import { createClient } from '@/lib/supabase/server';
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-violet-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Briefcase className="h-3.5 w-3.5" /> {safeT('account.talent.eyebrow', 'Carreira · Perfil talento')}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{safeT('account.talent.title', 'Perfil de talento')}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          {safeT('account.talent.description', 'Disponibiliza o teu perfil às empresas para oportunidades de carreira. Controlas o que partilhas e a quem.')}
        </p>
      </header>
      <TalentClient initial={(profile as any) || {}} />
    </div>
  );
}
