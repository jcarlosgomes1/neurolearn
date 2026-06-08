import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { EvaluationsClient } from './EvaluationsClient';
import { CheckSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PendingEvaluationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login', locale });
  const { data: pending } = await sb.rpc('nl_my_pending_evaluations');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <CheckSquare className="h-3.5 w-3.5" /> LMS · Validação humana
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Avaliações por validar</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          A IA já analisou e propôs nota + feedback. Confirma, ajusta ou rejeita.
          Toda a avaliação passa por validação humana antes de ser considerada final.
        </p>
      </header>
      <EvaluationsClient items={Array.isArray(pending) ? pending : []} />
    </div>
  );
}
