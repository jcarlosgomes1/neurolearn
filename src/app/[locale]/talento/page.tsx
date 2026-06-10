import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { TalentProfileClient } from './TalentProfileClient';
import { Briefcase } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/talento`);
  const { data } = await sb.rpc('nl_talent_profile_get_own');
  
  // Quick count of placements
  const { count: placementsCount } = await sb.from('nl_talent_placements')
    .select('id', { count: 'exact', head: true })
    .eq('talent_user_id', user.id);
  
  return (
    <>
      {(placementsCount ?? 0) > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
          <Link href={'/talento/meus-pedidos' as any}
            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="font-semibold text-emerald-900 text-sm">{t('tal.interested_count', { count: placementsCount ?? 0 })}</div>
                <div className="text-xs text-emerald-700">{t('tal.see_requests')} →</div>
              </div>
            </div>
          </Link>
        </div>
      )}
      <TalentProfileClient initial={data as any} />
    </>
  );
}
