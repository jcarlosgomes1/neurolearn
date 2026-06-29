import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { fmtCents } from '@/lib/utils/cn';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Clock, Award, Users, Star, Check, BookOpen, ArrowLeft, ShieldCheck, Sparkles, PlayCircle, Layers, Infinity as InfinityIcon } from 'lucide-react';
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
  const isFree = !course.price_cents || course.price_cents === 0;
  const hasRating = course.rating_avg && course.rating_count > 0;

  const INK = 'rgb(28 25 22)'; const INK2 = 'rgb(92 84 76)'; const INK3 = 'rgb(154 144 133)';
  const PAPER = 'rgb(250 249 245)'; const LINE = 'rgb(233 229 222)';

  return (
    <>
      <Header />
      <main className="min-h-screen" style={{ backgroundColor: PAPER }}>

        {/* ===== HERO — imagem + transformação + decisão sempre visível ===== */}
        <section className="relative">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 pb-4">
            <Link href={'/cursos' as any} className="group inline-flex items-center gap-2 text-sm font-medium" style={{ color: INK3 }}>
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.25} />
              <span>{t('cdp.back')}</span>
            </Link>
          </div>

          <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-14 grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-8">
            {/* Coluna editorial */}
            <div className="lg:col-span-7 min-w-0">
              {/* eyebrow */}
              <div className="flex items-center gap-2.5 mb-5">
                {course.level && <span className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: 'rgb(180 88 58)' }}>{course.level}</span>}
                {course.category && <><span style={{ color: LINE }}>·</span><span className="text-xs font-medium uppercase tracking-[0.08em]" style={{ color: INK3 }}>{course.category}</span></>}
              </div>

              {/* título grande, confiante */}
              <h1 className="font-display font-bold tracking-[-0.02em] text-balance" style={{ fontSize: 'clamp(2.5rem, 6.5vw, 4rem)', lineHeight: 1.02, color: INK }}>
                {course.title}
              </h1>

              {/* subtítulo = a transformação */}
              {course.subtitle && (
                <p className="mt-6 text-pretty" style={{ fontSize: '1.3rem', lineHeight: 1.5, color: INK2 }}>{course.subtitle}</p>
              )}

              {/* ficha técnica — sinais de peso */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm" style={{ color: INK2 }}>
                {modules.length > 0 && <span className="inline-flex items-center gap-2"><Layers className="h-4 w-4" strokeWidth={1.75} style={{ color: INK3 }} /> {modules.length} módulos</span>}
                {lessonCount > 0 && <span className="inline-flex items-center gap-2"><PlayCircle className="h-4 w-4" strokeWidth={1.75} style={{ color: INK3 }} /> {lessonCount} aulas</span>}
                {course.duration && <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" strokeWidth={1.75} style={{ color: INK3 }} /> {course.duration}</span>}
                {course.enrollments_count > 0 && <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" strokeWidth={1.75} style={{ color: INK3 }} /> {course.enrollments_count}</span>}
                {hasRating && <span className="inline-flex items-center gap-1.5" style={{ color: 'rgb(180 88 58)' }}><Star className="h-4 w-4 fill-current" /> {Number(course.rating_avg).toFixed(1)}</span>}
              </div>
            </div>

            {/* Cartão de decisão — herói, sticky */}
            <aside className="lg:col-span-5 lg:sticky lg:top-20 self-start">
              <div className="rounded-2xl overflow-hidden bg-white" style={{ border: `1px solid ${LINE}`, boxShadow: '0 8px 30px -12px rgba(66,61,55,0.22)' }}>
                {/* imagem hero do curso (a real ignora isto) */}
                {course.hero_image_url && (
                  <div className="aspect-[16/9] w-full overflow-hidden" style={{ backgroundColor: 'rgb(245 243 239)' }}>
                    <img src={course.hero_image_url} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6">
                  {lessonCount === 0 ? (
                    <div className="rounded-xl p-4 text-sm font-medium text-center" style={{ backgroundColor: 'rgb(254 252 232)', color: 'rgb(146 64 14)' }}>{t('cdp.coming_soon')}</div>
                  ) : enrolled ? (
                    <Link href={`/learn/curso/${course.id}/continuar` as any} className="btn-primary w-full inline-flex items-center justify-center gap-2 py-3.5 text-base font-semibold">{t('cdp.go_to_course')}</Link>
                  ) : (
                    <>
                      {/* preço — "Grátis" trabalha */}
                      <div className="mb-5">
                        {isFree ? (
                          <div className="flex items-baseline gap-2.5">
                            <span className="font-display font-bold" style={{ fontSize: '2.75rem', lineHeight: 1, color: 'rgb(15 138 128)' }}>Grátis</span>
                            <span className="text-sm font-medium" style={{ color: INK3 }}>acesso completo</span>
                          </div>
                        ) : (
                          <div className="font-display font-bold" style={{ fontSize: '2.75rem', lineHeight: 1, color: INK }}>{fmtCents(course.price_cents, course.currency || 'EUR')}</div>
                        )}
                      </div>
                      <EnrollButton courseId={course.id} priceLabel={isFree ? 'Grátis' : fmtCents(course.price_cents, course.currency || 'EUR')} courseTitle={course.title} />
                    </>
                  )}
                  {/* selos de confiança — no momento da decisão */}
                  <div className="mt-6 pt-5 grid grid-cols-1 gap-3 text-sm border-t" style={{ borderColor: LINE, color: 'rgb(66 61 55)' }}>
                    <div className="flex items-center gap-2.5"><InfinityIcon className="h-4 w-4 flex-shrink-0" style={{ color: INK3 }} /><span>{t('cdp.benefit_lifetime')}</span></div>
                    <div className="flex items-center gap-2.5"><Award className="h-4 w-4 flex-shrink-0" style={{ color: INK3 }} /><span>{t('cdp.benefit_certificate')}</span></div>
                    <div className="flex items-center gap-2.5"><ShieldCheck className="h-4 w-4 flex-shrink-0" style={{ color: INK3 }} /><span>{t('cdp.benefit_refund')}</span></div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ===== O QUE VAIS CONSEGUIR — primeiro, é o que vende ===== */}
        {topics.length > 0 && (
          <section style={{ backgroundColor: 'white', borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
            <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
              <div className="max-w-2xl mb-10">
                <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'rgb(180 88 58)' }}>O que vais dominar</span>
                <h2 className="font-display font-bold tracking-tight mt-3" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', lineHeight: 1.1, color: INK }}>{t('cdp.what_youll_learn')}</h2>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                {topics.map((tp: string, i: number) => (
                  <li key={i} className="flex items-start gap-3.5">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: 'rgb(214 239 236)' }}><Check className="h-3.5 w-3.5" strokeWidth={3} style={{ color: 'rgb(12 107 99)' }} /></span>
                    <span style={{ fontSize: '1.05rem', lineHeight: 1.5, color: 'rgb(66 61 55)' }}>{tp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ===== CORPO: currículo (espinha) + lateral ===== */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-14">

            {/* CURRÍCULO — a peça mais escrutinada, com peso */}
            {modules.length > 0 && (
              <div>
                <div className="flex items-baseline justify-between mb-7 flex-wrap gap-2">
                  <h2 className="font-display font-bold tracking-tight" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', lineHeight: 1.1, color: INK }}>{t('cdp.content')}</h2>
                  <span className="text-sm font-medium" style={{ color: INK3 }}>{modules.length} módulos{lessonCount > 0 ? ` · ${lessonCount} aulas` : ''}</span>
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
                  {modules.map((m: any, i: number) => (
                    <div key={i} className="bg-white transition-colors hover:bg-[rgb(250,249,245)]" style={{ borderTop: i > 0 ? `1px solid ${LINE}` : 'none' }}>
                      <div className="p-5 sm:p-6">
                        <div className="min-w-0">
                            <h3 className="font-semibold flex items-baseline gap-2.5" style={{ fontSize: '1.1rem', color: INK }}>
                              <span className="font-display font-bold tabular-nums" style={{ fontSize: '0.95rem', color: 'rgb(213 124 95)' }}>{String(i + 1).padStart(2, '0')}</span>
                              <span>{((m.title || m.name || t('cdp.module_n', { n: i + 1 })) as string).replace(/^M[oó]dulo\s*\d+\s*[:\-–.]\s*/i, '')}</span>
                            </h3>
                            {m.description && <p className="mt-1.5 text-sm leading-relaxed" style={{ color: INK2 }}>{m.description}</p>}
                            {Array.isArray(m.lessons) && m.lessons.length > 0 && (
                              <ul className="mt-3 space-y-2">
                                {m.lessons.map((l: any, j: number) => (
                                  <li key={j} className="flex items-center gap-2.5 text-sm" style={{ color: INK2 }}>
                                    <PlayCircle className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} style={{ color: INK3 }} />
                                    <span>{l.title || l.name || l}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SOBRE — contexto, depois do que importa */}
            {course.description && (
              <div>
                <h2 className="font-display font-bold tracking-tight mb-5" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', lineHeight: 1.1, color: INK }}>{t('cdp.about')}</h2>
                <div className="leading-[1.8] whitespace-pre-wrap" style={{ color: 'rgb(66 61 55)', fontSize: '1.08rem' }}>{course.description}</div>
              </div>
            )}
          </div>

          {/* Lateral: instrutor + garantia (só se houver) */}
          <aside className="lg:col-span-4 space-y-4">
            {instructor && (
              <div className="rounded-2xl p-6 bg-white sticky top-20" style={{ border: `1px solid ${LINE}` }}>
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] mb-5" style={{ color: INK3 }}>{t('cdp.instructor')}</h3>
                <div className="flex items-center gap-3.5">
                  {instructor.avatar_url ? <img src={instructor.avatar_url} alt={instructor.display_name} className="w-14 h-14 rounded-full object-cover" /> : <div className="w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-lg" style={{ backgroundColor: 'rgb(245 243 239)', color: 'rgb(66 61 55)' }}>{instructor.display_name?.[0]?.toUpperCase()}</div>}
                  <div className="font-semibold" style={{ color: INK }}>{instructor.display_name}</div>
                </div>
                {instructor.bio && <p className="mt-4 text-sm leading-relaxed" style={{ color: INK2 }}>{instructor.bio}</p>}
              </div>
            )}
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgb(240 253 250)', border: '1px solid rgb(153 246 228)' }}>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'rgb(13 148 136)' }} />
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: 'rgb(19 78 74)' }}>{t('cdp.guarantee_h')}</h4>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgb(17 94 89)' }}>{t('cdp.guarantee_p')}</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-10">
          <div className="rounded-xl px-4 py-3 text-xs text-center" style={{ backgroundColor: 'rgb(245 243 239)', color: INK3 }}>
            Pré-visualização — reestruturação da página de curso (hierarquia, ordem, peso, ritmo). Paleta atual mantida.
          </div>
        </div>

        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
