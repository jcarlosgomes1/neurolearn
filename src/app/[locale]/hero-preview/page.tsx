import type { ReactNode } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export const dynamic = 'force-static';

const S = {
  badge: 'Sobre a NeuroLearn',
  pre: 'Aprender de forma ',
  accent: 'mais humana',
  subtitle: 'Uma plataforma que junta pessoas, conhecimento e oportunidades — desenhada para resultados reais.',
};

function Badge({ children, tone = 'light' }: { children: ReactNode; tone?: 'light' | 'dark' }) {
  return tone === 'dark' ? (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/25 text-xs font-semibold text-white mb-5 backdrop-blur-sm">{children}</div>
  ) : (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-brand-200 text-xs font-semibold text-brand-700 mb-5 shadow-sm">{children}</div>
  );
}

function Cta({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <div className="mt-7 flex flex-wrap gap-3">
      <span className={tone === 'dark' ? 'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-700 font-bold shadow-lg' : 'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold shadow-lg'}>Explorar <ArrowRight className="h-4 w-4" /></span>
      <span className={tone === 'dark' ? 'inline-flex items-center px-5 py-2.5 rounded-xl border border-white/30 text-white font-bold' : 'inline-flex items-center px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold'}>Saber mais</span>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <div className="max-w-6xl mx-auto px-4 pt-8 pb-2"><span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">{children}</span></div>;
}

export default function HeroPreviewPage() {
  return (
    <main className="bg-white">
      {/* VARIANTE 1 — Aurora */}
      <Tag>Variante 1 — Aurora</Tag>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100/40 border-y border-slate-200/60">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-[10%] h-96 w-96 rounded-full bg-brand-400/30 blur-3xl animate-pulse" />
          <div className="absolute top-8 right-[8%] h-80 w-80 rounded-full bg-brand-300/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: 'radial-gradient(60% 55% at 50% 0%, rgb(var(--brand-400) / 0.18), transparent 70%)' }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
          <Badge><Sparkles className="h-3.5 w-3.5" /> {S.badge}</Badge>
          <h1 className="t-h1 text-slate-900 text-balance">{S.pre}<span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">{S.accent}</span></h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">{S.subtitle}</p>
          <div className="flex justify-center"><Cta /></div>
        </div>
      </section>

      {/* VARIANTE 2 — Grelha premium */}
      <Tag>Variante 2 — Grelha premium</Tag>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 to-white border-y border-slate-200/60">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ backgroundImage: 'linear-gradient(to right, rgb(var(--brand-500) / 0.10) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--brand-500) / 0.10) 1px, transparent 1px)', backgroundSize: '34px 34px', maskImage: 'radial-gradient(ellipse 70% 60% at 30% 0%, black, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 30% 0%, black, transparent 80%)' }} />
        <div aria-hidden className="pointer-events-none absolute -top-20 right-[12%] h-72 w-72 rounded-full bg-brand-400/20 blur-3xl -z-10" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <Badge><Sparkles className="h-3.5 w-3.5" /> {S.badge}</Badge>
          <h1 className="t-h1 text-slate-900 text-balance max-w-3xl">{S.pre}<span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">{S.accent}</span></h1>
          <div className="mt-5 h-1 w-24 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl">{S.subtitle}</p>
          <Cta />
        </div>
      </section>

      {/* VARIANTE 3 — Faixa de marca */}
      <Tag>Variante 3 — Faixa de marca (impacto)</Tag>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, rgb(255 255 255 / 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.06) 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(ellipse 80% 70% at 70% 0%, black, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 70% 0%, black, transparent 80%)' }} />
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-brand-300/20 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <Badge tone="dark"><Sparkles className="h-3.5 w-3.5" /> {S.badge}</Badge>
          <h1 className="t-h1 text-white text-balance max-w-3xl">{S.pre}<span className="bg-gradient-to-r from-white to-brand-200 bg-clip-text text-transparent">{S.accent}</span></h1>
          <p className="mt-5 text-base sm:text-lg text-brand-50/90 max-w-2xl">{S.subtitle}</p>
          <Cta tone="dark" />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-sm text-slate-400">Escolhe 1, 2 ou 3 — replico em todas as páginas.</div>
    </main>
  );
}
