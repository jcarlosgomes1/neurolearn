import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { Link } from '@/i18n/routing';
import { Sparkles, Check, X } from 'lucide-react';

export const metadata = { title: 'All-Access · NeuroLearn' };

function fmt(c: number) { return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(c/100); }

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createClient();
  const { data: enabledD } = await sb.rpc('nl_monetization_get', { p_key: 'subscription_b2c_enabled' });
  const { data: monthlyD } = await sb.rpc('nl_monetization_get_numeric', { p_key: 'subscription_b2c_monthly_cents', p_default: 1990 });
  const { data: yearlyD } = await sb.rpc('nl_monetization_get_numeric', { p_key: 'subscription_b2c_yearly_cents', p_default: 19900 });
  const enabled = String(enabledD).toLowerCase() === 'true';
  const monthly = Number(monthlyD || 1990);
  const yearly = Number(yearlyD || 19900);
  const yearlyMonthlyEquiv = yearly / 12;
  const savePct = Math.round((1 - yearly/(monthly*12)) * 100);

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen">
        <section className="bg-gradient-to-br from-violet-700 via-brand-700 to-indigo-700 text-white">
          <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">All-Access</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-4 tracking-tight">Todos os cursos. Uma só subscrição.</h1>
            <p className="text-xl text-brand-100 max-w-2xl mx-auto">Acesso ilimitado a toda a biblioteca + novos cursos cada mês + certificados incluídos.</p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {!enabled ? (
            <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <h2 className="font-bold text-slate-900 text-xl mb-2">Em breve</h2>
              <p className="text-sm text-slate-600 mb-4">Subscription All-Access ainda não está activa. Junta-te à lista de espera.</p>
              <a href="mailto:hello@neurolearn.app?subject=Lista de espera All-Access" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg">
                Entrar na lista
              </a>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              <PlanCard label="Mensal" price={monthly} period="mês" cta="Subscrever mensal" />
              <PlanCard label="Anual" price={yearly} period="ano" perMonth={yearlyMonthlyEquiv} savePct={savePct} cta="Subscrever anual" featured />
            </div>
          )}

          <section className="mt-12">
            <h2 className="font-bold text-slate-900 text-2xl mb-6 text-center">Incluído em ambos os planos</h2>
            <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {[
                'Acesso ilimitado a TODOS os cursos publicados',
                'Novos cursos adicionados todos os meses',
                'Certificados incluídos (sem custo extra)',
                'Workshops corporate ao vivo (1/mês)',
                'AI Tutor 1:1 em cada lição',
                'Quizzes + assignments com feedback IA',
                'Cancela quando quiseres, sem fidelização',
                'Suporte prioritário',
              ].map((f) => (
                <div key={f} className="flex items-start gap-2 bg-white border border-slate-200 rounded-lg p-3">
                  <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{f}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 max-w-2xl mx-auto">
            <h2 className="font-bold text-slate-900 text-2xl mb-6 text-center">Perguntas frequentes</h2>
            <div className="space-y-3">
              {[
                ['Posso cancelar a qualquer momento?', 'Sim. Sem fidelização. Cancelas e mantens acesso até ao fim do período pago.'],
                ['E se eu já tiver comprado cursos individuais?', 'Mantens acesso vitalício a esses. A subscrição dá acesso ao resto.'],
                ['Há trial gratuito?', 'Sim, 14 dias gratuitos. Não pedimos cartão.'],
                ['Posso transferir para a minha empresa?', 'Para empresas, recomendamos o plano corporate com preços por seat.'],
              ].map(([q, a]) => (
                <details key={q as string} className="bg-white border border-slate-200 rounded-lg p-4">
                  <summary className="font-semibold text-slate-900 cursor-pointer">{q}</summary>
                  <p className="text-sm text-slate-600 mt-2">{a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function PlanCard({ label, price, period, perMonth, savePct, cta, featured }: any) {
  function fmt(c: number) { return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(c/100); }
  return (
    <div className={`bg-white rounded-2xl p-6 ${featured ? 'border-2 border-violet-500 ring-4 ring-violet-100' : 'border border-slate-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-slate-900 text-xl">{label}</h3>
        {savePct > 0 && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">Poupa {savePct}%</span>}
      </div>
      <div className="mb-4">
        <span className="text-4xl font-bold text-slate-900">{fmt(price)}</span>
        <span className="text-slate-500 ml-1">/{period}</span>
        {perMonth && <div className="text-xs text-slate-500 mt-1">≈ {fmt(perMonth)}/mês</div>}
      </div>
      <button disabled className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-brand-700 hover:opacity-90 text-white font-semibold rounded-lg opacity-60 cursor-not-allowed">
        {cta} (em breve)
      </button>
      <p className="text-[10px] text-slate-400 mt-2 text-center">Stripe checkout a chegar</p>
    </div>
  );
}
