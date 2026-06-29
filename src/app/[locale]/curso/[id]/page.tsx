import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { fmtCents } from '@/lib/utils/cn';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Clock, Award, Users, Star, CheckCircle, BookOpen, ArrowLeft, MessageCircle, ShieldCheck, Sparkles, Layers, PlayCircle } from 'lucide-react';
import { EnrollButton } from '@/components/shared/EnrollButton';
import { CourseTranslationRequest } from '@/components/shared/CourseTranslationRequest';
import { CourseStructuredData, BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import { CourseReviews } from '@/components/course/CourseReviews';
import { CourseQA } from '@/components/course/CourseQA';
import { WishlistButton } from '@/components/course/WishlistButton';
import { CourseViewTracker } from '@/components/telemetry/CourseViewTracker';
import type { Metadata } from 'next';

export const revalidate = 300; // ISR 5 min — refresca rating/reviews

const SITE_URL = 'https://neurolearn-rosy.vercel.app';

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  const { id, locale } = await params;
  const sb = await createClient();
  const { data: course } = await sb.from('nl_courses')
    .select('title, subtitle, description, emoji, hero_image_url')
    .eq('id', id).eq('published', true).maybeSingle();

  if (!course) return { title: 'Curso não encontrado' };

  const title = course.title as string;
  const desc = (course.subtitle || course.description || `${title} no NeuroLearn`).toString().slice(0, 160);
  const ogImage = course.hero_image_url || `${SITE_URL}/${locale}/opengraph-image`;

  return {
    title,
    description: desc,
    alternates: {
      canonical: `${SITE_URL}/${locale}/curso/${id}`,
      languages: {
        'pt': `${SITE_URL}/pt/curso/${id}`,
        'en': `${SITE_URL}/en/curso/${id}`,
        'es': `${SITE_URL}/es/curso/${id}`,
        'fr': `${SITE_URL}/fr/curso/${id}`,
      },
    },
    openGraph: {
      type: 'website',
      title, description: desc,
      url: `${SITE_URL}/${locale}/curso/${id}`,
      images: [ogImage],
      siteName: 'NeuroLearn',
    },
    twitter: { card: 'summary_large_image', title, description: desc, images: [ogImage] },
  };
}

