import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileForm } from './ProfileForm';
import { PublicProfileCard } from './PublicProfileCard';

export const dynamic = 'force-dynamic';
export async function generateMetadata() { return { title: 'Perfil · NeuroLearn' }; }

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await sb
    .from('nl_profiles')
    .select('name, bio, phone, phone_country_code, country_code, preferred_lang, handle')
    .eq('id', user.id)
    .single();

  const [cat, ints, pub] = await Promise.all([
    sb.rpc('nl_interests_catalogue', { p_lang: locale }),
    sb.rpc('nl_profile_interests_get'),
    sb.rpc('nl_profile_public_get'),
  ]);

  return (
    <main className="bg-slate-50 min-h-screen">
      <div>
        <ProfileForm
          email={user.email || ''}
          handle={profile?.handle || ''}
          initial={{
            name: profile?.name || '',
            bio: profile?.bio || '',
            phone: profile?.phone || '',
            phone_country_code: profile?.phone_country_code || '',
            country_code: profile?.country_code || '',
            preferred_lang: profile?.preferred_lang || locale,
          }}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 space-y-6">
          <PublicProfileCard
            catalogue={(cat.data as any) || []}
            initialInterests={(ints.data as any) || []}
            initialPublic={(pub.data as any) || {}}
          />
        </div>
      </div>
    </main>
  );
}
