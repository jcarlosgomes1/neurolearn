import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { getTranslations } from 'next-intl/server';
import { Clock, ArrowRight, CalendarDays, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Mentor {
  name: string; handle: string; avatar_url: string | null; bio: string | null; role: string;
  sessions_count: number; min_duration: number | null; max_duration: number | null;
  min_price_cents: number | null; currency: string | null; has_free: boolean; location_types: string[];
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const blocks = await getHomeBlocks(locale);
  const { data } = await sb.rpc('nl_scheduling_public_directory', { p_lang: locale, p_limit: null });
  const res = (data || {}) as { ok?: boolean; show_prices?: boolean; mentors?: Mentor[] };
  const mentors = res?.mentors || [];
  const showPrices = res?.show_prices !== false;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600">
              <Sparkles className="h-3.5 w-3.5" /> {t('sched.dir.eyebrow')}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mt-3 text-balance">{t('sched.dir.title')}</h1>
            <p className="text-slate-600 mt-3 max-w-xl mx-auto text-pretty">{t('sched.dir.subtitle')}</p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          {mentors.length === 0 ? (
            <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3"><CalendarDays className="h-6 w-6" /></span>
              <h2 className="font-display text-lg font-bold text-slate-900">{t('sched.dir.empty_title')}</h2>
              <p className="text-sm text-slate-500 mt-1">{t('sched.dir.empty_sub')}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {mentors.map((m) => {
                const price = showPrices && m.min_price_cents != null
                  ? `${t('sched.dir.from')} ${(m.min_price_cents / 100).toFixed(2)} ${m.currency || ''}`.trim()
                  : (m.has_free ? t('sched.link.free') : null);
                return (
                  <Link key={m.handle} href={`/agendar/${m.handle}` as any}
                    className="group flex flex-col bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all p-5">
                    <div className="flex items-center gap-3.5">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt={m.name} className="w-14 h-14 rounded-full object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-white text-lg font-bold flex items-center justify-center">
                          {m.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-bold text-slate-900 leading-tight truncate group-hover:text-brand-700 transition-colors">{m.name}</h3>
                        <span className="inline-block mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-600">{t('sched.dir.role_label')}</span>
                      </div>
                    </div>

                    {m.bio ? <p className="text-sm text-slate-600 mt-3 line-clamp-2 leading-relaxed">{m.bio}</p> : <div className="mt-3" />}

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <Clock className="h-3.5 w-3.5" />{t('sched.dir.min', { n: m.min_duration ?? 0 })}
                      </span>
                      {price && (
                        <span className={m.min_price_cents != null ? 'text-slate-800 font-semibold' : 'text-emerald-700 font-semibold'}>{price}</span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{t('sched.dir.sessions_count', { n: m.sessions_count })}</span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                        {t('sched.dir.book')} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer data={blocks.footer_brand || {}} />
    </>
  );
}
