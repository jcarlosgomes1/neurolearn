import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';
import { MindMap } from '@/components/shared/MindMap';

export const metadata = { title: 'Mapa do curso' };

export default async function Page({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const sb = await createClient();
  const t = await getTranslations('map');
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?redirect_to=/learn/curso/${id}/mapa`);

  const { data, error } = await sb.rpc('nl_course_map_mermaid', { p_course_id: id });
  const r = data as { ok?: boolean; error?: string; title?: string; mermaid?: string } | null;
  if (error || !r?.ok) {
    redirect(r?.error === 'no_access' ? `/${locale}/curso/${id}` : `/${locale}/learn`);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href={`/learn/curso/${id}/aula/0/0` as any} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 mb-6">
        <ArrowLeft className="h-4 w-4" /> {t('back')}
      </Link>

      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{t('eyebrow')}</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-1 text-balance">{r?.title}</h1>
        <p className="text-slate-500 mt-2">{t('subtitle')}</p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-2 sm:p-4 overflow-hidden">
        <MindMap code={r?.mermaid || ''} />
      </div>
    </div>
  );
}
