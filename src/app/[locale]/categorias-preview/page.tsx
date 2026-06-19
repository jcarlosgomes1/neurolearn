import type { LucideIcon } from 'lucide-react';
import { Code, BarChart3, Palette, Megaphone, Briefcase, Sparkles, Globe2, Heart } from 'lucide-react';

export const dynamic = 'force-static';

const CATS: { name: string; count: string; Icon: LucideIcon; cls: string }[] = [
  { name: 'Programação', count: '54+ cursos', Icon: Code, cls: 'from-violet-500 to-indigo-600' },
  { name: 'Data & Analytics', count: '38+ cursos', Icon: BarChart3, cls: 'from-blue-500 to-cyan-600' },
  { name: 'Design & UX', count: '27+ cursos', Icon: Palette, cls: 'from-fuchsia-500 to-pink-600' },
  { name: 'Marketing & Growth', count: '22+ cursos', Icon: Megaphone, cls: 'from-amber-500 to-orange-600' },
  { name: 'Negócios & Gestão', count: '31+ cursos', Icon: Briefcase, cls: 'from-emerald-500 to-teal-600' },
  { name: 'IA Aplicada', count: '19+ cursos', Icon: Sparkles, cls: 'from-purple-500 to-violet-600' },
  { name: 'Línguas', count: '12+ cursos', Icon: Globe2, cls: 'from-rose-500 to-red-600' },
  { name: 'Bem-estar', count: '9+ cursos', Icon: Heart, cls: 'from-pink-500 to-rose-600' },
];

function Tag({ children }: { children: React.ReactNode }) {
  return <div className="max-w-6xl mx-auto px-4 pt-10 pb-3"><span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">{children}</span></div>;
}

function Grid({ tile }: { tile: (c: typeof CATS[number]) => React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-4 pb-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {CATS.map((c) => (
          <div key={c.name} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-brand-200 transition-all">
            {tile(c)}
            <div className="mt-4 font-semibold text-slate-900 leading-tight">{c.name}</div>
            <div className="text-xs text-slate-500 mt-1">{c.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CategoriasPreview() {
  return (
    <main className="bg-white min-h-screen pb-20">
      {/* A — atual multicolor */}
      <Tag>Variante A — Atual (multicolor)</Tag>
      <Grid tile={(c) => (
        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${c.cls} text-white flex items-center justify-center shadow-sm`}>
          <c.Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
      )} />

      {/* B — marca contido */}
      <Tag>Variante B — Marca (contido)</Tag>
      <Grid tile={(c) => (
        <div className="h-14 w-14 rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 flex items-center justify-center">
          <c.Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
      )} />

      {/* C — editorial mínimo */}
      <Tag>Variante C — Editorial (mínimo)</Tag>
      <Grid tile={(c) => (
        <c.Icon className="h-8 w-8 text-brand-600" strokeWidth={1.5} />
      )} />

      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-sm text-slate-400">Escolhe A, B ou C.</div>
    </main>
  );
}
