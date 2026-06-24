import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { redirect } from '@/i18n/routing';
import { CandidatoClient } from './CandidatoClient';
import { FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Candidatura · Documentos' };

export default async function CandidatoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login', locale });

  const { data: appData } = await sb.rpc('nl_my_instructor_application');
  const { data: files } = await sb.rpc('nl_instructor_files_my');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader title="Os meus documentos" description="Faz upload de CV, certificados e materiais. Ficam sempre acessíveis para atualizares." />

      <CandidatoClient
        application={appData || null}
        files={Array.isArray(files) ? files : []}
        userId={user!.id}
      />
    </div>
  );
}
