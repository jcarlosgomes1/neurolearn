// Preview isolado — escala tipográfica proposta (Fase B). Não ligado a produção.
export const dynamic = 'force-static';

function Row({ level, cls, sample }: { level: string; cls: string; sample: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-4 sm:flex-row sm:items-baseline sm:gap-6">
      <div className="w-40 shrink-0">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{level}</div>
        <code className="text-[11px] text-violet-600">{cls}</code>
      </div>
      <div className={`text-slate-900 ${cls}`}>{sample}</div>
    </div>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <div className="text-xs font-semibold uppercase tracking-wide text-violet-600">Preview · Fase B</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Escala tipográfica proposta</h1>
          <p className="mt-2 text-sm text-slate-500">Um tamanho por nível, coerente em toda a app. Valida o aspeto antes de aplicar.</p>
        </header>

        {/* Referência da escala */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
          <h2 className="mb-2 text-xl font-bold text-slate-900 sm:text-2xl">Referência</h2>
          <Row level="H1 (título)" cls="text-3xl sm:text-4xl font-bold tracking-tight" sample="Os teus cursos" />
          <Row level="H1 hero" cls="text-4xl sm:text-5xl font-bold tracking-tight" sample="Aprende sem limites" />
          <Row level="H2 (secção)" cls="text-xl sm:text-2xl font-bold" sample="Continuar a aprender" />
          <Row level="H3 (subsecção)" cls="text-lg font-semibold" sample="Módulo 3 · Fundamentos" />
          <Row level="Corpo" cls="text-sm sm:text-base" sample="Texto normal de leitura, parágrafos e descrições." />
          <Row level="Legenda" cls="text-xs text-slate-500" sample="Metadados, datas, rótulos secundários" />
        </section>

        {/* Aplicação realista */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-slate-900 sm:text-2xl">Como lê numa página real</h2>
          <div className="rounded-xl border border-slate-200 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-violet-600">Percurso</div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Análise de Dados</h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">Do zero a júnior: SQL, Python e visualização, com projetos reais.</p>

            <h2 className="mt-8 text-xl font-bold text-slate-900 sm:text-2xl">O que vais aprender</h2>
            <h3 className="mt-4 text-lg font-semibold text-slate-800">1 · Fundamentos de SQL</h3>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">Consultas, junções e agregações sobre dados reais.</p>
            <p className="mt-3 text-xs text-slate-400">8 aulas · 2h 15m · Nível inicial</p>
          </div>
        </section>

        {/* Regra */}
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:p-6">
          <h2 className="mb-2 text-lg font-bold text-rose-800">Regra: um cabeçalho nunca é mais pequeno que o corpo</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-rose-200 bg-white p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">Antes (108 casos)</div>
              <div className="mt-1 text-sm font-bold text-slate-900">Continuar a aprender</div>
              <p className="text-sm text-slate-600">…fica do mesmo tamanho que isto. Sem hierarquia.</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-white p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Depois</div>
              <div className="mt-1 text-xl font-bold text-slate-900">Continuar a aprender</div>
              <p className="text-sm text-slate-600">Cabeçalho claramente acima do corpo.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
