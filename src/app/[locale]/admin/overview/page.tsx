import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { Users, BookOpen, Building2, GraduationCap, TrendingUp, AlertCircle, MessageSquare, Award, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cockpit · NeuroLearn' };

interface Kpis {
  users: { total: number; new_7d: number };
  courses: { total: number; published: number };
  orgs: { total: number; active: number };
  enrollments: { total: number };
  revenue: { total_30d: number; prev_30d: number; growth_pct: number | null };
  instructors: { active: number };
  pending: { open_questions: number; unresolved_errors: number };
  top_courses: Array<{ id: string; title: string; emoji?: string; cover_url?: string; enrolls: number }>;
}

export default async function Page() {
  const sb = await createClient();
  const { data, error } = await sb.rpc('nl_admin_overview_kpis');
  const k = (data as Kpis | null) || null;

  const cards = k ? [
    { label: 'Utilizadores', value: k.users.total.toLocaleString('pt-PT'), sub: `+${k.users.new_7d} esta semana`, icon: Users, cls: 'from-violet-500 to-indigo-600', href: '/admin/users' },
    { label: 'Cursos', value: k.courses.total.toLocaleString('pt-PT'), sub: `${k.courses.published} publicados`, icon: BookOpen, cls: 'from-emerald-500 to-teal-600', href: '/admin/cursos' },
    { label: 'Organizações', value: k.orgs.total.toLocaleString('pt-PT'), sub: `${k.orgs.active} activas`, icon: Building2, cls: 'from-amber-500 to-orange-600', href: '/admin/empresas' },
    { label: 'Inscrições', value: k.enrollments.total.toLocaleString('pt-PT'), sub: 'Total acumulado', icon: GraduationCap, cls: 'from-fuchsia-500 to-pink-600', href: '/admin/cursos' },
    { label: 'Receita 30d', value: `€ ${k.revenue.total_30d.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: k.revenue.growth_pct !== null ? `${k.revenue.growth_pct > 0 ? '+' : ''}${k.revenue.growth_pct}% vs anterior` : 'Sem histórico', icon: TrendingUp, cls: 'from-blue-500 to-cyan-600', href: '/admin/revenue' },
    { label: 'Instrutores activos', value: k.instructors.active.toLocaleString('pt-PT'), sub: 'Aprovados e activos', icon: Award, cls: 'from-rose-500 to-red-600', href: '/admin/instrutores' },
    { label: 'Q&A pendentes', value: k.pending.open_questions.toLocaleString('pt-PT'), sub: 'A aguardar resposta', icon: MessageSquare, cls: 'from-slate-600 to-slate-800', href: '/admin/cursos' },
    { label: 'Erros não resolvidos', value: k.pending.unresolved_errors.toLocaleString('pt-PT'), sub: k.pending.unresolved_errors > 0 ? 'Requer atenção' : 'Tudo OK', icon: AlertCircle, cls: k.pending.unresolved_errors > 0 ? 'from-red-500 to-rose-600' : 'from-emerald-500 to-teal-600', href: '/admin/erros' },
  ] : [];

  return (
    <div className="">
      <header className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Sparkles className="h-3.5 w-3.5" /> Cockpit administrativo
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Visão geral</h1>
        <p className="text-sm text-slate-600 mt-1.5">Estado da plataforma em tempo real. Clica em cada cartão para detalhes.</p>
      </header>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          Erro a carregar KPIs: {error.message}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {cards.map((c, i) => (
          <Link key={i} href={c.href as any}
            className="group bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:-translate-y-1 hover:shadow-xl transition-all">
            <div className={`inline-flex h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br ${c.cls} text-white items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">{c.label}</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{c.value}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{c.sub}</div>
          </Link>
        ))}
      </div>

      {k && k.top_courses && k.top_courses.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <header className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Trending</div>
              <h2 className="text-lg font-bold text-slate-900">Top 5 cursos · últimos 30 dias</h2>
            </div>
            <Link href={'/admin/cursos' as any} className="text-xs text-slate-500 hover:text-slate-900 font-semibold">Ver todos →</Link>
          </header>
          <div className="space-y-1.5">
            {k.top_courses.map((c, i) => (
              <Link key={c.id} href={{ pathname: '/admin/cursos/[id]', params: { id: c.id } } as any}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">{i + 1}</div>
                {c.emoji && <span className="text-xl">{c.emoji}</span>}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">{c.title}</div>
                </div>
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {c.enrolls} inscrições
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: '/admin/users', icon: Users, label: 'Utilizadores', cls: 'violet-600' },
          { href: '/admin/cursos', icon: BookOpen, label: 'Cursos', cls: 'emerald-600' },
          { href: '/admin/empresas', icon: Building2, label: 'Organizações', cls: 'amber-600' },
          { href: '/admin/observabilidade', icon: TrendingUp, label: 'Observabilidade', cls: 'blue-600' },
        ].map((s, i) => (
          <Link key={i} href={s.href as any}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all flex items-center gap-3">
            <s.icon className={`h-5 w-5 text-${s.cls}`} />
            <span className="text-sm font-semibold text-slate-900">{s.label}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
