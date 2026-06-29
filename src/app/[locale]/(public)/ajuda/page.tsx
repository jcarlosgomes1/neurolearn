import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/shared/PageHero';
import { PageWidth } from '@/components/shared/PageWidth';
import { createClient } from '@/lib/supabase/server';
import { Search, HelpCircle, User, BookOpen, CreditCard, Award, Building2, ShieldCheck, ArrowRight, Mail } from 'lucide-react';

export const revalidate = 600;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return seoMetadata('marketing', 'ajuda', locale, { title: 'Centro de ajuda · NeuroLearn' });
}

const CAT_ORDER = ['account', 'courses', 'billing', 'certificates', 'business', 'privacy'];
const CAT_UI: Record<string, { icon: any; fam: string }> = {
  account: { icon: User, fam: 'denim' },
  courses: { icon: BookOpen, fam: 'sage' },
  billing: { icon: CreditCard, fam: 'saffron' },
  certificates: { icon: Award, fam: 'plum' },
  business: { icon: Building2, fam: 'teal' },
  privacy: { icon: ShieldCheck, fam: 'terra' },
};
const FALLBACK_UI = { icon: HelpCircle, fam: 'denim' };

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
    <main className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <PageHero
        icon={HelpCircle} badge={t('aj.badge')}
        title={t('aj.h1_pre')}
        titleAccent={t('aj.h1_accent')}
      >
        <form action={`/${locale}/ajuda`} method="get" className="relative w-full max-w-xl">
          <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-3)' }} />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={t('aj.search_ph')}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl shadow-lg outline-none"
            style={{ border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink)' }}
          />
        </form>
      </PageHero>

      {query ? (
        <section className="mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20" style={{ maxWidth: '48rem' }}>
          <h2 className="t-h2" style={{ color: 'var(--ink)' }}>{t('help.search.results_title', { q: query })}</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-3)' }}>{t('help.search.count', { n: results.length })}</p>
          {results.length === 0 ? (
            <div className="mt-8 rounded-2xl p-8 text-center" style={{ border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink-2)' }}>
              {t('help.search.none', { q: query })}
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {results.map((h) => (
                <li key={h.slug}>
                  <Link href={`/ajuda/${h.slug}` as any} className="block rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all" style={{ border: '1px solid var(--line)', background: 'var(--card)' }}>
                    <div className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>{catLabel(h.category)}</div>
                    <div className="font-bold" style={{ color: 'var(--ink)' }}>{h.title}</div>
                    <div className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--ink-3)' }}>{h.snippet}…</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <PageWidth py="py-16 sm:py-20">
          <h2 className="t-h2 mb-8" style={{ color: 'var(--ink)' }}>{t('help.browse_title')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cats.map((c) => {
              const ui = CAT_UI[c] || FALLBACK_UI;
              const Icon = ui.icon;
              return (
                <div key={c} className="rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all" style={{ background: 'var(--card)', border: '1px solid var(--line)', boxShadow: 'var(--nl-surface-shadow)' }}>
                  <div className="inline-flex h-11 w-11 rounded-xl text-white items-center justify-center mb-4 shadow-md" style={{ background: `linear-gradient(135deg, var(--${ui.fam}-base), var(--${ui.fam}-deep))` }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="t-h3 mb-3" style={{ color: 'var(--ink)' }}>{catLabel(c)}</h3>
                  <ul className="space-y-1.5">
                    {(byCat.get(c) || []).map((a) => (
                      <li key={a.slug}>
                        <Link href={`/ajuda/${a.slug}` as any} className="text-sm inline-flex items-center gap-1 hover:gap-1.5 transition-all" style={{ color: 'var(--ink-2)' }}>
                          <ArrowRight className="h-3 w-3" style={{ color: 'var(--ink-3)' }} /> {a.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </PageWidth>
      )}

      <section className="py-20 border-t" style={{ background: 'color-mix(in srgb, var(--paper) 60%, var(--card))', borderColor: 'var(--line)' }}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8 text-center" style={{ maxWidth: '48rem' }}>
          <h2 className="t-h2" style={{ color: 'var(--ink)' }}>{t('aj.cta_title')}</h2>
          <p className="mt-3" style={{ color: 'var(--ink-2)' }}>{t('aj.cta_desc')}</p>
          <div className="mt-6 grid sm:grid-cols-1 max-w-md mx-auto">
            <Link href={{ pathname: '/contacto', query: { topic: 'support', from: '/ajuda' } } as any}
              className="rounded-2xl p-6 hover:shadow-lg transition-all group" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
              <Mail className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform" style={{ color: 'var(--accent)' }} />
              <div className="font-bold" style={{ color: 'var(--ink)' }}>{t('aj.send_msg')}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--ink-3)' }}>{t('aj.send_sub')}</div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
