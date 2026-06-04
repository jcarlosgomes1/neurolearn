import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { BookOpen, Lock, Building2, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Course {
  id: string; slug: string; title: string; description: string | null;
  language: string; level: string; duration_hours: number;
  org_id: string | null; visibility: string; published: boolean;
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const [{ data: courses }, { data: ctx }] = await Promise.all([
    sb.rpc('nl_courses_visible_to_user', { p_limit: 100 }),
    sb.rpc('nl_user_learning_context'),
  ]);
  const list = (courses as Course[]) || [];
  const context = ctx as { authenticated: boolean; has_org: boolean; org_id?: string; org_name?: string; org_slug?: string; has_catalog_access: boolean } | null;
  
  const orgCourses = list.filter((c) => c.org_id && context?.org_id && c.org_id === context.org_id);
  const publicCourses = list.filter((c) => c.visibility === 'public');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-brand-600" /> Catálogo
        </h1>
        {context?.has_org ? (
          <p className="text-sm text-slate-500 mt-1">
            Acesso como membro de <strong>{context.org_name}</strong>
            {!context.has_catalog_access && <> · só cursos da empresa (sem acesso ao catálogo público)</>}
          </p>
        ) : (
          <p className="text-sm text-slate-500 mt-1">Catálogo público de cursos</p>
        )}
      </div>
      
      {orgCourses.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-600" /> Cursos da tua empresa
            <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">{orgCourses.length}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgCourses.map((c) => <CourseCard key={c.id} course={c} locale={locale} isOrgPrivate />)}
          </div>
        </section>
      )}
      
      {publicCourses.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600" /> Catálogo público
            <span className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">{publicCourses.length}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicCourses.map((c) => <CourseCard key={c.id} course={c} locale={locale} />)}
          </div>
        </section>
      )}
      
      {list.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          {context?.has_org && !context.has_catalog_access ? (
            <>
              <Lock className="h-6 w-6 mx-auto text-slate-400 mb-2" />
              A tua empresa ainda não tem cursos. Pede ao administrador para publicar conteúdos.
            </>
          ) : (
            <>Sem cursos no catálogo público ainda.</>
          )}
        </div>
      )}
      
      {context?.has_org && !context.has_catalog_access && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
          💡 A tua empresa pode adicionar o add-on <strong>Catalog Access</strong> para os colaboradores acederem ao catálogo público completo.
        </div>
      )}
    </div>
  );
}

function CourseCard({ course, locale, isOrgPrivate }: { course: Course; locale: string; isOrgPrivate?: boolean }) {
  return (
    <Link href={`/cursos/${course.slug}` as any} className="bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition p-4 group">
      <div className="flex items-start gap-2">
        {isOrgPrivate ? (
          <div className="w-1.5 h-12 rounded flex-shrink-0" style={{ background: 'var(--org-primary, #6366f1)' }} />
        ) : (
          <BookOpen className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 truncate">{course.title}</h3>
          {course.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description}</p>}
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{course.level}</span>
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{course.language?.toUpperCase()}</span>
            <span className="text-slate-400">{course.duration_hours}h</span>
            {isOrgPrivate && <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">empresa</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
