import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Search, HelpCircle, User, BookOpen, CreditCard, Award, Building2, ShieldCheck, ArrowRight, Mail } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'ajuda', locale, { title: 'Centro de ajuda · NeuroLearn' });
}

const CAT_ORDER = ['account', 'courses', 'billing', 'certificates', 'business', 'privacy'];
const CAT_UI: Record<string, { icon: any; cls: string }> = {
  account: { icon: User, cls: 'from-violet-500 to-indigo-600' },
  courses: { icon: BookOpen, cls: 'from-emerald-500 to-teal-600' },
  billing: { icon: CreditCard, cls: 'from-amber-500 to-orange-600' },
  certificates: { icon: Award, cls: 'from-fuchsia-500 to-pink-600' },
  business: { icon: Building2, cls: 'from-blue-500 to-cyan-600' },
  privacy: { icon: ShieldCheck, cls: 'from-rose-500 to-red-600' },
};
const FALLBACK_UI = { icon: HelpCircle, cls: 'from-slate-500 to-slate-700' };

type Row = { category: string; slug: string; title: string; sort: number };
type Hit = { slug: string; title: string; category: string; snippet: string };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  const query = (q || '').trim();
  const t = await getTranslations();
  const sb = await createClient();

  let results: Hit[] = [];
  if (query) {
    const { data } = await sb.rpc('nl_help_search', { p_q: query, p_lang: locale });
    results = (data as Hit[]) || [];
  }

  const { data: catData } = await sb.rpc('nl_help_articles_by_cat', { p_lang: locale });
  const rows = (catData as Row[]) || [];
  const byCat = new Map<string, Row[]>();
  for (const r of rows) {
    if (!byCat.has(r.category)) byCat.set(r.category, []);
    byCat.get(r.category)!.push(r);
  }
  const cats = [
    ...CAT_ORDER.filter((c) => byCat.has(c)),
    ...[...byCat.keys()].filter((c) => !CAT_ORDER.includes(c)),
  ];

  const catLabel = (c: string) => {
    const k = `help.cat.${c}`;
    const v = t(k);
    return v === k ? c : v;
  };

  return (
    <main className="bg-white min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 border-b border-slate-200/60">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl animate-pulse" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 mb-6 shadow-sm">
            <HelpCircle className="h-3.5 w-3.5" /> {t('aj.badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
            {t('aj.h1_pre')}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{t('aj.h1_accent')}</span>
          </h1>
          <form action={`/${locale}/ajuda`} method="get" className="mt-8 relative max-w-xl mx-auto">
            <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={t('aj.search_ph')}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-lg outline-none focus:border-blue-500"
            />
          </form>
        </div>
      </section>

      {query ? (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="text-2xl font-bold text-slate-900">{t('help.search.results_title', { q: query })}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('help.search.count', { n: results.length })}</p>
          {results.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
              {t('help.search.none', { q: query })}
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {results.map((h) => (
                <li key={h.slug}>
                  <Link href={`/ajuda/${h.slug}` as any} className="block rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <div className="text-xs font-semibold text-blue-600 mb-1">{catLabel(h.category)}</div>
                    <div className="font-bold text-slate-900">{h.title}</div>
                    <div className="text-sm text-slate-500 mt-1 line-clamp-2">{h.snippet}…</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">{t('help.browse_title')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cats.map((c) => {
              const ui = CAT_UI[c] || FALLBACK_UI;
              const Icon = ui.icon;
              return (
                <div key={c} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className={`inline-flex h-11 w-11 rounded-xl bg-gradient-to-br ${ui.cls} text-white items-center justify-center mb-4 shadow-md`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-3">{catLabel(c)}</h3>
                  <ul className="space-y-1.5">
                    {(byCat.get(c) || []).map((a) => (
                      <li key={a.slug}>
                        <Link href={`/ajuda/${a.slug}` as any} className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 hover:gap-1.5 transition-all">
                          <ArrowRight className="h-3 w-3 text-slate-400" /> {a.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="bg-slate-50 py-20 border-t border-slate-200/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900">{t('aj.cta_title')}</h2>
          <p className="mt-3 text-slate-600">{t('aj.cta_desc')}</p>
          <div className="mt-6 grid sm:grid-cols-1 max-w-md mx-auto">
            <Link href={{ pathname: '/contacto', query: { topic: 'support', from: '/ajuda' } } as any}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all group">
              <Mail className="h-6 w-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-slate-900">{t('aj.send_msg')}</div>
              <div className="text-xs text-slate-500 mt-1">{t('aj.send_sub')}</div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
