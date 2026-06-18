import { seoMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getHomeBlocks } from '@/lib/api/home-blocks';
import { Mail, MessageSquare, Clock, MapPin } from 'lucide-react';
import { ContactForm } from './ContactForm';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  return seoMetadata('marketing', 'contacto', locale, { title: `${safeT(t, 'contact.title', 'Contacto')} · NeuroLearn` });
}

function safeT(t: any, key: string, fb: string): string {
  try { const v = t(key); if (v && typeof v === 'string' && v !== key) return v; } catch {}
  return fb;
}

export default async function Page({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ topic?: string; subject?: string; from?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const sb = await createClient();
  const t = await getTranslations();

  // Email vem da config (zero hardcoded)
  const { data: emailRaw } = await sb.rpc('nl_contact_email_get');
  const contactEmail: string = typeof emailRaw === 'string' ? emailRaw : 'hello@neurolearn.pt';

  const blocks = await getHomeBlocks(locale);

  return (
      <main className="bg-white min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 border-b border-slate-200/60">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/3 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl animate-pulse" />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 mb-5 shadow-sm">
              <MessageSquare className="h-3.5 w-3.5" /> {safeT(t, 'contact.title', 'Falar connosco')}
            </div>
            <h1 className="t-h1 text-slate-900">
              {safeT(t, 'contact.title', 'Falar connosco')}
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
              {safeT(t, 'contact.subtitle', 'Mensagem directa para a nossa equipa. Respondemos em média em menos de 24h.')}
            </p>
          </div>
        </section>

        {/* Form + side info */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2">
              <ContactForm
                defaultTopic={sp.topic || 'general'}
                defaultSubject={sp.subject || ''}
                sourcePath={sp.from || '/contacto'}
              />
            </div>

            {/* Side info */}
            <aside className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <Mail className="h-5 w-5 text-blue-600 mb-3" />
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Email directo</div>
                <a href={`mailto:${contactEmail}`} className="text-sm font-semibold text-slate-900 hover:text-blue-700 break-all">
                  {contactEmail}
                </a>
                <div className="text-xs text-slate-500 mt-1">Preferimos o formulário acima.</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <Clock className="h-5 w-5 text-emerald-600 mb-3" />
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Tempo de resposta</div>
                <div className="text-sm font-semibold text-slate-900">Menos de 24h em média</div>
                <div className="text-xs text-slate-500 mt-1">Dias úteis, fuso CET.</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <MapPin className="h-5 w-5 text-rose-600 mb-3" />
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Onde estamos</div>
                <div className="text-sm font-semibold text-slate-900">Equipa remota</div>
                <div className="text-xs text-slate-500 mt-1">Sede em Portugal.</div>
              </div>
              <div className="text-center">
                <Link href={'/ajuda' as any} className="text-xs text-slate-500 hover:text-slate-900">
                  Antes de escrever, vê o Centro de ajuda →
                </Link>
              </div>
            </aside>
          </div>
        </section>

      </main>
  );
}
