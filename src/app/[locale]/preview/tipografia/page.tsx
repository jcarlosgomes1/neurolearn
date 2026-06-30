// Preview isolado — comparação da escala da HOME atual (tokens t-*) vs páginas que usam text-* cru.
// Não ligado a produção. Objetivo: validar a adoção dos tokens de marca já existentes.
export const dynamic = 'force-static';

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-10">
        <header>
          <div className="text-xs font-semibold uppercase tracking-wide text-violet-600">Preview · Fase B · Tipografia</div>
          <h1 className="t-h1 mt-1 text-slate-900">Escala da marca vs. páginas inconsistentes</h1>
          <p className="mt-2 text-sm text-slate-500">A home já usa tokens (Fraunces, fluido). A proposta é adotar os mesmos tokens onde hoje se usa <code className="text-violet-600">text-*</code> cru. Nada de inventar tamanhos.</p>
        </header>

        {/* HOME ATUAL — referência correta */}
        <section className="rounded-2xl border border-emerald-200 bg-white p-5 sm:p-7 shadow-sm">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">HOME ATUAL · usa tokens · referência</div>
          <h1 className="t-display text-slate-900" style={{ color: 'var(--ink)' }}>Aprende sem limites</h1>
          <p className="mt-3 max-w-xl text-base text-slate-600">Cursos e percursos guiados para chegares ao nível seguinte, ao teu ritmo.</p>
          <h2 className="t-h2 mt-10 text-slate-900">O que vais aprender</h2>
          <h3 className="t-h3 mt-4 text-slate-800">Fundamentos de SQL</h3>
          <p className="mt-1 text-base text-slate-600">Consultas, junções e agregações sobre dados reais.</p>
          <div className="mt-6 grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
            <div><code className="text-emerald-700">t-display</code> → clamp(2.5rem → 4.25rem) · Fraunces</div>
            <div><code className="text-emerald-700">t-h1</code> → clamp(1.5rem → 1.875rem)</div>
            <div><code className="text-emerald-700">t-h2</code> → clamp(1.375rem → 1.75rem)</div>
            <div><code className="text-emerald-700">t-h3</code> → clamp(1.06rem → 1.25rem)</div>
          </div>
        </section>

        {/* PÁGINA INCONSISTENTE — o problema */}
        <section className="rounded-2xl border border-rose-200 bg-white p-5 sm:p-7 shadow-sm">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">OUTRAS PÁGINAS · text-* cru · o problema</div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-rose-500">Antes (text-* cru)</div>
              {/* fonte sans, tamanho fixo, sem o tracking/line-height da marca */}
              <div className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Aprende sem limites</div>
              <div className="mt-6 text-sm font-bold text-slate-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Continuar a aprender</div>
              <p className="text-sm text-slate-600">…cabeçalho do mesmo tamanho que o corpo (108 casos assim).</p>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Depois (tokens)</div>
              <div className="t-display text-slate-900" style={{ fontSize: 'var(--t-h1)' }}>Aprende sem limites</div>
              <h2 className="t-h2 mt-6 text-slate-900">Continuar a aprender</h2>
              <p className="text-base text-slate-600">Cabeçalho claramente acima do corpo, com a fonte e o ritmo da marca.</p>
            </div>
          </div>
        </section>

        {/* PROPOSTA */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
          <h2 className="t-h2 mb-3 text-slate-900">Proposta</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Cabeçalhos passam a usar <code className="text-violet-600">t-display / t-h1 / t-h2 / t-h3</code> — os tokens que a home já usa.</li>
            <li>• Remover tamanhos crus (<code>text-2xl/3xl/...</code>) e <strong>nunca</strong> um cabeçalho em <code>text-sm</code> (os 108 casos).</li>
            <li>• Faseado, começando pelas páginas mais visíveis. Preview antes de alargar.</li>
            <li>• Zero invenção: é a identidade que já existe, aplicada de forma consistente.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
