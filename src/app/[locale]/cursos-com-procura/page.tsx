import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { getTranslations } from 'next-intl/server';
import { Sparkles } from 'lucide-react';
import { DemandClient } from './DemandClient';

export const metadata = { title: 'Cursos com Procura · NeuroLearn' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const t = await getTranslations();
  const sb = await createClient();
  const { data } = await sb.rpc('nl_course_demand_list');
  const demand = ((data as { demand?: unknown[] })?.demand || []) as never[];

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <section className="bg-gradient-to-br from-fuchsia-700 to-violet-800 text-white">
          <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-6 w-6" />
              <span className="text-sm font-semibold uppercase tracking-wider text-fuchsia-200">{t('demand.badge')}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-3">{t('demand.h1')}</h1>
            <p className="text-lg text-fuchsia-100 max-w-2xl">{t('demand.sub')}</p>
          </div>
        </section>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <DemandClient initial={demand} />
        </div>
      </main>
    </>
  );
}
