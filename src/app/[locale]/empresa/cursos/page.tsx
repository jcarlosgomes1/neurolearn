import { createClient } from '@/lib/supabase/server';
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
      <header className="mb-8">
        <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Building2 className="h-3.5 w-3.5" /> Da minha empresa
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{safeT('empresa.courses.title', 'Os cursos da empresa')}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          {safeT('empresa.courses.description', 'Cursos disponibilizados pela tua empresa. Inscreve-te enquanto há seats.')}
        </p>
      </header>
      <EmpresaCursosClient items={Array.isArray(courses) ? courses : []} />
    </div>
  );
}
