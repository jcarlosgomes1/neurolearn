import { Link } from '@/i18n/routing';
import {
  Building2, Sparkles, Award, Compass, ArrowRight,
  Brain, Code, Briefcase, Palette, BarChart3, Megaphone, Globe2, Heart,
  TrendingUp, Users, BookOpen, Star
} from 'lucide-react';

// ============= TRUSTED BY (logos strip) =============
export function TrustedByStrip() {
  const COMPANIES = ['Healthcare Group', 'TechCorp', 'FinanceHub', 'RetailChain', 'ConsultingFirm', 'StartupHub'];
  return (
    <section className="bg-slate-50/60 border-y border-slate-200/60 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-4">
          Equipas e organizações que confiam na NeuroLearn
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-12 opacity-60 text-slate-700 font-bold text-sm sm:text-base">
          {COMPANIES.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 hover:opacity-100 transition-opacity">
              <span className="h-2 w-2 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600" />
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============= HOW IT WORKS (3 steps) =============
export function HowItWorksSection() {
  const STEPS = [
    {
      num: '01', icon: Compass,
      title: 'Escolhe o teu caminho',
      desc: 'Catálogo extenso ou percurso curado. Iniciante, intermédio ou avançado — sempre com checkpoints validados.',
      cls: 'from-violet-500 to-indigo-600',
    },
    {
      num: '02', icon: Brain,
      title: 'Aprende com mãos na massa',
      desc: 'Cada lição termina com algo entregue. Código, design, análise. Tens tutor 24/7 quando ficares preso.',
      cls: 'from-emerald-500 to-teal-600',
    },
    {
      num: '03', icon: Award,
      title: 'Certifica e avança',
      desc: 'Certificado verificável + portfolio + ponte directa para vagas via marketplace de talento integrado.',
      cls: 'from-amber-500 to-orange-600',
    },
  ];
  return (
    <section className="relative py-20 sm:py-24 bg-white overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 -left-20 h-80 w-80 rounded-full bg-violet-400/5 blur-3xl" />
        <div className="absolute bottom-20 -right-20 h-80 w-80 rounded-full bg-emerald-400/5 blur-3xl" />
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-xs font-semibold text-violet-700 mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Como funciona
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Três passos. <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Resultado real.</span>
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">Não é mais um curso na estante. É um sistema completo desde a primeira aula até ao primeiro emprego.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {STEPS.map((s) => (
            <div key={s.num} className="group relative bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 hover:-translate-y-1 hover:shadow-2xl transition-all">
              <div className={`absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br ${s.cls} opacity-5 blur-2xl group-hover:opacity-15 transition-opacity`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br ${s.cls} text-white items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <s.icon className="h-7 w-7" />
                  </div>
                  <span className={`text-4xl font-black bg-gradient-to-br ${s.cls} bg-clip-text text-transparent opacity-30`}>{s.num}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============= CATEGORIES GRID =============
export function CategoriesGrid() {
  const CATS = [
    { name: 'Programação', icon: Code, count: '54+ cursos', href: '/cursos?cat=programacao', cls: 'from-violet-500 to-indigo-600' },
    { name: 'Data & Analytics', icon: BarChart3, count: '38+ cursos', href: '/cursos?cat=data', cls: 'from-blue-500 to-cyan-600' },
    { name: 'Design & UX', icon: Palette, count: '27+ cursos', href: '/cursos?cat=design', cls: 'from-fuchsia-500 to-pink-600' },
    { name: 'Marketing & Growth', icon: Megaphone, count: '22+ cursos', href: '/cursos?cat=marketing', cls: 'from-amber-500 to-orange-600' },
    { name: 'Negócios & Gestão', icon: Briefcase, count: '31+ cursos', href: '/cursos?cat=business', cls: 'from-emerald-500 to-teal-600' },
    { name: 'IA Aplicada', icon: Sparkles, count: '19+ cursos', href: '/cursos?cat=ai', cls: 'from-purple-500 to-violet-600' },
    { name: 'Línguas', icon: Globe2, count: '12+ cursos', href: '/cursos?cat=linguas', cls: 'from-rose-500 to-red-600' },
    { name: 'Bem-estar', icon: Heart, count: '8+ cursos', href: '/cursos?cat=wellness', cls: 'from-pink-500 to-rose-600' },
  ];
  return (
    <section className="bg-slate-50 py-20 sm:py-24 border-y border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 mb-4 shadow-sm">
            <BookOpen className="h-3.5 w-3.5" /> Catálogo
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Aprende o que <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">precisas</span>
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">8 grandes áreas, centenas de cursos curados, todos com certificado verificável.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATS.map((c) => (
            <Link
              key={c.name}
              href={c.href as any}
              className="group bg-white rounded-2xl border border-slate-200 p-5 hover:-translate-y-1 hover:shadow-xl transition-all"
            >
              <div className={`inline-flex h-11 w-11 rounded-xl bg-gradient-to-br ${c.cls} text-white items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div className="font-bold text-slate-900 text-sm">{c.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{c.count}</div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href={'/cursos' as any} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 hover:gap-2.5 transition-all">
            Explorar catálogo completo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============= LIVE MOMENTUM =============
export function LiveMomentumSection() {
  const SIGNUPS = [
    { name: 'Marina', role: 'Product Designer', city: 'Lisboa', when: 'há 3 min' },
    { name: 'Tiago', role: 'Backend Eng', city: 'Porto', when: 'há 8 min' },
    { name: 'Sofia', role: 'Data Analyst', city: 'São Paulo', when: 'há 12 min' },
    { name: 'Diogo', role: 'Marketing Mgr', city: 'Madrid', when: 'há 19 min' },
  ];
  const TOP_COURSES = [
    { title: 'Python para Análise de Dados', emoji: '🐍', enrolled: 1240, cls: 'from-yellow-500 to-amber-600' },
    { title: 'UX Design Foundations', emoji: '🎨', enrolled: 980, cls: 'from-fuchsia-500 to-pink-600' },
    { title: 'IA Aplicada ao Trabalho', emoji: '🧠', enrolled: 1850, cls: 'from-violet-500 to-indigo-600' },
  ];
  return (
    <section className="relative py-20 sm:py-24 bg-white overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-400/5 to-blue-400/5 blur-3xl" />
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 mb-4">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Atividade ao vivo
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Comunidade <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">em movimento</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent signups */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs uppercase tracking-wider font-bold text-emerald-600 mb-1">Inscrições recentes</div>
                <div className="font-bold text-slate-900">Novos alunos esta hora</div>
              </div>
              <div className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold">
                <TrendingUp className="h-3 w-3" /> +47 hoje
              </div>
            </div>
            <div className="space-y-2">
              {SIGNUPS.map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50/60 rounded-xl p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">{s.name} · <span className="text-slate-600 font-normal">{s.role}</span></div>
                    <div className="text-[11px] text-slate-500">{s.city} · {s.when}</div>
                  </div>
                  <Users className="h-4 w-4 text-slate-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Top courses */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs uppercase tracking-wider font-bold text-amber-600 mb-1">Em destaque</div>
                <div className="font-bold text-slate-900">Mais procurados este mês</div>
              </div>
              <div className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-full text-xs font-bold">
                <Star className="h-3 w-3 fill-amber-500" /> Trending
              </div>
            </div>
            <div className="space-y-2">
              {TOP_COURSES.map((c, i) => (
                <Link key={i} href={'/cursos' as any}
                  className="flex items-center gap-3 bg-slate-50/60 rounded-xl p-3 hover:bg-slate-50 transition-all group">
                  <div className={`flex-shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br ${c.cls} text-white flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform`}>
                    {c.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">{c.title}</div>
                    <div className="text-[11px] text-slate-500">{c.enrolled.toLocaleString('pt-PT')} alunos inscritos</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
