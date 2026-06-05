import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { listNotificationsAction } from '../actions';
import { NotificationsListClient } from './NotificationsListClient';
import { EmailDigestToggle } from '@/components/account/EmailDigestToggle';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  
  const r = await listNotificationsAction(false, 100);
  const { data: profile } = await sb.from('nl_profiles')
    .select('email_digest_enabled').eq('id', user.id).maybeSingle();
  
  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        <EmailDigestToggle initialEnabled={profile?.email_digest_enabled ?? true} />
      </div>
      <NotificationsListClient initial={(r.ok ? r.data : []) as any[]} locale={locale} />
    </div>
  );
}
