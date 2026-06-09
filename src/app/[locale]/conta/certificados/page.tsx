import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Award, ShieldCheck, ExternalLink, GraduationCap } from 'lucide-react';

export const dynamic = 'force-dynamic';
export async function generateMetadata() { return { title: 'Certificados · NeuroLearn' }; }

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data } = await sb
    .from('nl_certificates')
    .select('id, course_title, certificate_number, verification_code, grade, skills, issued_at, course_level')
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .order('issued_at', { ascending: false });

  const certs = data || [];

  return (
    <main className="bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-fuchsia-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Award className="h-3.5 w-3.5" /> A minha conta
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Certificados</h1>
          <p className="text-sm text-slate-600 mt-1.5">Os certificados que conquistaste ao concluir cursos.</p>
        </header>

        {certs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 sm:p-14 text-center">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white items-center justify-center mb-5 shadow-md">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Ainda não tens certificados</h2>
            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
              Conclui um curso para receberes o teu primeiro certificado, com verificação pública e pronto a partilhar no LinkedIn.
            </p>
            <Link
              href={'/cursos' as any}
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all">
              Explorar cursos
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {certs.map((c: any) => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex h-11 w-11 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white items-center justify-center shadow-md shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  {c.grade != null && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                      {c.grade}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 mt-4 leading-snug">{c.course_title}</h3>
                <div className="text-xs text-slate-500 mt-1.5 space-y-0.5">
                  <div>Nº {c.certificate_number}</div>
                  {c.issued_at && <div>Emitido a {new Date(c.issued_at).toLocaleDateString(locale)}</div>}
                </div>

                {Array.isArray(c.skills) && c.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {c.skills.slice(0, 4).map((s: string, i: number) => (
                      <span key={i} className="text-[11px] text-slate-600 bg-slate-100 rounded-md px-2 py-0.5">{s}</span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-4">
                  <a
                    href={`/${locale}/certificate/${c.verification_code}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-fuchsia-700 hover:text-fuchsia-800 hover:gap-2 transition-all">
                    <ShieldCheck className="h-4 w-4" /> Ver e verificar <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
