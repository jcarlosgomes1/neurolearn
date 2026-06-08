import { createClient } from '@/lib/supabase/server';
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-violet-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <FileText className="h-3.5 w-3.5" /> Candidatura a instrutor
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Os meus documentos</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
          Faz upload de CV, certificados e materiais. Ficam sempre acessíveis para atualizares.
        </p>
      </div>

      <CandidatoClient
        application={appData || null}
        files={Array.isArray(files) ? files : []}
        userId={user!.id}
      />
    </div>
  );
}
