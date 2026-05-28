import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { fmtCents } from '@/lib/utils/cn';
import { notFound } from 'next/navigation';
import { Clock, Award, Users, Star, CheckCircle, BookOpen } from 'lucide-react';
import { EnrollButton } from '@/components/shared/EnrollButton';

export const revalidate = 120;

export default async function CoursePage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const sb = await createClient();
  const { data: course } = await sb.from('nl_courses').select('*').eq('id', id).eq('published', true).maybeSingle();
  if (!course) notFound();

  let instructor = null;
  if (course.instructor_id) {
    const { data } = await sb.from('nl_instructors').select('id, display_name, bio, avatar_url').eq('id', course.instructor_id).maybeSingle();
    instructor = data;
  }
  const blocks = await getHomeBlocks(locale);
  const modules = Array.isArray(course.modules) ? course.modules : [];
  const topics = Array.isArray(course.topics) ? course.topics : [];

  return (
    <>
      <Header />
      <main className="bg-white min-h-screen">
        <section className="bg-gradient-to-br from-brand-50 via-white to-brand-50/30 border-b border-slate-200/60">
          <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
            <Link href={'/cursos' as any} className="text-sm text-brand-600 hover:underline mb-4 inline-block">← Todos os cursos</Link>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-5xl">{course.emoji || '📚'}</span>
                  {course.level && <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600">{course.level}</span>}
                  {course.featured && <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">⭐ Destaque</span>}
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">{course.title}</h1>
                {course.subtitle && <p className="mt-4 text-lg text-slate-600 text-pretty">{course.subtitle}</p>}
                <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600">
                  {course.duration && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {course.duration}</span>}
                  {modules.length > 0 && <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {modules.length} módulos</span>}
                  {course.enrollments_count > 0 && <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {course.enrollments_count} alunos</span>}
                  {course.rating_avg && <span className="flex items-center gap-1.5 text-amber-600"><Star className="h-4 w-4 fill-current" /> {Number(course.rating_avg).toFixed(1)} ({course.rating_count || 0})</span>}
                </div>
              </div>
              <aside className="lg:sticky lg:top-20 self-start">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-slate-900">{fmtCents(course.price_cents, course.currency || 'EUR')}</div>
                    <p className="text-xs text-slate-500 mt-1">Pagamento único · acesso vitalício</p>
                  </div>
                  <EnrollButton courseId={course.id} priceLabel={fmtCents(course.price_cents, course.currency || 'EUR')} />
                  <Link href={'/login' as any} className="block w-full text-center mt-2 text-sm text-brand-700 hover:underline">Já tenho conta</Link>
                  <ul className="mt-6 space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>Acesso vitalício ao conteúdo</span></li>
                    <li className="flex items-start gap-2"><Award className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" /><span>Certificado verificável</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>Garantia de 14 dias</span></li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </section>
        <section className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            {course.description && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Sobre este curso</h2>
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{course.description}</div>
              </div>
            )}
            {topics.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">O que vais aprender</h2>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {topics.map((t: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" /><span>{t}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {modules.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Conteúdo do curso</h2>
                <div className="space-y-3">
                  {modules.map((m: any, i: number) => (
                    <div key={i} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900"><span className="text-brand-600 mr-2">{i + 1}.</span>{m.title || m.name || `Módulo ${i + 1}`}</h3>
                        {m.duration && <span className="text-xs text-slate-500">{m.duration}</span>}
                      </div>
                      {m.description && <p className="mt-1 text-sm text-slate-600">{m.description}</p>}
                      {Array.isArray(m.lessons) && m.lessons.length > 0 && (
                        <ul className="mt-3 space-y-1 text-sm text-slate-600">
                          {m.lessons.map((l: any, j: number) => <li key={j} className="flex items-center gap-2"><span className="text-slate-400">▸</span><span>{l.title || l.name || l}</span></li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {instructor && (
            <aside>
              <div className="bg-slate-50 rounded-xl p-6 sticky top-20">
                <h3 className="font-semibold text-slate-900 mb-4">Instrutor</h3>
                <div className="flex items-center gap-3">
                  {instructor.avatar_url ? <img src={instructor.avatar_url} alt={instructor.display_name} className="w-12 h-12 rounded-full" /> : <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">{instructor.display_name?.[0]?.toUpperCase()}</div>}
                  <div><div className="font-medium text-slate-900">{instructor.display_name}</div></div>
                </div>
                {instructor.bio && <p className="mt-4 text-sm text-slate-600 leading-relaxed">{instructor.bio}</p>}
              </div>
            </aside>
          )}
        </section>
        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
