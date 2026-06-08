import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Handshake } from 'lucide-react';
import { ServicesClient } from './ServicesClient';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const sb = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/teach/servicos');
  const { data: services } = await sb.rpc('nl_my_instructor_services');

  function safeT(key: string, fb: string): string {
    try { const v = t(key as any); if (v && typeof v === 'string' && v !== key) return v; } catch {}
    return fb;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Handshake className="h-3.5 w-3.5" /> {safeT('teach.services.eyebrow', 'Instrutor · Serviços corporativos')}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{safeT('teach.services.title', 'Os meus serviços')}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
          {safeT('teach.services.description', 'Workshops, formações in-company, mentorias. As empresas podem contactar-te através destes serviços.')}
        </p>
      </header>
      <ServicesClient initial={Array.isArray(services) ? services : []} />
    </div>
  );
}
