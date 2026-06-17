import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { fmtCents } from '@/lib/utils/cn';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Clock, Award, Users, Star, CheckCircle, BookOpen, ArrowLeft, MessageCircle, ShieldCheck } from 'lucide-react';
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
      <main className="bg-white min-h-screen overflow-x-hidden">
        <section className="bg-gradient-to-br from-brand-50 via-white to-brand-50/30 border-b border-slate-200/60">
          <div className="max-w-6xl mx-auto px-4 py-7 sm:py-12">
            <Link
              href={'/cursos' as any}
              className="group inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-white/70 hover:bg-white border border-slate-200 hover:border-brand-300 text-slate-700 hover:text-brand-700 text-sm font-medium transition-all shadow-sm hover:shadow"
              aria-label={t('cdp.back')}>
              <ArrowLeft className="h-4 w-4 -ml-0.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.5} />
              <span>{t('cdp.back')}</span>
            </Link>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 min-w-0">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="text-5xl">{course.emoji || '📚'}</span>
                  {course.level && <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600">{course.level}</span>}
                  {course.featured && <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">{t('cdp.featured')}</span>}
                  <div className="ml-auto"><WishlistButton courseId={course.id} size="md" /></div>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">{course.title}</h1>
                {course.subtitle && <p className="mt-4 text-lg text-slate-600 text-pretty">{course.subtitle}</p>}
                {isFallback && (
                  <CourseTranslationRequest courseId={id} locale={locale} sourceLangName={usedLangName} />
                )}
                <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600">
                  {course.duration && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {course.duration}</span>}
                  {modules.length > 0 && <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {t('cdp.modules', { n: modules.length })}</span>}
                  {course.enrollments_count > 0 && <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {t('cdp.students', { n: course.enrollments_count })}</span>}
                  {course.rating_avg && <span className="flex items-center gap-1.5 text-amber-600"><Star className="h-4 w-4 fill-current" /> {Number(course.rating_avg).toFixed(1)} ({course.rating_count || 0})</span>}
                </div>
              </div>
              <aside className="lg:sticky lg:top-20 self-start">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
                  {lessonCount === 0 ? (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 font-medium text-center">{t('cdp.coming_soon')}</div>
                  ) : enrolled ? (
                    <Link href={`/learn/curso/${course.id}/continuar` as any}
                      className="btn-primary w-full inline-flex items-center justify-center gap-2 py-3 text-base font-semibold">
                      {t('cdp.go_to_course')}
                    </Link>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="text-3xl font-bold text-slate-900">{fmtCents(course.price_cents, course.currency || 'EUR')}</div>
                        <p className="text-xs text-slate-500 mt-1">{t('cdp.price_note')}</p>
                      </div>
                      <EnrollButton courseId={course.id} priceLabel={fmtCents(course.price_cents, course.currency || 'EUR')} courseTitle={course.title} />
                    </>
                  )}
                  <ul className="mt-6 space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>{t('cdp.benefit_lifetime')}</span></li>
                    <li className="flex items-start gap-2"><Award className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" /><span>{t('cdp.benefit_certificate')}</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>{t('cdp.benefit_refund')}</span></li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            {coursePaths.length > 0 && (
              <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 rounded-2xl p-5">
                <h2 className="text-base font-bold text-violet-700 mb-1 flex items-center gap-2"><BookOpen className="h-4 w-4" /> {t('cdp.in_paths_h')}</h2>
                <p className="text-sm text-slate-600 mb-4">{t('cdp.in_paths_sub')}</p>
                <div className="flex flex-col gap-2">
                  {coursePaths.map((p: any) => (
                    <Link key={p.id} href={`/aprender/percursos/${p.slug}` as any} className="group flex items-center gap-3 bg-white rounded-xl border border-violet-100 px-4 py-3 hover:border-violet-300 hover:shadow-sm transition-all min-w-0 max-w-full">
                      <span className="text-2xl flex-shrink-0">{p.emoji || '\u{1F393}'}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 group-hover:text-violet-700 transition-colors truncate">{p.title}</div>
                        {p.subtitle && <div className="text-xs text-slate-500 truncate">{p.subtitle}</div>}
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{t('cdp.in_paths_count', { n: p.course_count })}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {course.description && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('cdp.about')}</h2>
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{course.description}</div>
              </div>
            )}
            {topics.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('cdp.what_youll_learn')}</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {topics.map((tp: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" /><span>{tp}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {modules.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('cdp.content')}</h2>
                <div className="space-y-3">
                  {modules.map((m: any, i: number) => (
                    <div key={i} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900"><span className="text-brand-600 mr-2">{i + 1}.</span>{m.title || m.name || t('cdp.module_n', { n: i + 1 })}</h3>
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

            {/* Reviews */}
            <div className="border-t border-slate-100 pt-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                {t('cdp.reviews_h')}
              </h2>
              <p className="text-sm text-slate-500 mb-6">{t('cdp.reviews_sub')}</p>
              <CourseReviews
                courseId={course.id}
                currentUserId={user?.id}
                isInstructor={isInstructor}
              />
            </div>

            {/* Q&A */}
            <div className="border-t border-slate-100 pt-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-blue-500" />
                {t('cdp.qa_h')}
              </h2>
              <p className="text-sm text-slate-500 mb-6">{t('cdp.qa_sub')}</p>
              <CourseQA
                courseId={course.id}
                currentUserId={user?.id}
              />
            </div>
          </div>

          {instructor && (
            <aside>
              <div className="bg-slate-50 rounded-xl p-6 sticky top-20">
                <h3 className="font-semibold text-slate-900 mb-4">{t('cdp.instructor')}</h3>
                <div className="flex items-center gap-3">
                  {instructor.avatar_url ? <img src={instructor.avatar_url} alt={instructor.display_name} className="w-12 h-12 rounded-full" /> : <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">{instructor.display_name?.[0]?.toUpperCase()}</div>}
                  <div><div className="font-medium text-slate-900">{instructor.display_name}</div></div>
                </div>
                {instructor.bio && <p className="mt-4 text-sm text-slate-600 leading-relaxed">{instructor.bio}</p>}
              </div>
              <div className="mt-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-emerald-900">{t('cdp.guarantee_h')}</h4>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      {t('cdp.guarantee_p')}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </section>

        <Footer data={blocks.footer_brand || {}} />
      </main>
    </>
  );
}
