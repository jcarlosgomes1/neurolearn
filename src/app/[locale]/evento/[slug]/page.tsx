import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { EventRegisterForm } from './EventRegisterForm';
import { SiteChrome } from '@/components/layout/SiteChrome';

export const dynamic = 'force-dynamic';

type Faq = { q?: string; a?: string };

export default async function Page({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const sb = await createClient();
  const { data } = await sb.rpc('nl_event_public_get', { p_slug: slug });
  const res = data as any;
  if (!res?.ok) notFound();
  const pag = res.pagina || {};
  const ins = res.inscricao || {};
  const beneficios: string[] = Array.isArray(pag.beneficios) ? pag.beneficios : [];
  const agenda: string[] = Array.isArray(pag.agenda_resumo) ? pag.agenda_resumo : [];
  const oradores: string[] = Array.isArray(pag.oradores) ? pag.oradores : [];
  const faq: Faq[] = Array.isArray(pag.faq) ? pag.faq : [];

  const idioma: string = res.idioma || 'pt';
  const roomUrl: string | null = res.room_status === 'ready' ? (res.room_url || null) : null;
  let labels = { registered: 'Inscrição confirmada!', addToCalendar: 'Adicionar ao calendário', openRoom: 'Abrir sala' };
  try {
    const tev = (await getTranslations({ locale: idioma })) as unknown as (k: string) => string;
    const r = tev('events.public.registered_title');
    const a = tev('events.public.add_to_calendar');
    const o = tev('events.public.open_room');
    labels = {
      registered: r && r !== 'events.public.registered_title' ? r : labels.registered,
      addToCalendar: a && a !== 'events.public.add_to_calendar' ? a : labels.addToCalendar,
      openRoom: o && o !== 'events.public.open_room' ? o : labels.openRoom,
    };
  } catch { /* fallback PT */ }

  return (
    <SiteChrome locale={locale} mainClassName="min-h-screen bg-slate-50" wrapInner={false}>
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{pag.hero_titulo || res.title}</h1>
          {pag.subtitulo && <p className="mt-4 text-lg text-white/90">{pag.subtitulo}</p>}
          <a href="#inscricao" className="inline-block mt-8 rounded-xl bg-white text-violet-700 px-6 py-3 font-semibold hover:bg-white/90 transition">{pag.cta_texto || 'Inscrever-me'}</a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        {beneficios.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">O que vais ganhar</h2>
            <ul className="space-y-2">
              {beneficios.map((b, i) => (<li key={i} className="flex gap-3 text-slate-700"><span className="text-violet-600 font-bold">›</span><span>{b}</span></li>))}
            </ul>
          </section>
        )}

        {agenda.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Programa</h2>
            <ol className="space-y-2">
              {agenda.map((a, i) => (<li key={i} className="flex gap-3 text-slate-700"><span className="w-6 h-6 shrink-0 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">{i + 1}</span><span>{a}</span></li>))}
            </ol>
          </section>
        )}

        {oradores.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Quem vais ouvir</h2>
            <ul className="flex flex-wrap gap-2">
              {oradores.map((o, i) => (<li key={i} className="rounded-full bg-white border border-slate-200 px-3 py-1 text-sm text-slate-700">{o}</li>))}
            </ul>
          </section>
        )}

        <section id="inscricao" className="scroll-mt-6">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">Inscrição</h2>
            {ins.oferta && <p className="mt-1 text-sm text-slate-500">{ins.oferta}</p>}
            <div className="mt-5">
              <EventRegisterForm slug={slug} locale={locale} consentText={ins.consentimento_texto || ''} successText={ins.mensagem_sucesso || ''} eventAt={res.event_at || null} roomUrl={roomUrl} labels={labels} />
            </div>
          </div>
        </section>

        {faq.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Perguntas frequentes</h2>
            <div className="space-y-3">
              {faq.map((f, i) => (<div key={i} className="rounded-xl bg-white border border-slate-200 p-4"><div className="font-medium text-slate-900">{f.q}</div>{f.a && <div className="mt-1 text-sm text-slate-600">{f.a}</div>}</div>))}
            </div>
          </section>
        )}
      </div>
    </SiteChrome>
  );
}
