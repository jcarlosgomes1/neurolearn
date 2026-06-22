import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { Heart, BookOpen } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

export const metadata = { title: 'Wishlist · NeuroLearn' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/conta/wishlist`);
  const { data } = await sb.rpc('nl_wishlist_list');
  const courses = (data as any)?.courses || [];
  return (
    <>
      <main className="bg-slate-50 min-h-screen">
        <AppPageHeader title={t('wishlist.title')} description={t('wishlist.count', { count: courses.length })} />
        <div className="">
          {courses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Heart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">{t('wishlist.empty_title')}</h3>
              <p className="text-sm text-slate-500 mb-4">{t('wishlist.empty_desc')}</p>
              <Link href={'/cursos' as any} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
                <BookOpen className="h-4 w-4" /> {t('common.explore_courses')}
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((c: any) => (
                <Link key={c.id} href={`/curso/${c.id}` as any} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="aspect-video bg-gradient-to-br from-brand-100 to-violet-100 flex items-center justify-center text-5xl">
                    {c.cover_url ? <img src={c.cover_url} alt="" className="w-full h-full object-cover" /> : (c.emoji || '📘')}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 line-clamp-2 group-hover:text-brand-700">{c.title}</h3>
                    {c.subtitle && <p className="text-xs text-slate-500 line-clamp-2 mt-1">{c.subtitle}</p>}
                    <div className="mt-2 font-semibold text-slate-900">€{(c.price_cents/100).toFixed(2)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
