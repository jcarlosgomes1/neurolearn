import { seoMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { Users } from 'lucide-react';
import { CommunityClient } from './CommunityClient';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'comunidade', locale, { title: 'Comunidade · NeuroLearn' });
}

export default async function Page() {
  const sb = await createClient();
  const t = await getTranslations();
  const { data: enabled } = await sb.rpc('nl_is_feature_enabled', { p_key: 'community' });
  const { data: { user } } = await sb.auth.getUser();
  const { data: channels } = await sb.rpc('nl_community_channels');

  let posts: unknown[] = [];
  let replies: unknown[] = [];
  let likedIds: string[] = [];
  if (enabled) {
    const p = await sb.from('nl_community_posts').select('id, author_name, content, course_id, likes, channel_key, created_at').order('created_at', { ascending: false }).limit(50);
    posts = p.data ?? [];
    const ids = (posts as { id: string }[]).map((x) => x.id);
    if (ids.length) {
      const r = await sb.from('nl_community_replies').select('id, post_id, author_name, content, created_at').in('post_id', ids).order('created_at', { ascending: true });
      replies = r.data ?? [];
    }
    if (user?.email) {
      const l = await sb.from('nl_community_likes').select('post_id').eq('user_email', user.email);
      likedIds = ((l.data ?? []) as { post_id: string }[]).map((x) => x.post_id);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-600">
            <Users className="h-4 w-4" /> {t('community.badge')}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">{t('community.title')}</h1>
          <p className="mt-2 text-slate-600">{t('community.subtitle')}</p>
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-6 py-8">
        {!enabled ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">{t('community.unavailable')}</div>
        ) : (
          <CommunityClient initialPosts={posts as never} initialReplies={replies as never} likedIds={likedIds} isAuthed={!!user} channels={(channels as never) ?? []} />
        )}
      </div>
    </main>
  );
}
