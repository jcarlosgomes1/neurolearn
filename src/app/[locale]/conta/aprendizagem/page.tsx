import { createClient } from '@/lib/supabase/server';
import { Link, redirect } from '@/i18n/routing';
import {
  BookOpen, Clock, Trophy, Flame, ArrowRight, Sparkles, PlayCircle, Award,
  GraduationCap, ChevronRight
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function fmtMin(n: number): string {
  if (n < 60) return `${n}m`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default async function MeuAprendizagemPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect({ href: '/login', locale });

  const { data: profile } = await sb.from('nl_profiles').select('full_name, avatar_url').eq('id', user!.id).maybeSingle();
  const { data, error } = await sb.rpc('nl_my_learning_dashboard');
  const d = (data || {}) as any;
  const stats = d.stats || {};
  const firstName = (profile?.full_name || user!.email || '').split(' ')[0] || 'Olá';

  return (
    <div>
      {/* Hero gradient personalizado */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_50%)]" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 text-white/80 text-xs font-medium uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" /> A tua aprendizagem
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Olá, {firstName} 👋
          </h1>
          <p className="text-white/85 mt-2 text-base max-w-xl">
            {d.next_lesson?.course_title ? (
              <>Continua de onde paraste em <span className="font-semibold">{d.next_lesson.course_title}</span></>
            ) : (
              <>Pronto para aprender algo novo hoje?</>
            )}
          </p>

          {/* Stats grid no hero */}
          <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
            <HeroStat icon={<BookOpen className="h-4 w-4" />} value={stats.courses_enrolled || 0} label="Cursos" />
            <HeroStat icon={<PlayCircle className="h-4 w-4" />} value={stats.lessons_completed || 0} label="Lições" />
            <HeroStat icon={<Clock className="h-4 w-4" />} value={fmtMin(stats.minutes_learned || 0)} label="Tempo" />
            <HeroStat icon={<Flame className="h-4 w-4" />} value={stats.streak_days || 0} label={`${stats.streak_days === 1 ? 'Dia' : 'Dias'} seguidos`} highlight={stats.streak_days >= 3} />
          </div>

          {d.next_lesson && (
            <Link
              href={{ pathname: '/curso/[id]', params: { id: d.next_lesson.course_id } } as any}
              className="mt-7 inline-flex items-center gap-2 bg-white text-violet-700 hover:bg-white/95 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-xl shadow-violet-900/20 hover:scale-[1.02] active:scale-[0.99] transition-transform">
              <PlayCircle className="h-4 w-4" /> Continuar curso
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-900 mb-6">
            Não foi possível carregar os teus dados: {error.message}
          </div>
        )}

        {/* Em progresso */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Em progresso</h2>
            <Link href={'/learn' as any} className="text-xs text-violet-600 hover:underline font-medium">
              Todos os cursos →
            </Link>
          </div>
          {Array.isArray(d.in_progress) && d.in_progress.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {d.in_progress.map((c: any) => (
                <Link
                  key={c.id}
                  href={{ pathname: '/curso/[id]', params: { id: c.id } } as any}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-violet-200 transition-all hover:-translate-y-0.5">
                  <div className="h-32 bg-gradient-to-br from-violet-500 to-indigo-600 relative overflow-hidden">
                    {c.cover_url && (
                      <img src={c.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-3 text-3xl drop-shadow-lg">{c.emoji || '📘'}</div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 mb-1.5">{c.title}</h3>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{Math.round(Number(c.progress_pct || 0))}% completo</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, Number(c.progress_pct || 0))}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyHint
              icon={<BookOpen className="h-6 w-6" />}
              title="Sem cursos em progresso"
              hint="Explora o catálogo para começar"
              cta={{ href: '/cursos', label: 'Ver cursos' }}
            />
          )}
        </section>

        {/* Percursos */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-500" /> Os teus percursos
            </h2>
            <Link href={'/aprender/percursos' as any} className="text-xs text-violet-600 hover:underline font-medium">
              Explorar percursos →
            </Link>
          </div>
          {Array.isArray(d.paths) && d.paths.length > 0 ? (
            <div className="space-y-2">
              {d.paths.map((p: any) => (
                <Link
                  key={p.id}
                  href={{ pathname: '/aprender/percursos/[slug]', params: { slug: p.slug } } as any}
                  className="flex items-center gap-4 bg-white border border-slate-200 hover:border-indigo-200 rounded-xl p-4 group transition-all">
                  <div className="text-3xl bg-gradient-to-br from-indigo-100 to-violet-100 h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0">
                    {p.emoji || '🎓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate group-hover:text-indigo-700 transition-colors">{p.title}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>{Math.round(Number(p.progress_pct || 0))}% completo</span>
                      <span>·</span>
                      <span>{p.estimated_hours || 0}h estimadas</span>
                    </div>
                    <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                        style={{ width: `${Math.min(100, Number(p.progress_pct || 0))}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyHint
              icon={<GraduationCap className="h-6 w-6" />}
              title="Sem percursos ainda"
              hint="Os percursos combinam vários cursos numa jornada estruturada"
              cta={{ href: '/aprender/percursos', label: 'Ver percursos' }}
            />
          )}
        </section>

        {/* Certificados */}
        {Array.isArray(d.recent_certificates) && d.recent_certificates.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" /> Certificados recentes
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {d.recent_certificates.map((c: any) => (
                <div key={c.id} className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="h-12 w-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0">
                    <Award className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">Certificado</div>
                    <div className="text-xs text-slate-600 font-mono truncate">{c.verification_code}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function HeroStat({ icon, value, label, highlight }: { icon: React.ReactNode; value: any; label: string; highlight?: boolean }) {
  return (
    <div className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 ${highlight ? 'ring-2 ring-amber-300' : ''}`}>
      <div className="flex items-center gap-1.5 text-white/70 text-[10px] uppercase tracking-wider font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold text-white mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function EmptyHint({ icon, title, hint, cta }: { icon: React.ReactNode; title: string; hint: string; cta: { href: string; label: string } }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
      <div className="inline-flex h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900 text-sm mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-4">{hint}</p>
      <Link href={cta.href as any} className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg">
        {cta.label} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
