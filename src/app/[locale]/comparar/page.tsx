import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/sections/Footer';
import { Link } from '@/i18n/routing';
import { Check, X, Sparkles, ArrowRight, Award } from 'lucide-react';

export const metadata = { title: 'Comparar plataformas · NeuroLearn', description: 'Comparação honesta entre NeuroLearn, Udemy, Coursera e LinkedIn Learning.' };

const COMPARISON = [
  { feature: 'Comissão para instrutores', us: '70%', them: { udemy: '37-97% (variável)', coursera: '50%', linkedin: 'Salário fixo' } },
  { feature: 'Tutor com dúvidas 24/7', us: true, them: { udemy: false, coursera: false, linkedin: false } },
  { feature: 'Talent marketplace integrado', us: true, them: { udemy: false, coursera: 'Parcial', linkedin: 'Sim, separado' } },
  { feature: 'Certificados verificáveis', us: true, them: { udemy: true, coursera: true, linkedin: true } },
  { feature: 'B2B Multi-tenant white-label', us: true, them: { udemy: 'Udemy Business', coursera: 'Sim', linkedin: 'Sim' } },
  { feature: 'Upload doc → curso gerado', us: true, them: { udemy: false, coursera: false, linkedin: false } },
  { feature: 'Comunidade activa', us: true, them: { udemy: 'Pouca', coursera: 'Pouca', linkedin: 'Pouca' } },
  { feature: 'Suporte humano', us: true, them: { udemy: 'Tickets', coursera: 'Tickets', linkedin: 'Limitado' } },
  { feature: 'Preço mensal entry', us: '€19', them: { udemy: 'Pay-per-course', coursera: '€49', linkedin: '€29' } },
];

function Cell({ value }: { value: any }) {
  if (value === true) return <Check className="h-5 w-5 text-emerald-600 mx-auto" />;
  if (value === false) return <X className="h-5 w-5 text-rose-400 mx-auto" />;
  return <span className="text-sm text-slate-700">{value}</span>;
}

export default async function Page() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.25),transparent_60%)]" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 backdrop-blur border border-violet-400/30 text-xs font-semibold mb-5">
              <Sparkles className="h-3 w-3 text-violet-300" /> Comparação honesta
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
              NeuroLearn <span className="text-slate-400">vs</span> a concorrência
            </h1>
            <p className="text-lg text-slate-300 max-w-xl mx-auto">Sem inflar números, sem esconder fraquezas. Vê tu mesmo.</p>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Funcionalidade</th>
                      <th className="p-4 text-center bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
                        <div className="inline-flex items-center gap-1 font-bold"><Award className="h-3.5 w-3.5" /> NeuroLearn</div>
                      </th>
                      <th className="p-4 text-center text-xs uppercase tracking-wider text-slate-500 font-bold">Udemy</th>
                      <th className="p-4 text-center text-xs uppercase tracking-wider text-slate-500 font-bold">Coursera</th>
                      <th className="p-4 text-center text-xs uppercase tracking-wider text-slate-500 font-bold">LinkedIn L.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((row, i) => (
                      <tr key={row.feature} className={i % 2 === 0 ? 'bg-slate-50/60' : ''}>
                        <td className="p-4 text-sm font-medium text-slate-800">{row.feature}</td>
                        <td className="p-4 text-center bg-gradient-to-br from-violet-50 to-fuchsia-50 font-bold text-violet-700"><Cell value={row.us} /></td>
                        <td className="p-4 text-center"><Cell value={row.them.udemy} /></td>
                        <td className="p-4 text-center"><Cell value={row.them.coursera} /></td>
                        <td className="p-4 text-center"><Cell value={row.them.linkedin} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-slate-400 italic mt-4 text-center">Dados verificados Jun 2026. Reportamos imprecisões em comparar@neurolearn.com.</p>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <Award className="h-12 w-12 mx-auto mb-5" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-5">Experimenta sem compromissos</h2>
            <p className="text-violet-100 mb-7 max-w-lg mx-auto">Primeira lição grátis em todos os cursos. Sem cartão. Cancela quando quiseres.</p>
            <Link href={'/register' as any} className="inline-flex items-center gap-1.5 px-7 py-3 bg-white text-violet-700 font-semibold rounded-xl shadow-xl hover:scale-105 transition-transform">
              Começar agora <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer data={{ brand: 'NeuroLearn' }} />
    </>
  );
}
