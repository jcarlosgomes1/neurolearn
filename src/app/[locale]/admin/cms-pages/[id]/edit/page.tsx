import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';
import { PageEditor } from './PageEditor';

export const dynamic = 'force-dynamic';

export default async function EditCmsPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data } = await sb.rpc('nl_admin_page_get', { p_id: id });
  if (!data || !(data as any).page) notFound();

  return (
    <div className="">
      <Link
        href={'/admin/cms-pages' as any}
        className="group inline-flex items-center gap-1.5 mb-5 text-sm text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Voltar
      </Link>
      <PageEditor initial={data as any} />
    </div>
  );
}
