import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { myPlacementsAction } from '../../empresa/[slug]/talent-actions';
import { Link } from '@/i18n/routing';
import { Header } from '@/components/layout/Header';
import { Briefcase, ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Os Meus Pedidos · Talent' };
export const dynamic = 'force-dynamic';

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  introduced: { label: 'Empresa interessada', color: 'bg-blue-100 text-blue-800' },
  interested: { label: 'Em contacto', color: 'bg-violet-100 text-violet-800' },
  interviewed: { label: 'Entrevista realizada', color: 'bg-violet-100 text-violet-800' },
  offered: { label: 'Oferta recebida', color: 'bg-amber-100 text-amber-800' },
  hired: { label: 'Contratado/a 🎉', color: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Não selecionado', color: 'bg-rose-100 text-rose-700' },
};

function fmt(cents?: number | null) {
  if (!cents) return '';
  return '€' + (cents / 100).toLocaleString();
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  
  const r = await myPlacementsAction();
  const placements = r.ok ? r.placements : [];
  
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <Link href={'/talento' as any} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-emerald-700 mb-3">
              <ArrowLeft className="h-4 w-4" /> Voltar ao perfil
            </Link>
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-emerald-600" />
              <h1 className="text-2xl font-bold text-slate-900">Os Meus Pedidos</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">Empresas que se interessaram pelo teu perfil.</p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-6">
          {placements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Ainda sem interesse</h3>
              <p className="text-sm text-slate-500">Mantém o teu perfil actualizado e visível. As empresas vêm ter contigo.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {placements.map((p: any) => {
                const stage = STAGE_LABELS[p.pipeline_status] || STAGE_LABELS.introduced;
                return (
                  <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                      <div className="flex items-center gap-3">
                        {p.org_logo ? (
                          <img src={p.org_logo} alt={p.org_name} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center font-bold">
                            {p.org_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{p.org_name}</div>
                          {p.job_title && <div className="text-xs text-slate-500">{p.job_title}</div>}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stage.color}`}>{stage.label}</span>
                    </div>
                    {p.annual_salary_cents && p.pipeline_status === 'hired' && (
                      <div className="text-sm font-semibold text-emerald-700 mt-2">
                        Salário: {fmt(p.annual_salary_cents)}/ano
                      </div>
                    )}
                    <div className="text-xs text-slate-400 mt-2">{new Date(p.created_at).toLocaleDateString(locale)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
