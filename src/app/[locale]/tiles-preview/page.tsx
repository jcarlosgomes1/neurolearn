import { Code, BarChart3, Palette, Megaphone, Briefcase, Sparkles, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const dynamic = 'force-static';

type Cat = { name: string; count: string; Icon: LucideIcon; cls: string; img: string };
const CATS: Cat[] = [
  { name: 'Programação', count: '54+ cursos', Icon: Code, cls: 'from-violet-500 to-indigo-600', img: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=600&h=360&fit=crop&q=70' },
  { name: 'Data & Analytics', count: '38+ cursos', Icon: BarChart3, cls: 'from-blue-500 to-cyan-600', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=360&fit=crop&q=70' },
  { name: 'Design & UX', count: '27+ cursos', Icon: Palette, cls: 'from-fuchsia-500 to-pink-600', img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=360&fit=crop&q=70' },
  { name: 'Marketing & Growth', count: '22+ cursos', Icon: Megaphone, cls: 'from-amber-500 to-orange-600', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=360&fit=crop&q=70' },
  { name: 'Negócios & Gestão', count: '31+ cursos', Icon: Briefcase, cls: 'from-emerald-500 to-teal-600', img: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&h=360&fit=crop&q=70' },
  { name: 'IA Aplicada', count: '19+ cursos', Icon: Sparkles, cls: 'from-purple-500 to-violet-600', img: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&h=360&fit=crop&q=70' },
];

type Kind = 'multicolor' | 'brand' | 'icon' | 'type' | 'image';

function Tag({ children }: { children: React.ReactNode }) {
  return <div className="max-w-3xl mx-auto px-4 pt-10 pb-3"><span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">{children}</span></div>;
}

function Card({ c, kind }: { c: Cat; kind: Kind }) {
  if (kind === 'image') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-all">
        <img src={c.img} alt="" className="h-28 w-full object-cover" />
        <div className="p-4">
          <div className="font-semibold text-slate-900 leading-tight">{c.name}</div>
          <div className="text-sm text-slate-500 mt-1">{c.count}</div>
        </div>
      </div>
    );
  }
  if (kind === 'type') {
    return (
      <div className="relative rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md hover:border-brand-200 transition-all">
        <ArrowUpRight className="absolute top-4 right-4 h-5 w-5 text-slate-300" />
        <div className="t-h3 text-slate-900 pr-6">{c.name}</div>
        <div className="text-sm text-slate-500 mt-2">{c.count}</div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-brand-200 transition-all">
      {kind === 'multicolor' && <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${c.cls} text-white flex items-center justify-center shadow-sm`}><c.Icon className="h-7 w-7" strokeWidth={1.75} /></div>}
      {kind === 'brand' && <div className="h-14 w-14 rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 flex items-center justify-center"><c.Icon className="h-7 w-7" strokeWidth={1.75} /></div>}
      {kind === 'icon' && <c.Icon className="h-8 w-8 text-brand-600" strokeWidth={1.5} />}
      <div className="mt-4 font-semibold text-slate-900 leading-tight">{c.name}</div>
      <div className="text-sm text-slate-500 mt-1">{c.count}</div>
    </div>
  );
}

function Grid({ kind }: { kind: Kind }) {
  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="grid grid-cols-2 gap-4">
        {CATS.map((c) => <Card key={c.name} c={c} kind={kind} />)}
      </div>
    </div>
  );
}

export default function TilesPreview() {
  return (
    <main className="bg-white pb-20">
      <Tag>1 — Atual (azulejo multicolor)</Tag>
      <Grid kind="multicolor" />
      <Tag>2 — Marca contido (azulejo de marca)</Tag>
      <Grid kind="brand" />
      <Tag>3 — Ícones sem azulejo</Tag>
      <Grid kind="icon" />
      <Tag>4 — Tipográfico (sem ícone)</Tag>
      <Grid kind="type" />
      <Tag>5 — Com imagem</Tag>
      <Grid kind="image" />
      <div className="max-w-3xl mx-auto px-4 pt-12 text-center text-sm text-slate-400">Escolhe 1–5 (ou combina).</div>
    </main>
  );
}
