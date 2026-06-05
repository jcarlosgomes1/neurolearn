'use client';

import { useState, useTransition } from 'react';
import { Link } from '@/i18n/routing';
import { browseTalentAction, createPlacementAction } from '../talent-actions';
import { Search, Users, MapPin, Briefcase, Award, X, Loader2, AlertCircle, CheckCircle, Send } from 'lucide-react';

function fmt(cents?: number | null, currency = 'EUR') {
  if (!cents) return '—';
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export function TalentBrowseClient({ orgId, orgName, orgSlug, memberRole, featureEnabled, jobs, locale, initial }: {
  orgId: string; orgName: string; orgSlug: string; memberRole: string;
  featureEnabled: boolean; jobs: any[]; locale: string; initial: { total: number; talents: any[] };
}) {
  const [talents, setTalents] = useState(initial.talents);
  const [total, setTotal] = useState(initial.total);
  const [search, setSearch] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [remoteOk, setRemoteOk] = useState<string>('');
  const [pending, startTransition] = useTransition();
  const [contacting, setContacting] = useState<any | null>(null);
  const canAct = ['owner','admin','manager'].includes(memberRole);

  function applyFilters() {
    const skills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
    startTransition(async () => {
      const r = await browseTalentAction(orgId, {
        search, skills, remoteOk: remoteOk === 'yes' ? true : remoteOk === 'no' ? false : undefined,
      });
      if (r.ok) { setTalents(r.talents); setTotal(r.total); }
    });
  }

  if (!featureEnabled) {
    return (
      <main className="bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <h2 className="font-bold text-slate-900 text-lg mb-1">Talent não disponível</h2>
            <p className="text-sm text-slate-600 mb-4">O módulo de contratação de talento não está activo para {orgName}.</p>
            <Link href={`/empresa/${orgSlug}` as any} className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg inline-block">Voltar</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-6 w-6 text-emerald-600" />
              <h1 className="text-2xl font-bold text-slate-900">Talent Marketplace</h1>
            </div>
            <p className="text-sm text-slate-500">Candidatos certificados disponíveis. Match score baseado nas skills.</p>
          </div>
          <Link href={`/empresa/${orgSlug}/talent/pipeline` as any}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg">
            <Briefcase className="h-4 w-4" /> Pipeline placements
          </Link>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Procurar nome, headline…"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <input type="text" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="Skills (vírgula): React, Python"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <select value={remoteOk} onChange={(e) => setRemoteOk(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
            <option value="">Remote: qualquer</option>
            <option value="yes">Apenas remote</option>
            <option value="no">Apenas presencial</option>
          </select>
          <button onClick={applyFilters} disabled={pending}
            className="sm:col-span-3 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {pending ? 'A filtrar…' : `Aplicar (${total} ${total === 1 ? 'candidato' : 'candidatos'})`}
          </button>
        </div>

        {talents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Sem candidatos</h3>
            <p className="text-sm text-slate-500">Ajusta os filtros.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {talents.map((t) => (
              <div key={t.user_id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold">
                      {t.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 truncate">{t.name || 'Candidato'}</h3>
                      {t.match_score != null && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          t.match_score >= 75 ? 'bg-emerald-100 text-emerald-800' :
                          t.match_score >= 50 ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>{t.match_score}% match</span>
                      )}
                    </div>
                    {t.headline && <p className="text-sm text-slate-600 line-clamp-1">{t.headline}</p>}
                  </div>
                </div>
                
                {t.bio && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{t.bio}</p>}
                
                {t.certified_skills && t.certified_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {t.certified_skills.slice(0, 6).map((s: string) => (
                      <span key={s} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full flex items-center gap-0.5">
                        <Award className="h-3 w-3" />{s}
                      </span>
                    ))}
                    {t.certified_skills.length > 6 && <span className="text-xs text-slate-500">+{t.certified_skills.length - 6}</span>}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-3 text-xs text-slate-600 mb-3">
                  {t.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.location}</span>}
                  {t.years_experience != null && <span>{t.years_experience}y exp</span>}
                  {t.remote_ok && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">Remote OK</span>}
                  {(t.desired_salary_min_cents || t.desired_salary_max_cents) && (
                    <span>{fmt(t.desired_salary_min_cents, t.currency)}–{fmt(t.desired_salary_max_cents, t.currency)}/y</span>
                  )}
                </div>
                
                {canAct && (
                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button onClick={() => setContacting(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg">
                      <Send className="h-3.5 w-3.5" /> Contactar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {contacting && (
        <ContactModal talent={contacting} orgId={orgId} jobs={jobs} orgSlug={orgSlug}
          onClose={() => setContacting(null)} />
      )}
    </main>
  );
}

function ContactModal({ talent, orgId, jobs, orgSlug, onClose }: { talent: any; orgId: string; jobs: any[]; orgSlug: string; onClose: () => void }) {
  const [jobId, setJobId] = useState('');
  const [notes, setNotes] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await createPlacementAction(orgId, talent.user_id, jobId || undefined, notes || undefined);
      if (r.ok) setSuccess(true);
      else setError(r.error || 'erro');
    });
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white max-w-md rounded-2xl p-6 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 mb-1">Candidato contactado</h3>
          <p className="text-sm text-slate-600 mb-3">{talent.name} foi notificado/a. Acompanha o progresso no pipeline.</p>
          <Link href={`/empresa/${orgSlug}/talent/pipeline` as any} className="text-sm text-emerald-600 hover:underline">
            Ver pipeline →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl">
        <div className="border-b border-slate-100 p-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Contactar candidato</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-slate-600">A contactar: <strong>{talent.name}</strong></p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vaga (opcional)</label>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
              <option value="">— Sem vaga específica —</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas internas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Why this candidate, next steps…" />
          </div>
          {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
        </div>
        <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
          <button onClick={submit} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Contactar
          </button>
        </div>
      </div>
    </div>
  );
}
