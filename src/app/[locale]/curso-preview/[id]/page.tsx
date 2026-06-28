import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { fmtCents } from '@/lib/utils/cn';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Clock, Award, Users, Star, CheckCircle, BookOpen, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { EnrollButton } from '@/components/shared/EnrollButton';

export const revalidate = 300;

export default async function CoursePreviewPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: course } = await sb.from('nl_courses').select('*').eq('id', id).eq('published', true).maybeSingle();
  if (!course) notFound();

  try {
    const { data: i18n } = await sb.rpc('nl_course_i18n', { p_id: id, p_lang: locale });
    if (i18n) {
      if (i18n.title) course.title = i18n.title;
      if (i18n.subtitle) course.subtitle = i18n.subtitle;
      if (i18n.description) course.description = i18n.description;
      if (i18n.modules != null) course.modules = i18n.modules;
      if (i18n.topics != null) course.topics = i18n.topics;
    }
  } catch { /* fallback */ }

  const { data: { user } } = await sb.auth.getUser();
  let enrolled = false;
  if (user) {
    const { data: enr } = await sb.from('nl_enrollments_v2').select('id').eq('user_id', user.id).eq('course_id', id).maybeSingle();
    enrolled = !!enr;
  }
  let instructor = null;
  if (course.instructor_id) {
    const { data } = await sb.from('nl_instructors').select('id, display_name, bio, avatar_url').eq('id', course.instructor_id).maybeSingle();
    instructor = data;
  }
  const blocks = await getHomeBlocks(locale);
  const modules = Array.isArray(course.modules) ? course.modules : [];
  const topics = Array.isArray(course.topics) ? course.topics : [];
  const lessonCount = modules.reduce((s: number, m: any) => s + (Array.isArray(m?.lessons) ? m.lessons.length : 0), 0);

  return (
    <>
      <Header />
      {/* Fundo creme quente (papel premium) em vez de branco frio */}
      <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'rgb(250 249 246)' }}>

        {/* HERO editorial */}
        <section className="relative border-b" style={{ borderColor: 'rgb(232 228 222)' }}>
          {/* linha de acento arrojada no topo */}
          <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-brand-600 to-brand-400" />
          <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-8 pb-12 sm:pt-12 sm:pb-16">
            <Link href={'/cursos' as any}
              className="group inline-flex items-center gap-2 mb-8 text-sm font-medium transition-colors"
              style={{ color: 'rgb(121 114 104)' }}>
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.25} />
              <span>{t('cdp.back')}</span>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* coluna editorial */}
              <div className="lg:col-span-3 min-w-0">
                {/* eyebrow / categoria com serif */}
                <div className="flex items-center gap-3 mb-5">
                  {course.level && (
                    <span className="font-display text-sm italic" style={{ color: 'rgb(88 82 74)' }}>
                      {course.level}
                    </span>
                  )}
                  {course.featured && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold tracking-wide uppercase" style={{ color: 'rgb(180 83 9)' }}>
                      <Sparkles className="h-3.5 w-3.5" /> {t('cdp.featured')}
                    </span>
                  )}
                </div>

                {/* título serif grande, peso editorial */}
                <h1 className="font-display font-bold tracking-tight text-balance leading-[1.05]"
                  style={{ fontSize: 'clamp(2.25rem, 6vw, 3.5rem)', color: 'rgb(28 25 22)' }}>
                  {course.title}
                </h1>

                {course.subtitle && (
                  <p className="mt-6 text-pretty leading-relaxed" style={{ fontSize: '1.2rem', color: 'rgb(88 82 74)' }}>
                    {course.subtitle}
                  </p>
                )}

                {/* ficha técnica elegante, separada por linhas finas */}
                <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm" style={{ color: 'rgb(88 82 74)' }}>
                  {course.duration && <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" strokeWidth={1.75} /> {course.duration}</span>}
                  {modules.length > 0 && <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4" strokeWidth={1.75} /> {t('cdp.modules', { n: modules.length })}</span>}
                  {course.enrollments_count > 0 && <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" strokeWidth={1.75} /> {t('cdp.students', { n: course.enrollments_count })}</span>}
                  {course.rating_avg && (
                    <span className="inline-flex items-center gap-1.5" style={{ color: 'rgb(180 83 9)' }}>
                      <Star className="h-4 w-4 fill-current" /> {Number(course.rating_avg).toFixed(1)}
                      <span style={{ color: 'rgb(168 161 151)' }}>({course.rating_count || 0})</span>
                    </span>
                  )}
                </div>
              </div>

              {/* cartão matrícula — sóbrio, confiante */}
              <aside className="lg:col-span-2 lg:sticky lg:top-20 self-start">
                <div className="rounded-2xl border bg-white p-7 shadow-[0_2px_24px_-8px_rgba(66,61,55,0.18)]"
                  style={{ borderColor: 'rgb(232 228 222)' }}>
                  {lessonCount === 0 ? (
                    <div className="rounded-xl p-4 text-sm font-medium text-center" style={{ backgroundColor: 'rgb(254 252 232)', color: 'rgb(146 64 14)' }}>{t('cdp.coming_soon')}</div>
                  ) : enrolled ? (
                    <Link href={`/learn/curso/${course.id}/continuar` as any}
                      className="btn-primary w-full inline-flex items-center justify-center gap-2 py-3.5 text-base font-semibold">
                      {t('cdp.go_to_course')}
                    </Link>
                  ) : (
                    <>
                      <div className="mb-5">
                        <div className="font-display font-bold" style={{ fontSize: '2.5rem', color: 'rgb(28 25 22)', lineHeight: 1 }}>
                          {fmtCents(course.price_cents, course.currency || 'EUR')}
                        </div>
                        <p className="text-xs mt-2" style={{ color: 'rgb(121 114 104)' }}>{t('cdp.price_note')}</p>
                      </div>
                      <EnrollButton courseId={course.id} priceLabel={fmtCents(course.price_cents, course.currency || 'EUR')} courseTitle={course.title} />
                    </>
                  )}
                  <div className="mt-6 pt-6 space-y-3 text-sm border-t" style={{ borderColor: 'rgb(232 228 222)', color: 'rgb(66 61 55)' }}>
                    <div className="flex items-start gap-2.5"><CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(13 148 136)' }} /><span>{t('cdp.benefit_lifetime')}</span></div>
                    <div className="flex items-start gap-2.5"><Award className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(124 58 237)' }} /><span>{t('cdp.benefit_certificate')}</span></div>
                    <div className="flex items-start gap-2.5"><CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(13 148 136)' }} /><span>{t('cdp.benefit_refund')}</span></div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* CORPO */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 py-14 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {course.description && (
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-5 tracking-tight" style={{ color: 'rgb(28 25 22)' }}>{t('cdp.about')}</h2>
                <div className="leading-[1.8] whitespace-pre-wrap" style={{ color: 'rgb(66 61 55)', fontSize: '1.05rem' }}>{course.description}</div>
              </div>
            )}
            {topics.length > 0 && (
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-6 tracking-tight" style={{ color: 'rgb(28 25 22)' }}>{t('cdp.what_youll_learn')}</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {topics.map((tp: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-[15px]" style={{ color: 'rgb(66 61 55)' }}>
                      <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'rgb(13 148 136)' }} /><span>{tp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {modules.length > 0 && (
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-6 tracking-tight" style={{ color: 'rgb(28 25 22)' }}>{t('cdp.content')}</h2>
                <div className="space-y-px rounded-2xl overflow-hidden border" style={{ borderColor: 'rgb(232 228 222)' }}>
                  {modules.map((m: any, i: number) => (
                    <div key={i} className="bg-white p-5 transition-colors hover:bg-[rgb(250,249,246)]">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="font-semibold flex items-baseline gap-3" style={{ color: 'rgb(28 25 22)' }}>
                          <span className="font-display text-lg" style={{ color: 'rgb(168 161 151)' }}>{String(i + 1).padStart(2, '0')}</span>
                          <span>{m.title || m.name || t('cdp.module_n', { n: i + 1 })}</span>
                        </h3>
                        {m.duration && <span className="text-xs flex-shrink-0" style={{ color: 'rgb(168 161 151)' }}>{m.duration}</span>}
                      </div>
                      {m.description && <p className="mt-2 text-sm leading-relaxed pl-9" style={{ color: 'rgb(121 114 104)' }}>{m.description}</p>}
                      {Array.isArray(m.lessons) && m.lessons.length > 0 && (
                        <ul className="mt-3 space-y-1.5 text-sm pl-9" style={{ color: 'rgb(88 82 74)' }}>
                          {m.lessons.map((l: any, j: number) => <li key={j} className="flex items-center gap-2.5"><span style={{ color: 'rgb(196 181 160)' }}>—</span><span>{l.title || l.name || l}</span></li>)}
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
              <div className="rounded-2xl p-6 sticky top-20 bg-white border" style={{ borderColor: 'rgb(232 228 222)' }}>
                <h3 className="font-display text-xs font-bold uppercase tracking-[0.12em] mb-5" style={{ color: 'rgb(121 114 104)' }}>{t('cdp.instructor')}</h3>
                <div className="flex items-center gap-3.5">
                  {instructor.avatar_url ? <img src={instructor.avatar_url} alt={instructor.display_name} className="w-14 h-14 rounded-full object-cover" /> : <div className="w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-lg" style={{ backgroundColor: 'rgb(245 243 239)', color: 'rgb(66 61 55)' }}>{instructor.display_name?.[0]?.toUpperCase()}</div>}
                  <div className="font-semibold" style={{ color: 'rgb(28 25 22)' }}>{instructor.display_name}</div>
                </div>
                {instructor.bio && <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgb(88 82 74)' }}>{instructor.bio}</p>}
              </div>
              <div className="mt-4 rounded-2xl p-5 border" style={{ backgroundColor: 'rgb(240 253 250)', borderColor: 'rgb(153 246 228)' }}>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'rgb(13 148 136)' }} />
                  <div>
                    <h4 className="font-semibold text-sm" style={{ color: 'rgb(19 78 74)' }}>{t('cdp.guarantee_h')}</h4>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgb(17 94 89)' }}>{t('cdp.guarantee_p')}</p>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </section>

        {/* faixa de preview */}
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pb-10">
          <div className="rounded-xl px-4 py-3 text-xs text-center" style={{ backgroundColor: 'rgb(245 243 239)', color: 'rgb(121 114 104)' }}>
            Pré-visualização da direção visual <strong style={{ color: 'rgb(66 61 55)' }}>Editorial Académico Quente</strong> — não substitui a página atual.
          </div>
        </div>

        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
