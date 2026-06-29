import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Preview /learn', robots: { index: false, follow: false } };

const INK='rgb(28 25 22)', INK2='rgb(92 84 76)', INK3='rgb(154 144 133)', LINE='rgb(233 229 222)', PAPER='rgb(250 249 245)';
const ACCENT='rgb(180 88 58)', ACCENT_BRIGHT='rgb(213 124 95)', TINT='rgb(244 232 226)';

function Hero() {
  return (
    <div className="relative overflow-hidden rounded-3xl p-6 text-white" style={{ background:`linear-gradient(135deg, ${ACCENT}, ${ACCENT_BRIGHT})` }}>
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70">A minha jornada</p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl mt-0.5 tracking-tight">A minha aprendizagem</h1>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center font-bold text-lg">4</div>
            <div><div className="text-[11px] text-white/70 uppercase tracking-wide">Nível</div><div className="text-sm font-semibold">1 240 XP</div></div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1.5">🔥<span className="text-sm font-semibold">6</span><span className="text-[11px] text-white/70">dias</span></div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-white/70 mb-1"><span>Para o nível 5</span><span>240/400 XP</span></div>
          <div className="h-2 rounded-full bg-white/20 overflow-hidden"><div className="h-full rounded-full bg-white" style={{ width:'60%' }} /></div>
        </div>
      </div>
    </div>
  );
}
function Continue() {
  return (
    <div className="flex items-center gap-4 rounded-2xl p-5 text-white shadow-md" style={{ background:`linear-gradient(135deg, ${ACCENT}, ${ACCENT_BRIGHT})` }}>
      <div className="h-14 w-14 rounded-full border-4 border-white/30 flex items-center justify-center font-bold">62%</div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-white/70">▶ Continuar</div>
        <div className="font-bold truncate">🧠 Fundamentos de Inteligência Artificial</div>
        <div className="text-xs text-white/80 mt-0.5">62% concluído</div>
      </div><span className="text-white/70">›</span>
    </div>
  );
}
function Stat({ v, l }:{v:string;l:string}) {
  return <div className="rounded-2xl border bg-white p-3 text-center" style={{ borderColor:LINE }}><div className="text-xl font-bold tabular-nums leading-none" style={{ color:INK }}>{v}</div><div className="text-[10px] uppercase tracking-wide mt-1" style={{ color:INK3 }}>{l}</div></div>;
}
function Courses() {
  const cs=[['🧠','Fundamentos de IA',62,false],['🎨','Design com IA',100,true],['⚙️','Prompt Engineering',20,false]] as const;
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color:INK3 }}>Os meus cursos</h2>
      <div className="space-y-2.5">{cs.map((c,i)=>(
        <div key={i} className="flex items-center gap-3 rounded-2xl border bg-white p-3.5" style={{ borderColor:LINE }}>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background:PAPER }}>{c[0]}</div>
          <div className="flex-1 min-w-0"><div className="font-medium text-sm truncate" style={{ color:INK }}>{c[1]}</div>
            <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background:'rgb(240 237 232)' }}><div className="h-full rounded-full" style={{ width:`${c[2]}%`, background: c[3]?'rgb(15 138 128)':ACCENT }} /></div>
          </div>{c[3]?<span style={{ color:'rgb(15 138 128)' }}>✓</span>:<span style={{ color:INK3 }}>›</span>}
        </div>))}
      </div>
    </section>
  );
}
function Discover() {
  const cs=[['✨','Visão por Computador','Do pixel ao modelo'],['🔊','IA Generativa de Áudio','Som com redes neuronais']] as const;
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color:INK3 }}>✨ Descobrir na Academia</h2>
      <div className="grid grid-cols-1 gap-3">{cs.map((c,i)=>(
        <div key={i} className="flex items-center gap-3 rounded-2xl border bg-white p-3.5" style={{ borderColor:LINE }}>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background:TINT }}>{c[0]}</div>
          <div className="flex-1 min-w-0"><div className="font-medium text-sm truncate" style={{ color:INK }}>{c[1]}</div><div className="text-[11px] truncate" style={{ color:INK3 }}>{c[2]}</div></div><span style={{ color:INK3 }}>›</span>
        </div>))}
      </div>
    </section>
  );
}
function Challenges() {
  const ch=[['🎯','Completa 3 aulas hoje',2,3,'diário'],['📚','5 dias seguidos',6,5,'semanal']] as const;
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color:INK3 }}>⚡ Desafios</h2>
      <div className="space-y-2.5">{ch.map((c,i)=>(
        <div key={i} className="rounded-2xl border bg-white p-4" style={{ borderColor:LINE }}>
          <div className="flex items-center justify-between gap-2 mb-2"><div className="flex items-center gap-2 min-w-0"><span className="text-lg">{c[0]}</span><span className="font-medium text-sm truncate" style={{ color:INK2 }}>{c[1]}</span></div><span className="text-[10px] font-bold uppercase" style={{ color:INK3 }}>{c[4]}</span></div>
          <div className="flex items-center gap-3"><div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:'rgb(240 237 232)' }}><div className="h-full rounded-full" style={{ width:`${Math.min(100,c[2]/c[3]*100)}%`, background:`linear-gradient(90deg, ${ACCENT}, ${ACCENT_BRIGHT})` }} /></div><span className="text-xs tabular-nums" style={{ color:INK3 }}>{c[2]}/{c[3]}</span></div>
        </div>))}
      </div>
    </section>
  );
}
function Ranking() {
  const lb=[[1,'Ana S.',2100,true],[2,'Tu',1240,false],[3,'João P.',980,false]] as const;
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color:INK3 }}>🏆 Ranking da equipa</h2>
      <div className="rounded-2xl border bg-white" style={{ borderColor:LINE }}>{lb.map((r,i)=>(
        <div key={i} className="flex items-center gap-3 p-3" style={{ borderTop: i>0?`1px solid ${LINE}`:'none', background: r[1]==='Tu'?TINT:'transparent' }}>
          <div className="w-7 text-center font-bold text-sm" style={{ color: r[0]<=3?ACCENT:INK3 }}>{r[0]<=3?'♛':r[0]}</div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0" style={{ background:PAPER, color:INK3 }}>{(r[1] as string)[0]}</div>
          <span className="flex-1 min-w-0 truncate text-sm" style={{ color:INK2 }}>{r[1]}</span><span className="text-xs font-semibold tabular-nums shrink-0" style={{ color:INK3 }}>{r[2]} XP</span>
        </div>))}
      </div>
    </section>
  );
}
function Skills() {
  const sk=[['Machine Learning',82,true],['Prompt Design',74,true],['Visão Computacional',45,false],['Ética em IA',60,false]] as const;
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color:INK3 }}>🎯 As minhas competências</h2>
      <div className="flex flex-wrap gap-2">{sk.map((s,i)=>(
        <span key={i} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium" style={ s[2]?{ borderColor:'rgb(167 215 197)', background:'rgb(231 245 238)', color:'rgb(15 110 95)' }:{ borderColor:LINE, background:'#fff', color:INK2 } }>
          {s[2]?'🏅':''}{s[0]}<span className="tabular-nums" style={{ color:INK3 }}>{s[1]}</span>
        </span>))}
      </div>
    </section>
  );
}

function Dashboard({ twoCol }:{ twoCol:boolean }) {
  if (!twoCol) {
    return <div className="space-y-6"><Hero /><Continue /><div className="grid grid-cols-3 gap-3"><Stat v="3" l="A frequentar"/><Stat v="1" l="Concluídos"/><Stat v="9" l="Melhor streak"/></div><Courses /><Discover /><Challenges /><Ranking /><Skills /></div>;
  }
  return (
    <div className="space-y-6">
      <Hero />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6"><Continue /><div className="grid grid-cols-3 gap-3"><Stat v="3" l="A frequentar"/><Stat v="1" l="Concluídos"/><Stat v="9" l="Melhor streak"/></div><Courses /><Discover /></div>
        <div className="space-y-6"><Challenges /><Ranking /><Skills /></div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div style={{ background:'rgb(245 243 239)', minHeight:'100vh' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:ACCENT }}>Variante A · moldura 6xl (1152px) · 2 colunas</div>
        <Dashboard twoCol />
      </div>
      <div style={{ borderTop:`1px solid ${LINE}` }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:ACCENT }}>Variante B · moldura 7xl (1280px) · 2 colunas</div>
        <Dashboard twoCol />
      </div>
    </div>
  );
}
