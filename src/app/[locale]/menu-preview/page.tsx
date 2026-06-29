import { getTranslations } from 'next-intl/server';
import { Search, Bell, GraduationCap, ChevronDown } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const NAV = ['Cursos', 'Percursos', 'Essentials', 'Mentores', 'Empresas', 'Blog'];

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>N</div>
      <span className="font-bold text-lg" style={{ color: 'var(--ink)' }}>NeuroLearn</span>
    </div>
  );
}

function CTA() {
  return (
    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))' }}>
      <GraduationCap className="h-4 w-4" /> Ensina connosco
    </span>
  );
}

function Avatar() {
  return <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--accent)' }}>J</div>;
}

export default async function Page() {
  await getTranslations();
  return (
    <div style={{ background: 'var(--paper)' }} className="min-h-screen pb-24">
      <div className="mx-auto px-4 py-8" style={{ maxWidth: 'var(--page-max, 80rem)' }}>
        <h1 className="t-h2 mb-2" style={{ color: 'var(--ink)' }}>Estilos de menu — só texto, horizontal</h1>
        <p className="mb-8 text-sm" style={{ color: 'var(--ink-2)' }}>Compara com o atual (ícone + label). Todos a 7xl, tokens da marca. Escolhe A, B ou C.</p>
      </div>

      {/* ATUAL (referência) */}
      <div className="mb-10">
        <div className="mx-auto px-4 mb-2 text-xs font-bold uppercase tracking-widest" style={{ maxWidth: 'var(--page-max, 80rem)', color: 'var(--ink-3)' }}>Atual · ícone + label</div>
        <div className="border-y" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
          <div className="mx-auto w-full px-4 h-16 flex items-center justify-between gap-3" style={{ maxWidth: 'var(--page-max, 80rem)' }}>
            <Brand />
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map((n) => (
                <div key={n} className="flex flex-col items-center px-2.5 py-1 rounded-lg cursor-pointer" style={{ color: 'var(--ink-2)' }}>
                  <div className="h-4 w-4 rounded" style={{ background: 'var(--line)' }} />
                  <span className="text-[11px] mt-0.5">{n}</span>
                </div>
              ))}
            </nav>
            <div className="flex items-center gap-2"><Search className="h-5 w-5" style={{ color: 'var(--ink-3)' }} /><Bell className="h-5 w-5" style={{ color: 'var(--ink-3)' }} /><CTA /><Avatar /></div>
          </div>
        </div>
      </div>

      {/* A — texto simples + sublinhado fino no ativo (Stripe/Linear) */}
      <div className="mb-10">
        <div className="mx-auto px-4 mb-2 text-xs font-bold uppercase tracking-widest" style={{ maxWidth: 'var(--page-max, 80rem)', color: 'var(--accent)' }}>A · texto simples + sublinhado no ativo</div>
        <div className="border-y" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
          <div className="mx-auto w-full px-4 h-16 flex items-center justify-between gap-6" style={{ maxWidth: 'var(--page-max, 80rem)' }}>
            <Brand />
            <nav className="hidden md:flex items-center gap-7">
              {NAV.map((n, i) => (
                <span key={n} className="relative text-sm font-medium cursor-pointer py-5" style={{ color: i === 0 ? 'var(--ink)' : 'var(--ink-2)' }}>
                  {n}
                  {i === 0 && <span className="absolute left-0 right-0 bottom-0 h-0.5 rounded-full" style={{ background: 'var(--accent)' }} />}
                </span>
              ))}
            </nav>
            <div className="flex items-center gap-3"><Search className="h-5 w-5" style={{ color: 'var(--ink-3)' }} /><Bell className="h-5 w-5" style={{ color: 'var(--ink-3)' }} /><CTA /><Avatar /></div>
          </div>
        </div>
      </div>

      {/* B — texto com pill suave no ativo/hover (Vercel) */}
      <div className="mb-10">
        <div className="mx-auto px-4 mb-2 text-xs font-bold uppercase tracking-widest" style={{ maxWidth: 'var(--page-max, 80rem)', color: 'var(--accent)' }}>B · texto com pill suave no ativo/hover</div>
        <div className="border-y" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
          <div className="mx-auto w-full px-4 h-16 flex items-center justify-between gap-6" style={{ maxWidth: 'var(--page-max, 80rem)' }}>
            <Brand />
            <nav className="hidden md:flex items-center gap-1.5">
              {NAV.map((n, i) => (
                <span key={n} className="text-sm font-medium cursor-pointer px-3 py-1.5 rounded-lg transition-colors" style={i === 0 ? { color: 'var(--accent)', background: 'var(--accent-tint)' } : { color: 'var(--ink-2)' }}>
                  {n}
                </span>
              ))}
            </nav>
            <div className="flex items-center gap-3"><Search className="h-5 w-5" style={{ color: 'var(--ink-3)' }} /><Bell className="h-5 w-5" style={{ color: 'var(--ink-3)' }} /><CTA /><Avatar /></div>
          </div>
        </div>
      </div>

      {/* C — minimalista, nav centrada, mais leve (Framer/editorial) */}
      <div className="mb-10">
        <div className="mx-auto px-4 mb-2 text-xs font-bold uppercase tracking-widest" style={{ maxWidth: 'var(--page-max, 80rem)', color: 'var(--accent)' }}>C · minimalista, nav centrada</div>
        <div className="border-y" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
          <div className="mx-auto w-full px-4 h-16 grid grid-cols-3 items-center" style={{ maxWidth: 'var(--page-max, 80rem)' }}>
            <Brand />
            <nav className="hidden md:flex items-center justify-center gap-8">
              {NAV.map((n, i) => (
                <span key={n} className="text-sm cursor-pointer" style={{ color: i === 0 ? 'var(--ink)' : 'var(--ink-3)', fontWeight: i === 0 ? 600 : 500 }}>{n}</span>
              ))}
            </nav>
            <div className="flex items-center justify-end gap-3"><Search className="h-5 w-5" style={{ color: 'var(--ink-3)' }} /><CTA /><Avatar /></div>
          </div>
        </div>
      </div>

      <div className="text-center text-xs pt-4" style={{ color: 'var(--ink-3)' }}>preview · não toca no header real</div>
    </div>
  );
}
