import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/empresa/conteudo`);

  const { data: orgs } = await sb.rpc('nl_my_orgs');
  const list = Array.isArray(orgs) ? orgs : [];
  if (list.length === 0) redirect(`/${locale}/empresa/criar`);

  const slug = list[0].slug || list[0].org_slug || list[0].org_id;
  redirect(`/${locale}/empresa/${slug}/conteudos`);
}
