import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { getTranslations } from 'next-intl/server';
import { Clock, ArrowRight } from 'lucide-react';
import { UserAvatar } from '@/components/account/UserAvatar';

export default async function Page({ params }: { params: Promise<{ handle: string; locale: string }> }) {
  const { handle, locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const blocks = await getHomeBlocks(locale);
  const { data: host } = await sb.rpc('nl_scheduling_host_by_handle', { p_handle: handle, p_lang: locale });

  if (!host?.ok) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-white">
          <div className="max-w-md mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl font-bold text-slate-900">404</h1>
            <p className="mt-3 text-slate-600">{t('sched.public.host_not_found')}</p>
          </div>
        </main>
        <Footer data={blocks.footer_brand || {}} />
      </>
    );
  }

  const h = host.host;
  const links = host.links as Array<{ id: string; slug: string; title: string; description: string | null; duration_min: number; price_cents: number; currency: string }>;
  const interests = (h.interests || []) as Array<{ slug: string; emoji: string; label: string }>;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <UserAvatar url={h.avatar_url} seed={h.name} name={h.name} size={64} />
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-900 leading-tight">{h.name}</h1>
                {h.headline && <p className="text-sm text-slate-500 mt-0.5">{h.headline}</p>}
              </div>
            </div>
            {h.bio && <p className="text-sm text-slate-600 mt-4 leading-relaxed">{h.bio}</p>}
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {interests.map((it) => (
                  <span key={it.slug} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                    <span>{it.emoji}</span>{it.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <h2 className="font-bold text-slate-900 mt-8 mb-3 px-1">{t('sched.public.pick_type')}</h2>
          {links.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
              {t('sched.public.no_types')}
            </div>
          ) : (
            <div className="space-y-2">
              {links.map((l) => (
                <Link key={l.id} href={`/agendar/${handle}/${l.slug}` as any}
                  className="block bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all p-4 group">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">{l.title}</h3>
                      {l.description && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{l.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 text-slate-500"><Clock className="h-3 w-3" />{l.duration_min} min</span>
                        <span className="text-slate-300">·</span>
                        <span className={l.price_cents > 0 ? 'text-slate-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                          {l.price_cents > 0 ? `${(l.price_cents/100).toFixed(2)} ${l.currency}` : t('sched.link.free')}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer data={blocks.footer_brand || {}} />
    </>
  );
}
