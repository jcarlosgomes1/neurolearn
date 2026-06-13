import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { listContactMessagesAction } from './actions';
import { ContactosClient } from './ContactosClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t('admin.contacts.title') };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: profile } = await sb.from('nl_profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect(`/${locale}`);
  const r: any = await listContactMessagesAction('new');
  const initial = (r?.ok && Array.isArray(r.messages)) ? r.messages : [];
  return <ContactosClient initial={initial} />;
}
