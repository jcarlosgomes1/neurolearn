'use client';

import { useState, useTransition } from 'react';
import { Link } from '@/i18n/routing';
import { browseInstructorServicesAction, createInquiryAction } from '../../corporate-actions';
import { Search, Briefcase, Star, Users, Clock, Globe, X, Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const KIND_LABELS: Record<string, string> = {
  custom_course: 'Curso à medida',
  workshop_sync: 'Workshop online',
  in_person_training: 'Formação presencial',
  mentoring: 'Mentoria',
  consulting: 'Consultoria',
  keynote: 'Keynote',
};

function fmtCents(cents: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(cents / 100);
}

export function MarketplaceInstrutoresClient({ orgId, orgName, orgSlug, memberRole, featureEnabled, locale, initial }: {
  orgId: string; orgName: string; orgSlug: string; memberRole: string; featureEnabled: boolean;
  locale: string; initial: { total: number; services: any[] };
}) {
  const [services, setServices] = useState(initial.services);
  const [total, setTotal] = useState(initial.total);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [format, setFormat] = useState('');
  const [pending, startTransition] = useTransition();
  const [inquiringService, setInquiringService] = useState<any | null>(null);

  function applyFilters() {
    startTransition(async () => {
      const r = await browseInstructorServicesAction({ search, kind, format });
      if (r.ok) { setServices(r.services); setTotal(r.total); }
    });
  }

  if (!featureEnabled) {
    return (
      <main className="bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <h2 className="font-bold text-slate-900 text-lg mb-1">Módulo não disponível</h2>
            <p className="text-sm text-slate-600 mb-4">
              O marketplace de instrutores corporate não está ativado para {orgName}.
            </p>
            <Link href={`/empresa/${orgSlug}` as any} className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg inline-block">
              Voltar ao workspace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-6 w-6 text-brand-600" />
            <h1 className="text-2xl font-bold text-slate-900">Marketplace de Instrutores</h1>
          </div>
          <p className="text-sm text-slate-500">
            Contrata instrutores certificados para formações custom: workshops, mentoria, consultoria, presencial.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Procurar serviço, instrutor, skill…"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <select value={kind} onChange={(e) => setKind(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
            <option value="">Todos os tipos</option>
            {Object.entries(KIND_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <select value={format} onChange={(e) => setFormat(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
            <option value="">Todos os formatos</option>
            <option value="online">Online</option>
            <option value="in_person">Presencial</option>
            <option value="hybrid">Híbrido</option>
          </select>
          <button onClick={applyFilters} disabled={pending}
            className="sm:col-span-4 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {pending ? 'A filtrar…' : `Aplicar (${total} ${total === 1 ? 'serviço' : 'serviços'})`}
          </button>
        </div>

        {services.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Nenhum serviço encontrado</h3>
            <p className="text-sm text-slate-500">Ajusta os filtros ou tenta procurar por outro termo.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {services.map((s) => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  {s.avatar_url ? (
                    <img src={s.avatar_url} alt={s.instructor_name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm">
                      {s.instructor_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 text-sm">{s.instructor_name}</div>
                    {s.rating_avg && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {Number(s.rating_avg).toFixed(1)}
                        {s.total_students && <span>· {s.total_students} alunos</span>}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-xs uppercase tracking-wider text-brand-600 font-semibold mb-1">{KIND_LABELS[s.kind] || s.kind}</div>
                <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                {s.description && <p className="text-sm text-slate-600 line-clamp-3 mb-3">{s.description}</p>}
                
                <div className="flex flex-wrap gap-1.5 text-xs mb-3">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full capitalize">{s.format}</span>
                  {s.duration_hours_min && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                      {s.duration_hours_min}{s.duration_hours_max && s.duration_hours_max !== s.duration_hours_min ? `-${s.duration_hours_max}` : ''}h
                    </span>
                  )}
                  {s.max_participants && <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">≤{s.max_participants} pax</span>}
                  {s.travel_ok && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">Viaja</span>}
                </div>
                
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-lg font-bold text-slate-900">
                    {fmtCents(s.base_price_cents, s.currency)}
                    <span className="text-xs text-slate-500 font-normal ml-1">
                      {s.price_model !== 'flat' && `/ ${s.price_model.replace('per_', '')}`}
                    </span>
                  </div>
                  {['owner', 'admin', 'manager'].includes(memberRole) && (
                    <button onClick={() => setInquiringService(s)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg">
                      <Send className="h-3.5 w-3.5" /> Pedir orçamento
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {inquiringService && (
        <InquiryModal service={inquiringService} orgId={orgId} orgSlug={orgSlug}
          onClose={() => setInquiringService(null)} />
      )}
    </main>
  );
}

function InquiryModal({ service, orgId, orgSlug, onClose }: { service: any; orgId: string; orgSlug: string; onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [participants, setParticipants] = useState('');
  const [hours, setHours] = useState('');
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function submit() {
    setError(null);
    if (!message || message.length < 20) return setError('Mensagem demasiado curta (mínimo 20 caracteres). Descreve o que precisas.');
    startTransition(async () => {
      const r = await createInquiryAction(orgId, service.instructor_id, service.id, {
        message,
        expected_participants: participants ? parseInt(participants) : undefined,
        expected_duration_hours: hours ? parseInt(hours) : undefined,
        budget_cents: budget ? Math.round(parseFloat(budget) * 100) : undefined,
        location: location || undefined,
        format: service.format,
      });
      if (r.ok) { setSuccess(true); setTimeout(() => onClose(), 2000); }
      else setError(r.error || 'erro');
    });
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white max-w-md rounded-2xl p-6 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 mb-1">Pedido enviado</h3>
          <p className="text-sm text-slate-600 mb-3">
            {service.instructor_name} foi notificado/a. Vais receber o orçamento em breve.
          </p>
          <Link href={`/empresa/${orgSlug}/pedidos` as any} className="text-sm text-brand-600 hover:underline">
            Ver os meus pedidos →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Pedir orçamento</h2>
            <p className="text-xs text-slate-500">{service.title} · {service.instructor_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem ao instrutor *</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg" rows={4} 
              placeholder="Descreve a tua necessidade: contexto, audiência, objectivos..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Participantes</label>
              <input type="number" value={participants} onChange={(e) => setParticipants(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="10" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duração (h)</label>
              <input type="number" value={hours} onChange={(e) => setHours(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="8" min="1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Budget (€) opcional</label>
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="2000" step="0.01" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Localização</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Lisboa, PT ou Online" />
            </div>
          </div>
          {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
        </div>
        <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
          <button onClick={submit} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Send className="h-4 w-4" /> Enviar pedido
          </button>
        </div>
      </div>
    </div>
  );
}
