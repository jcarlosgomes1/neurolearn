import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { Package, Star, BookOpen } from 'lucide-react';

export const metadata = { title: 'Bundles · NeuroLearn' };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data } = await sb.rpc('nl_bundles_public_list');
  const bundles = (data as any)?.bundles || [];
  
  function fmt(c: number, cur = 'EUR') { return new Intl.NumberFormat(locale, { style: 'currency', currency: cur }).format(c/100); }

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <section className="bg-gradient-to-br from-brand-700 to-violet-800 text-white">
          <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-6 w-6" />
              <span className="text-sm font-semibold uppercase tracking-wider text-brand-200">{t('bn.badge')}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-3">{t('bn.h1')}</h1>
            <p className="text-lg text-brand-100 max-w-2xl">{t('bn.sub')}</p>
          </div>
        </section>
        <div className="max-w-5xl mx-auto px-4 py-8">
          {bundles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">{t('bn.empty')}</h3>
              <Link href={'/cursos' as any} className="text-sm text-brand-600 hover:underline">{t('bn.see_individual')} →</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bundles.map((b: any) => (
                <div key={b.id} className={`bg-white border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow ${b.featured ? 'border-amber-300 ring-2 ring-amber-200' : 'border-slate-200'}`}>
                  <div className="aspect-video bg-gradient-to-br from-brand-100 to-violet-100 flex items-center justify-center text-5xl relative">
                    {b.cover_url ? <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" /> : '📦'}
                    {b.discount_pct > 0 && <span className="absolute top-2 right-2 px-2 py-1 bg-rose-500 text-white text-xs font-bold rounded">−{Math.round(b.discount_pct)}%</span>}
                    {b.featured && <Star className="absolute top-2 left-2 h-5 w-5 fill-amber-400 text-amber-400" />}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{b.title}</h3>
                    {b.description && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{b.description}</p>}
                    <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> {t('bn.courses', { count: b.course_ids?.length || 0 })}
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-2xl font-bold text-slate-900">{fmt(b.price_cents, b.currency)}</span>
                      {b.original_total_cents > b.price_cents && <span className="text-sm text-slate-400 line-through">{fmt(b.original_total_cents, b.currency)}</span>}
                    </div>
                    <button disabled className="w-full px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg opacity-60 cursor-not-allowed">
                      {t('bn.soon_stripe')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
