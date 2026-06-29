import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const ITEMS = ['Cursos', 'Percursos', 'Essentials', 'Mentores', 'Empresas', 'Blog'];

export default async function Page() {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }} className="pb-24">
      <div className="mx-auto px-6 py-8" style={{ maxWidth: 'var(--page-max, 80rem)' }}>
        <h1 className="t-h2 mb-2" style={{ color: 'var(--ink)' }}>Estilos de menu — só texto</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--ink-2)' }}>3 variantes premium horizontais. Compara com o atual (ícone+label vertical).</p>
      </div>

      {/* A — Texto simples, sublinhado no ativo (Stripe/Linear) */}
      <div className="mb-1 px-6 mx-auto" style={{ maxWidth: 'var(--page-max, 80rem)' }}>
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>A · Texto simples, sublinhado fino no ativo</div>
      </div>
      <header className="border-y mb-10" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
        <div className="mx-auto px-6 h-16 flex items-center justify-between" style={{ maxWidth: 'var(--page-max, 80rem)' }}>
          <span className="font-bold text-lg" style={{ color: 'var(--ink)' }}>● NeuroLearn</span>
          <nav className="hidden md:flex items-center gap-1">
            {ITEMS.map((it, i) => (
              <span key={it} className="relative px-3.5 py-2 text-sm font-medium cursor-pointer transition-colors" style={{ color: i === 0 ? 'var(--accent)' : 'var(--ink-2)' }}>
                {it}
                {i === 0 && <span className="absolute -bottom-[1px] left-3.5 right-3.5 h-[2px] rounded-full" style={{ background: 'var(--accent)' }} />}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>Entrar</span>
            <span className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--accent)' }}>Começar</span>
          </div>
        </div>
      </header>

      {/* B — Texto com pílula no ativo (Vercel) */}
      <div className="mb-1 px-6 mx-auto" style={{ maxWidth: 'var(--page-max, 80rem)' }}>
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>B · Texto com pílula suave no ativo/hover</div>
      </div>
      <header className="border-y mb-10" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
        <div className="mx-auto px-6 h-16 flex items-center justify-between" style={{ maxWidth: 'var(--page-max, 80rem)' }}>
          <span className="font-bold text-lg" style={{ color: 'var(--ink)' }}>● NeuroLearn</span>
          <nav className="hidden md:flex items-center gap-1">
            {ITEMS.map((it, i) => (
              <span key={it} className="px-3.5 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors" style={ i === 0 ? { color: 'var(--accent)', background: 'var(--accent-tint)' } : { color: 'var(--ink-2)' }}>
                {it}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>Entrar</span>
            <span className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--accent)' }}>Começar</span>
          </div>
        </div>
      </header>

      {/* C — Texto minimalista, centrado, leve (Framer/editorial) */}
      <div className="mb-1 px-6 mx-auto" style={{ maxWidth: 'var(--page-max, 80rem)' }}>
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>C · Minimalista, nav centrado, mais leve</div>
      </div>
      <header className="border-y" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
        <div className="mx-auto px-6 h-16 grid grid-cols-[1fr_auto_1fr] items-center" style={{ maxWidth: 'var(--page-max, 80rem)' }}>
          <span className="font-bold text-lg" style={{ color: 'var(--ink)' }}>● NeuroLearn</span>
          <nav className="hidden md:flex items-center gap-6 justify-center">
            {ITEMS.map((it, i) => (
              <span key={it} className="text-[15px] cursor-pointer transition-colors" style={{ color: i === 0 ? 'var(--ink)' : 'var(--ink-3)', fontWeight: i === 0 ? 600 : 500 }}>
                {it}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-3 justify-end">
            <span className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>Entrar</span>
            <span className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--accent)' }}>Começar</span>
          </div>
        </div>
      </header>
    </div>
  );
}
