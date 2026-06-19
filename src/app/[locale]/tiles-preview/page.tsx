import { Code, BarChart3, Palette, Megaphone, Briefcase, Sparkles, Globe2, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const dynamic = 'force-static';

type Cat = { name: string; count: string; Icon: LucideIcon; cls: string };
const CATS: Cat[] = [
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
  return <div className="max-w-3xl mx-auto px-4 pt-10 pb-3"><span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">{children}</span></div>;
}

function Tile({ c, kind }: { c: Cat; kind: 'multicolor' | 'brand' | 'ghost' }) {
  if (kind === 'multicolor') return <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${c.cls} text-white flex items-center justify-center shadow-sm`}><c.Icon className="h-7 w-7" strokeWidth={1.75} /></div>;
  if (kind === 'brand') return <div className="h-14 w-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center ring-1 ring-brand-100"><c.Icon className="h-7 w-7" strokeWidth={1.75} /></div>;
  return <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center"><c.Icon className="h-6 w-6" strokeWidth={1.75} /></div>;
}

function Grid({ kind }: { kind: 'multicolor' | 'brand' | 'ghost' }) {
  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="grid grid-cols-2 gap-4">
        {CATS.slice(0, 6).map((c) => (
          <div key={c.name} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-brand-200 transition-all">
            <Tile c={c} kind={kind} />
            <div className="mt-4 font-semibold text-slate-900 leading-tight">{c.name}</div>
            <div className="text-sm text-slate-500 mt-1">{c.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TilesPreview() {
  return (
    <main className="bg-white pb-20">
      <Tag>Variante 1 — Atual (multicolor)</Tag>
      <Grid kind="multicolor" />
      <Tag>Variante 2 — Marca contido (recomendado)</Tag>
      <Grid kind="brand" />
      <Tag>Variante 3 — Ghost / linha</Tag>
      <Grid kind="ghost" />
      <div className="max-w-3xl mx-auto px-4 pt-12 text-center text-sm text-slate-400">Escolhe 1, 2 ou 3.</div>
    </main>
  );
}
