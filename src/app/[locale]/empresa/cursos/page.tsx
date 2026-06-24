import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { EmpresaCursosClient } from './EmpresaCursosClient';

export const dynamic = 'force-dynamic';

export default async function EmpresaCursosPage() {
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/empresa/cursos');

  const { data: courses } = await sb.rpc('nl_my_org_marketplace_courses');

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AdminPageHeader title={safeT('empresa.courses.title', 'Os cursos da empresa')} description={safeT('empresa.courses.description', 'Cursos disponibilizados pela tua empresa. Inscreve-te enquanto há seats.')} />
      <EmpresaCursosClient items={Array.isArray(courses) ? courses : []} />
    </div>
  );
}
