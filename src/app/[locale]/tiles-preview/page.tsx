import { Code, BarChart3, Palette, Megaphone, Briefcase, Sparkles, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const dynamic = 'force-static';

type Cat = { name: string; count: string; Icon: LucideIcon };
const CATS: Cat[] = [
  { name: 'Programação', count: '54+ cursos', Icon: Code },
  { name: 'Data & Analytics', count: '38+ cursos', Icon: BarChart3 },
  { name: 'Design & UX', count: '27+ cursos', Icon: Palette },
  { name: 'Marketing & Growth', count: '22+ cursos', Icon: Megaphone },
  { name: 'Negócios & Gestão', count: '31+ cursos', Icon: Briefcase },
  { name: 'IA Aplicada', count: '19+ cursos', Icon: Sparkles },
];

type V = 'brand-tl' | 'neutral-tl' | 'inline' | 'corner' | 'circle' | 'arrow';

function Tag({ children }: { children: React.ReactNode }) {
  return <div className="max-w-3xl mx-auto px-4 pt-10 pb-3"><span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">{children}</span></div>;
}

function Card({ c, v }: { c: Cat; v: V }) {
  const base = 'relative rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md hover:border-brand-200 transition-all';
  if (v === 'inline') {
    return (
      <div className={base}>
        <div className="flex items-center gap-2.5">
          <c.Icon className="h-5 w-5 text-brand-600 shrink-0" strokeWidth={1.75} />
          <div className="t-h3 text-slate-900 leading-tight">{c.name}</div>
        </div>
        <div className="text-sm text-slate-500 mt-2">{c.count}</div>
      </div>
    );
  }
  if (v === 'corner') {
    return (
      <div className={base}>
        <c.Icon className="absolute top-5 right-5 h-5 w-5 text-brand-500" strokeWidth={1.75} />
        <div className="t-h3 text-slate-900 leading-tight pr-8">{c.name}</div>
        <div className="text-sm text-slate-500 mt-2">{c.count}</div>
      </div>
    );
  }
  if (v === 'circle') {
    return (
      <div className={base}>
        <div className="h-9 w-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-4"><c.Icon className="h-[18px] w-[18px]" strokeWidth={1.75} /></div>
        <div className="t-h3 text-slate-900 leading-tight">{c.name}</div>
        <div className="text-sm text-slate-500 mt-1">{c.count}</div>
      </div>
    );
  }
  if (v === 'arrow') {
    return (
      <div className={base}>
        <c.Icon className="h-6 w-6 text-brand-600 mb-4" strokeWidth={1.75} />
        <div className="t-h3 text-slate-900 leading-tight">{c.name}</div>
        <div className="text-sm text-slate-500 mt-1">{c.count}</div>
        <ArrowUpRight className="absolute bottom-5 right-5 h-4 w-4 text-slate-300" />
      </div>
    );
  }
  // brand-tl / neutral-tl
  const tone = v === 'neutral-tl' ? 'text-slate-400' : 'text-brand-600';
  return (
    <div className={base}>
      <c.Icon className={`h-6 w-6 ${tone} mb-4`} strokeWidth={1.75} />
      <div className="t-h3 text-slate-900 leading-tight">{c.name}</div>
      <div className="text-sm text-slate-500 mt-1">{c.count}</div>
    </div>
  );
}

function Grid({ v }: { v: V }) {
  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="grid grid-cols-2 gap-4">{CATS.map((c) => <Card key={c.name} c={c} v={v} />)}</div>
    </div>
  );
}

export default function TilesPreview() {
  return (
    <main className="bg-white pb-20">
      <Tag>A — Ícone topo-esq · marca</Tag>
      <Grid v="brand-tl" />
      <Tag>B — Ícone topo-esq · neutro</Tag>
      <Grid v="neutral-tl" />
      <Tag>C — Ícone em linha (antes do nome)</Tag>
      <Grid v="inline" />
      <Tag>D — Ícone no canto sup. direito</Tag>
      <Grid v="corner" />
      <Tag>E — Ícone em círculo suave de marca</Tag>
      <Grid v="circle" />
      <Tag>F — Ícone topo + seta (afford.)</Tag>
      <Grid v="arrow" />
      <div className="max-w-3xl mx-auto px-4 pt-12 text-center text-sm text-slate-400">Escolhe a letra (A–F).</div>
    </main>
  );
}
