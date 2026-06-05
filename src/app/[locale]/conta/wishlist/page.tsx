import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Header } from '@/components/layout/Header';
import { Heart, Star } from 'lucide-react';

export const metadata = { title: 'Wishlist · Conta' };
export const dynamic = 'force-dynamic';

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(cents / 100);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: rpc } = await sb.rpc('nl_wishlist_list');
  const wishlist = (rpc as any)?.ok ? (rpc as any).wishlist : [];
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Heart className="h-6 w-6 text-rose-500" /> Os meus favoritos
            </h1>
            <p className="text-sm text-slate-500 mt-1">{wishlist.length} curso{wishlist.length === 1 ? '' : 's'} guardado{wishlist.length === 1 ? '' : 's'}.</p>
          </div>
        </section>
        <div className="max-w-5xl mx-auto px-4 py-6">
          {wishlist.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Heart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Lista vazia</h3>
              <p className="text-sm text-slate-500 mb-4">Guarda cursos que queres ver mais tarde.</p>
              <Link href={'/cursos' as any} className="inline-block px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm rounded-lg">Explorar cursos</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlist.map((c: any) => (
                <Link key={c.id} href={`/curso/${c.id}` as any} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md">
                  <div className="aspect-video bg-gradient-to-br from-brand-100 to-violet-100 flex items-center justify-center text-5xl">
                    {c.cover_url ? <img src={c.cover_url} alt={c.title} className="w-full h-full object-cover" /> : (c.emoji || '📘')}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 line-clamp-2 mb-1">{c.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      {c.rating_avg && <><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{Number(c.rating_avg).toFixed(1)}</>}
                    </div>
                    <div className="text-lg font-bold text-slate-900">{fmt(c.price_cents, c.currency)}</div>
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
