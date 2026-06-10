import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { Rocket, Sparkles, Zap, Bug, Plus, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Changelog · NeuroLearn', description: 'O que mudou, o que melhorámos, o que está a caminho.' };

const RELEASES = [
  { dateKey: 'cl.d_jun26', version: 'v2.6', items: [
    { type: 'new', textKey: 'cl.r1' },
    { type: 'new', textKey: 'cl.r2' },
    { type: 'new', textKey: 'cl.r3' },
    { type: 'improve', textKey: 'cl.r4' },
  ]},
  { dateKey: 'cl.d_mai26', version: 'v2.5', items: [
    { type: 'new', textKey: 'cl.r5' },
    { type: 'new', textKey: 'cl.r6' },
    { type: 'new', textKey: 'cl.r7' },
    { type: 'fix', textKey: 'cl.r8' },
  ]},
  { dateKey: 'cl.d_abr26', version: 'v2.4', items: [
    { type: 'new', textKey: 'cl.r9' },
    { type: 'new', textKey: 'cl.r10' },
    { type: 'improve', textKey: 'cl.r11' },
  ]},
  { dateKey: 'cl.d_mar26', version: 'v2.3', items: [
    { type: 'new', textKey: 'cl.r12' },
    { type: 'new', textKey: 'cl.r13' },
    { type: 'new', textKey: 'cl.r14' },
  ]},
];

const TYPE_META: Record<string, { labelKey: string; cls: string; icon: any }> = {
  new:     { labelKey: 'cl.type_new',     cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Plus },
  improve: { labelKey: 'cl.type_improve', cls: 'bg-blue-100 text-blue-700 border-blue-200', icon: Sparkles },
  fix:     { labelKey: 'cl.type_fix',     cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: Bug },
};

export default async function Page() {
  const t = await getTranslations();
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.2),transparent_60%)]" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
            <Rocket className="h-12 w-12 mx-auto mb-5 text-violet-400" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">{t('cl.h1')}</h1>
            <p className="text-lg text-slate-300 max-w-xl mx-auto">{t('cl.hero_sub')}</p>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
            {RELEASES.map(r => (
              <article key={r.version} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white items-center justify-center font-bold text-xs">
                      {r.version.replace('v','')}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{r.version}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">{t(r.dateKey)}</div>
                    </div>
                  </div>
                </div>
                <ul className="divide-y divide-slate-100">
                  {r.items.map((item, i) => {
                    const meta = TYPE_META[item.type];
                    const Icon = meta.icon;
                    return (
                      <li key={i} className="flex items-start gap-3 px-6 py-3">
                        <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider flex-shrink-0 mt-0.5 ${meta.cls}`}>
                          <Icon className="h-2.5 w-2.5" /> {t(meta.labelKey)}
                        </span>
                        <span className="text-sm text-slate-700 leading-relaxed">{t(item.textKey)}</span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="py-16 bg-slate-50">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <Zap className="h-10 w-10 mx-auto mb-4 text-violet-600" />
            <h2 className="text-2xl font-bold text-slate-900 mb-3">{t('cl.suggest_h')}</h2>
            <p className="text-sm text-slate-600 mb-6">{t('cl.suggest_p')}</p>
            <Link href={'/contacto' as any} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl">
              {t('cl.suggest_btn')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}
