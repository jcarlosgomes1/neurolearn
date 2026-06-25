import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { redirect } from '@/i18n/routing';
import { CandidatoClient } from './CandidatoClient';
import { FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Candidatura · Documentos' };

export default async function CandidatoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const t = await getTranslations();
  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login', locale });

  const { data: appData } = await sb.rpc('nl_my_instructor_application');
  const { data: files } = await sb.rpc('nl_instructor_files_my');

  return (
    <div className="">
      <AdminPageHeader title={safeT('account.candidato.title', 'Os meus documentos')} description={safeT('account.candidato.description', 'Faz upload de CV, certificados e materiais. Ficam sempre acessíveis para atualizares.')} />

      <CandidatoClient
        application={appData || null}
        files={Array.isArray(files) ? files : []}
        userId={user!.id}
      />
    </div>
  );
}