export default async function CoursePage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const t = await getTranslations();
  const sb = await createClient();
  const { data: course } = await sb.from('nl_courses').select('*').eq('id', id).eq('published', true).maybeSingle();
  if (!course) notFound();

  // i18n: usar a tradução do locale (publicada) com fallback à língua de origem
  const langNames: Record<string, string> = { pt: 'Português', en: 'English', es: 'Español', fr: 'Français' };
  let isFallback = false;
  let usedLangName = langNames[locale] || locale.toUpperCase();
  try {
    const { data: i18n } = await sb.rpc('nl_course_i18n', { p_id: id, p_lang: locale });
    if (i18n) {
      if (i18n.title) course.title = i18n.title;
      if (i18n.subtitle) course.subtitle = i18n.subtitle;
      if (i18n.description) course.description = i18n.description;
      if (i18n.modules != null) course.modules = i18n.modules;
      if (i18n.topics != null) course.topics = i18n.topics;
      isFallback = !!i18n.is_fallback;
      usedLangName = langNames[i18n.used_lang] || (i18n.used_lang || locale).toUpperCase();
    }
  } catch {
    // fallback: mantém conteúdo de origem já carregado
  }

  // Verificar se user está logged + se é instrutor deste curso
  const { data: { user } } = await sb.auth.getUser();
  let isInstructor = false;
  if (user && course.instructor_id) {
    isInstructor = course.instructor_id === user.id;
  }

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
  const { data: pathsData } = await sb.rpc('nl_course_learning_paths', { p_course_id: id });
  const coursePaths = ((pathsData as { paths?: any[] })?.paths) || [];
  const lessonCount = modules.reduce((s: number, m: any) => s + (Array.isArray(m?.lessons) ? m.lessons.length : 0), 0);

  return (
    <>
      <CourseViewTracker courseId={course.id} priceCents={course.price_cents} category={course.category} />
      <CourseStructuredData course={{
        title: course.title, description: course.description || course.subtitle,
        slug: course.slug || course.id, duration_hours: course.duration_hours,
        level: course.level, language: course.language || locale,
        instructor_name: instructor?.display_name, instructor_id: instructor?.id,
        price_cents: course.price_cents, currency: course.currency,
        rating_avg: course.rating_avg, rating_count: course.rating_count,
        skills: course.skills, created_at: course.created_at, cover_url: course.cover_url,
      }} baseUrl={SITE_URL} />
      <BreadcrumbStructuredData items={[
        { name: 'Início', href: `/${locale}` },
        { name: t('nav.courses'), href: `/${locale}/cursos` },
        { name: course.title, href: `/${locale}/curso/${id}` },
      ]} baseUrl={SITE_URL} />
      <Header />
      <main className="min-h-screen" style={{ backgroundColor: 'rgb(250 249 245)' }}>
        {/* ===== TOPO: voltar ===== */}
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 pb-3">
          <Link href={'/cursos' as any} className="group inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'rgb(154 144 133)' }} aria-label={t('cdp.back')}>
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.25} />
            <span>{t('cdp.back')}</span>
          </Link>
        </div>

        {/* ===== GRID DE PÁGINA INTEIRA: conteúdo (esq) + cartão sticky (dir) ===== */}
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10 items-start">

          {/* ===================== COLUNA PRINCIPAL ===================== */}
          <div className="lg:col-span-8 min-w-0">
            {/* HERO */}
            <div className="flex items-center gap-2.5 mb-5">
              {course.level && <span className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: 'rgb(180 88 58)' }}>{course.level}</span>}
              {course.featured && <><span style={{ color: 'rgb(233 229 222)' }}>·</span><span className="inline-flex items-center gap-1 text-xs font-semibold tracking-wide uppercase" style={{ color: 'rgb(180 83 9)' }}><Sparkles className="h-3.5 w-3.5" /> {t('cdp.featured')}</span></>}
              <div className="ml-auto"><WishlistButton courseId={course.id} size="md" /></div>
            </div>
            <h1 className="font-display font-bold tracking-[-0.02em] text-balance" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', lineHeight: 1.04, color: 'rgb(28 25 22)' }}>{course.title}</h1>
            {course.subtitle && <p className="mt-5 text-pretty" style={{ fontSize: '1.25rem', lineHeight: 1.5, color: 'rgb(92 84 76)' }}>{course.subtitle}</p>}
            {isFallback && <CourseTranslationRequest courseId={id} locale={locale} sourceLangName={usedLangName} />}
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm" style={{ color: 'rgb(92 84 76)' }}>
              {modules.length > 0 && <span className="inline-flex items-center gap-2"><Layers className="h-4 w-4" strokeWidth={1.75} style={{ color: 'rgb(154 144 133)' }} /> {t('cdp.modules', { n: modules.length })}</span>}
              {lessonCount > 0 && <span className="inline-flex items-center gap-2"><PlayCircle className="h-4 w-4" strokeWidth={1.75} style={{ color: 'rgb(154 144 133)' }} /> {lessonCount} aulas</span>}
              {course.duration && <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" strokeWidth={1.75} style={{ color: 'rgb(154 144 133)' }} /> {course.duration}</span>}
              {course.enrollments_count > 0 && <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" strokeWidth={1.75} style={{ color: 'rgb(154 144 133)' }} /> {t('cdp.students', { n: course.enrollments_count })}</span>}
              {course.rating_avg && <span className="inline-flex items-center gap-1.5" style={{ color: 'rgb(180 88 58)' }}><Star className="h-4 w-4 fill-current" /> {Number(course.rating_avg).toFixed(1)} <span style={{ color: 'rgb(168 161 151)' }}>({course.rating_count || 0})</span></span>}
            </div>

            {/* PERCURSOS */}
            {coursePaths.length > 0 && (
              <div className="mt-10 rounded-2xl p-5" style={{ backgroundColor: 'white', border: '1px solid rgb(233 229 222)' }}>
                <h2 className="text-base font-bold mb-1 flex items-center gap-2" style={{ color: 'rgb(180 88 58)' }}><BookOpen className="h-4 w-4" /> {t('cdp.in_paths_h')}</h2>
                <p className="text-sm mb-4" style={{ color: 'rgb(92 84 76)' }}>{t('cdp.in_paths_sub')}</p>
                <div className="flex flex-col gap-2">
                  {coursePaths.map((p: any) => (
                    <Link key={p.id} href={`/percursos/${p.slug}` as any} className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all min-w-0 max-w-full" style={{ border: '1px solid rgb(233 229 222)' }}>
                      <span className="text-2xl flex-shrink-0">{p.emoji || '\u{1F393}'}</span>
                      <div className="min-w-0 flex-1"><div className="font-semibold truncate" style={{ color: 'rgb(28 25 22)' }}>{p.title}</div>{p.subtitle && <div className="text-xs truncate" style={{ color: 'rgb(121 114 104)' }}>{p.subtitle}</div>}</div>
                      <span className="text-xs flex-shrink-0" style={{ color: 'rgb(154 144 133)' }}>{t('cdp.in_paths_count', { n: p.course_count })}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* O QUE VAIS DOMINAR */}
            {topics.length > 0 && (
              <div className="mt-12">
                <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'rgb(180 88 58)' }}>{t('cdp.what_youll_learn')}</span>
                <h2 className="font-display font-bold tracking-tight mt-3 mb-7" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)', lineHeight: 1.1, color: 'rgb(28 25 22)' }}>{t('cdp.what_youll_learn')}</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {topics.map((tp: string, i: number) => (
                    <li key={i} className="flex items-start gap-3"><span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: 'rgb(214 239 236)' }}><CheckCircle className="h-3.5 w-3.5" strokeWidth={3} style={{ color: 'rgb(12 107 99)' }} /></span><span style={{ fontSize: '1rem', lineHeight: 1.5, color: 'rgb(66 61 55)' }}>{tp}</span></li>
                  ))}
                </ul>
              </div>
            )}

            {/* CURRÍCULO */}
            {modules.length > 0 && (
              <div className="mt-12">
                <div className="flex items-baseline justify-between mb-6 flex-wrap gap-2">
                  <h2 className="font-display font-bold tracking-tight" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)', lineHeight: 1.1, color: 'rgb(28 25 22)' }}>{t('cdp.content')}</h2>
                  <span className="text-sm font-medium" style={{ color: 'rgb(154 144 133)' }}>{t('cdp.modules', { n: modules.length })}{lessonCount > 0 ? ` · ${lessonCount} aulas` : ''}</span>
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgb(233 229 222)' }}>
                  {modules.map((m: any, i: number) => (
                    <div key={i} className="bg-white transition-colors hover:bg-[rgb(250,249,245)]" style={{ borderTop: i > 0 ? '1px solid rgb(233 229 222)' : 'none' }}>
                      <div className="p-5 sm:p-6">
                        <div className="min-w-0">
                          <h3 className="font-semibold flex items-baseline gap-2.5" style={{ fontSize: '1.1rem', color: 'rgb(28 25 22)' }}>
                            <span className="font-display font-bold tabular-nums" style={{ fontSize: '0.95rem', color: 'rgb(213 124 95)' }}>{String(i + 1).padStart(2, '0')}</span>
                            <span>{((m.title || m.name || t('cdp.module_n', { n: i + 1 })) as string).replace(/^M[oó]dulo\s*\d+\s*[:\-–.]\s*/i, '')}</span>
                          </h3>
                          {m.description && <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'rgb(92 84 76)' }}>{m.description}</p>}
                          {Array.isArray(m.lessons) && m.lessons.length > 0 && (
                            <ul className="mt-3 space-y-2">
                              {m.lessons.map((l: any, j: number) => (<li key={j} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgb(92 84 76)' }}><PlayCircle className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} style={{ color: 'rgb(154 144 133)' }} /><span>{l.title || l.name || l}</span></li>))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SOBRE */}
            {course.description && (
              <div className="mt-12">
                <h2 className="font-display font-bold tracking-tight mb-5" style={{ fontSize: 'clamp(1.4rem, 3vw, 1.85rem)', lineHeight: 1.1, color: 'rgb(28 25 22)' }}>{t('cdp.about')}</h2>
                <div className="leading-[1.8] whitespace-pre-wrap" style={{ color: 'rgb(66 61 55)', fontSize: '1.05rem' }}>{course.description}</div>
              </div>
            )}

            {/* REVIEWS */}
            <div className="mt-12 pt-10" style={{ borderTop: '1px solid rgb(233 229 222)' }}>
              <h2 className="font-display text-2xl font-bold mb-1 flex items-center gap-2" style={{ color: 'rgb(28 25 22)' }}><Star className="h-6 w-6" style={{ color: 'rgb(245 158 11)', fill: 'rgb(245 158 11)' }} /> {t('cdp.reviews_h')}</h2>
              <p className="text-sm mb-6" style={{ color: 'rgb(121 114 104)' }}>{t('cdp.reviews_sub')}</p>
              <CourseReviews courseId={course.id} currentUserId={user?.id} isInstructor={isInstructor} />
            </div>

            {/* Q&A */}
            <div className="mt-12 pt-10" style={{ borderTop: '1px solid rgb(233 229 222)' }}>
              <h2 className="font-display text-2xl font-bold mb-1 flex items-center gap-2" style={{ color: 'rgb(28 25 22)' }}><MessageCircle className="h-6 w-6" style={{ color: 'rgb(59 130 246)' }} /> {t('cdp.qa_h')}</h2>
              <p className="text-sm mb-6" style={{ color: 'rgb(121 114 104)' }}>{t('cdp.qa_sub')}</p>
              <CourseQA courseId={course.id} currentUserId={user?.id} />
            </div>
          </div>

          {/* ===================== COLUNA STICKY (cartão) ===================== */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 self-start space-y-4">
            <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgb(233 229 222)', boxShadow: '0 8px 30px -12px rgba(66,61,55,0.22)' }}>
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
                    <div className="mb-5">
                      {(!course.price_cents || course.price_cents === 0) ? (
                        <div className="flex items-baseline gap-2.5"><span className="font-display font-bold" style={{ fontSize: '2.5rem', lineHeight: 1, color: 'rgb(15 138 128)' }}>Grátis</span></div>
                      ) : (
                        <><div className="font-display font-bold" style={{ fontSize: '2.5rem', lineHeight: 1, color: 'rgb(28 25 22)' }}>{fmtCents(course.price_cents, course.currency || 'EUR')}</div><p className="text-xs mt-2" style={{ color: 'rgb(121 114 104)' }}>{t('cdp.price_note')}</p></>
                      )}
                    </div>
                    <EnrollButton courseId={course.id} priceLabel={fmtCents(course.price_cents, course.currency || 'EUR')} courseTitle={course.title} />
                  </>
                )}
                <div className="mt-6 pt-5 grid grid-cols-1 gap-3 text-sm border-t" style={{ borderColor: 'rgb(233 229 222)', color: 'rgb(66 61 55)' }}>
                  <div className="flex items-center gap-2.5"><CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: 'rgb(154 144 133)' }} /><span>{t('cdp.benefit_lifetime')}</span></div>
                  <div className="flex items-center gap-2.5"><Award className="h-4 w-4 flex-shrink-0" style={{ color: 'rgb(154 144 133)' }} /><span>{t('cdp.benefit_certificate')}</span></div>
                  <div className="flex items-center gap-2.5"><ShieldCheck className="h-4 w-4 flex-shrink-0" style={{ color: 'rgb(154 144 133)' }} /><span>{t('cdp.benefit_refund')}</span></div>
                </div>
              </div>
            </div>
            {instructor && (
              <div className="rounded-2xl p-6 bg-white" style={{ border: '1px solid rgb(233 229 222)' }}>
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] mb-5" style={{ color: 'rgb(154 144 133)' }}>{t('cdp.instructor')}</h3>
                <div className="flex items-center gap-3.5">
                  {instructor.avatar_url ? <img src={instructor.avatar_url} alt={instructor.display_name} className="w-14 h-14 rounded-full object-cover" /> : <div className="w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-lg" style={{ backgroundColor: 'rgb(245 243 239)', color: 'rgb(66 61 55)' }}>{instructor.display_name?.[0]?.toUpperCase()}</div>}
                  <div className="font-semibold" style={{ color: 'rgb(28 25 22)' }}>{instructor.display_name}</div>
                </div>
                {instructor.bio && <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgb(92 84 76)' }}>{instructor.bio}</p>}
              </div>
            )}
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgb(240 253 250)', border: '1px solid rgb(153 246 228)' }}>
              <div className="flex items-start gap-2.5"><ShieldCheck className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'rgb(13 148 136)' }} /><div><h4 className="font-semibold text-sm" style={{ color: 'rgb(19 78 74)' }}>{t('cdp.guarantee_h')}</h4><p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgb(17 94 89)' }}>{t('cdp.guarantee_p')}</p></div></div>
            </div>
          </aside>
        </div>

        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
