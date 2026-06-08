import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { ConteudoClient } from './ConteudoClient';
import { FolderUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EmpresaConteudoPage({ params, searchParams }: {
  params: Promise<{ locale: string }>; searchParams: Promise<{ org?: string }>
}) {
  const { locale } = await params;
  const { org: orgParam } = await searchParams;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login', locale });

  const { data: orgs } = await sb.rpc('nl_my_orgs');
  const orgList = Array.isArray(orgs) ? orgs : [];
  if (orgList.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Sem workspace</h1>
        <p className="text-sm text-slate-500 mt-2">Cria uma empresa em <code className="bg-slate-100 px-1 rounded">/empresa</code> para começar.</p>
      </div>
    );
  }
  const activeOrgId = orgParam || orgList[0].org_id;
  const { data: content } = await sb.rpc('nl_org_content_list', { p_org_id: activeOrgId });
  const { data: proposals } = await sb.rpc('nl_org_proposals_list', { p_org_id: activeOrgId });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <FolderUp className="h-3.5 w-3.5" /> LMS · Conteúdo da empresa
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Documentos & cursos gerados</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
          Faz upload de manuais, PDFs ou docs. A IA extrai conteúdo e propõe cursos. Aprovas e ficam disponíveis para os teus colaboradores.
        </p>
      </div>
      <ConteudoClient
        orgs={orgList}
        activeOrgId={activeOrgId}
        content={Array.isArray(content) ? content : []}
        proposals={Array.isArray(proposals) ? proposals : []}
      />
    </div>
  );
}
