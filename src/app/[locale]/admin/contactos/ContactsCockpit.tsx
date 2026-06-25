'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import {
  Search, Download, X, Mail, Phone, Globe2, Calendar, ShieldCheck,
  ShieldAlert, ChevronLeft, ChevronRight, Loader2, UserCheck, Tag, Flame, Wand2,
} from 'lucide-react';

type Lang = 'pt' | 'en' | 'es' | 'fr';
const STR: Record<string, Record<Lang, string>> = {
  title: { pt: 'Contactos', en: 'Contacts', es: 'Contactos', fr: 'Contacts' },
  subtitle: { pt: 'Leads e contactos capturados na plataforma.', en: 'Leads and contacts captured across the platform.', es: 'Leads y contactos capturados en la plataforma.', fr: 'Leads et contacts capturés sur la plateforme.' },
  total: { pt: 'Total', en: 'Total', es: 'Total', fr: 'Total' },
  lead: { pt: 'Leads', en: 'Leads', es: 'Leads', fr: 'Leads' },
  engaged: { pt: 'Envolvidos', en: 'Engaged', es: 'Comprometidos', fr: 'Engagés' },
  converted: { pt: 'Convertidos', en: 'Converted', es: 'Convertidos', fr: 'Convertis' },
  with_consent: { pt: 'Com consentimento', en: 'With consent', es: 'Con consentimiento', fr: 'Avec consentement' },
  search_ph: { pt: 'Procurar por nome, email ou telefone…', en: 'Search name, email or phone…', es: 'Buscar por nombre, email o teléfono…', fr: 'Rechercher nom, email ou téléphone…' },
  all_status: { pt: 'Todos os estados', en: 'All statuses', es: 'Todos los estados', fr: 'Tous les statuts' },
  all_consent: { pt: 'Consentimento: todos', en: 'Consent: all', es: 'Consentimiento: todos', fr: 'Consentement : tous' },
  consent_yes: { pt: 'Com consentimento', en: 'With consent', es: 'Con consentimiento', fr: 'Avec consentement' },
  consent_no: { pt: 'Sem consentimento', en: 'Without consent', es: 'Sin consentimiento', fr: 'Sans consentement' },
  export: { pt: 'Exportar', en: 'Export', es: 'Exportar', fr: 'Exporter' },
  empty: { pt: 'Sem contactos para estes filtros.', en: 'No contacts for these filters.', es: 'Sin contactos para estos filtros.', fr: 'Aucun contact pour ces filtres.' },
  is_user: { pt: 'Utilizador', en: 'User', es: 'Usuario', fr: 'Utilisateur' },
  detail: { pt: 'Detalhe do contacto', en: 'Contact detail', es: 'Detalle del contacto', fr: 'Détail du contact' },
  consent: { pt: 'Consentimento de marketing', en: 'Marketing consent', es: 'Consentimiento de marketing', fr: 'Consentement marketing' },
  consent_given: { pt: 'Concedido', en: 'Granted', es: 'Concedido', fr: 'Accordé' },
  consent_none: { pt: 'Não concedido', en: 'Not granted', es: 'No concedido', fr: 'Non accordé' },
  activity: { pt: 'Atividade', en: 'Activity', es: 'Actividad', fr: 'Activité' },
  no_activity: { pt: 'Sem atividade registada.', en: 'No activity yet.', es: 'Sin actividad.', fr: 'Aucune activité.' },
  set_status: { pt: 'Mudar estado', en: 'Change status', es: 'Cambiar estado', fr: 'Changer le statut' },
  score: { pt: 'Pontuação', en: 'Score', es: 'Puntuación', fr: 'Score' },
  followup: { pt: 'Follow-up (vendas)', en: 'Follow-up (sales)', es: 'Seguimiento (ventas)', fr: 'Relance (ventes)' },
  fup_generate: { pt: 'Gerar rascunho', en: 'Generate draft', es: 'Generar borrador', fr: 'Générer un brouillon' },
  fup_regenerate: { pt: 'Gerar de novo', en: 'Regenerate', es: 'Regenerar', fr: 'Régénérer' },
  fup_generating: { pt: 'A redigir…', en: 'Drafting…', es: 'Redactando…', fr: 'Rédaction…' },
  fup_note: { pt: 'Rascunho proposto. O envio por email será ativado em breve.', en: 'Proposed draft. Email sending will be enabled soon.', es: 'Borrador propuesto. El envío por email se activará pronto.', fr: 'Brouillon proposé. L’envoi par e-mail sera activé bientôt.' },
};
const STATUS_LABEL: Record<string, Record<Lang, string>> = {
  lead: { pt: 'Lead', en: 'Lead', es: 'Lead', fr: 'Lead' },
  engaged: { pt: 'Envolvido', en: 'Engaged', es: 'Comprometido', fr: 'Engagé' },
  converted: { pt: 'Convertido', en: 'Converted', es: 'Convertido', fr: 'Converti' },
  unsubscribed: { pt: 'Cancelado', en: 'Unsubscribed', es: 'Cancelado', fr: 'Désabonné' },
};
const SEG_LABEL: Record<string, Record<Lang, string>> = {
  hot: { pt: 'Quente', en: 'Hot', es: 'Caliente', fr: 'Chaud' },
  warm: { pt: 'Morno', en: 'Warm', es: 'Templado', fr: 'Tiède' },
  cold: { pt: 'Frio', en: 'Cold', es: 'Frío', fr: 'Froid' },
};
const STATUS_CLS: Record<string, string> = {
  lead: 'bg-slate-100 text-slate-600', engaged: 'bg-violet-100 text-violet-700',
  converted: 'bg-emerald-100 text-emerald-700', unsubscribed: 'bg-rose-100 text-rose-700',
};
const SEG_CLS: Record<string, string> = {
  hot: 'bg-rose-100 text-rose-700', warm: 'bg-amber-100 text-amber-700', cold: 'bg-slate-100 text-slate-500',
};
const PAGE = 25;
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function ContactsCockpit({ initialStats, initialList }: { initialStats: any; initialList: any }) {
  const locale = (useLocale() as Lang) || 'pt';
  const t = (k: string) => STR[k]?.[locale] ?? STR[k]?.pt ?? k;
  const sl = (s: string) => STATUS_LABEL[s]?.[locale] ?? s;
  const seg = (s: string) => SEG_LABEL[s]?.[locale] ?? s;
  const sb = useMemo(() => createClient(), []);

  const [stats, setStats] = useState<any>(initialStats || {});
  const [rows, setRows] = useState<any[]>(initialList?.rows || []);
  const [total, setTotal] = useState<number>(initialList?.total || 0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [consent, setConsent] = useState('all');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState<any | null>(null);
  const [selLoading, setSelLoading] = useState(false);
  const [fupBusy, setFupBusy] = useState(false);
  const [fupText, setFupText] = useState('');

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const { data } = await sb.rpc('nl_admin_contacts_list', {
      p_search: search || null, p_status: status, p_consent: consent, p_limit: PAGE, p_offset: p * PAGE,
    });
    const d = data as any;
    if (d?.ok) { setRows(d.rows || []); setTotal(d.total || 0); }
    setLoading(false);
  }, [sb, search, status, consent]);

  useEffect(() => {
    const id = setTimeout(() => { setPage(0); load(0); }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, consent]);

  async function refreshStats() {
    const { data } = await sb.rpc('nl_admin_contacts_stats');
    if (data) setStats(data);
  }

  async function openDetail(id: string) {
    setSelLoading(true); setSel({ loading: true }); setFupText('');
    const { data } = await sb.rpc('nl_admin_contact_get', { p_id: id });
    const d = data as any;
    if (d?.ok && d.contact?.followup_status === 'ready') setFupText(d.contact.followup_draft?.text || '');
    setSel(d?.ok ? d : null); setSelLoading(false);
  }
  async function changeStatus(id: string, s: string) {
    await sb.rpc('nl_admin_contact_set_status', { p_id: id, p_status: s });
    await openDetail(id); await load(page); await refreshStats();
  }
  async function genFollowup(id: string) {
    setFupBusy(true); setFupText('');
    const { data: f } = await sb.rpc('nl_crm_followup_draft', { p_id: id });
    if (!(f as any)?.ok) { setFupBusy(false); return; }
    for (let i = 0; i < 16; i++) {
      await new Promise((r) => setTimeout(r, 2200));
      const { data: c } = await sb.rpc('nl_crm_followup_collect', { p_id: id });
      const cc = c as any;
      if (cc?.status === 'ready') { setFupText(cc.text || ''); setFupBusy(false); return; }
      if (cc?.ok === false) { setFupBusy(false); return; }
    }
    setFupBusy(false);
  }

  async function exportCsv() {
    const { data } = await sb.rpc('nl_admin_contacts_list', {
      p_search: search || null, p_status: status, p_consent: consent, p_limit: 100, p_offset: 0,
    });
    const rs = (data as any)?.rows || [];
    const head = ['email', 'name', 'phone', 'locale', 'status', 'segment', 'score', 'marketing_consent', 'first_source', 'created_at'];
    const csv = [head.join(',')].concat(rs.map((r: any) =>
      head.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'contactos.csv'; a.click();
  }

  const pages = Math.max(1, Math.ceil(total / PAGE));
  const fmt = (d: string) => d ? new Date(d).toLocaleDateString(locale) : '';

  const StatCard = ({ label, value, cls }: { label: string; value: number; cls?: string }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className={cx('text-2xl font-bold', cls || 'text-slate-900')}>{value ?? 0}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <AppPageHeader backHref="/admin" title={`👥 ${t('title')}`} description={t('subtitle')}
        actions={
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-full px-3 py-1.5">
            <Download className="h-4 w-4" />{t('export')}
          </button>
        } />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label={t('total')} value={stats.total} />
        <StatCard label={t('lead')} value={stats.lead} />
        <StatCard label={t('engaged')} value={stats.engaged} cls="text-violet-700" />
        <StatCard label={t('converted')} value={stats.converted} cls="text-emerald-700" />
        <StatCard label={t('with_consent')} value={stats.with_consent} cls="text-indigo-700" />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search_ph')}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-violet-200" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-200">
          <option value="all">{t('all_status')}</option>
          <option value="lead">{sl('lead')}</option>
          <option value="engaged">{sl('engaged')}</option>
          <option value="converted">{sl('converted')}</option>
          <option value="unsubscribed">{sl('unsubscribed')}</option>
        </select>
        <select value={consent} onChange={(e) => setConsent(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-200">
          <option value="all">{t('all_consent')}</option>
          <option value="yes">{t('consent_yes')}</option>
          <option value="no">{t('consent_no')}</option>
        </select>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">{t('empty')}</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id}>
                <button onClick={() => openDetail(r.id)} className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {(r.name || r.email || '?')[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm truncate">{r.name || r.email}</span>
                      {r.is_user && <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{r.email}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cx('text-[10px] font-bold px-1.5 py-0.5 rounded-full', SEG_CLS[r.segment])}>{r.score}</span>
                      <span className={cx('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full', STATUS_CLS[r.status])}>{sl(r.status)}</span>
                    </div>
                    {r.marketing_consent
                      ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      : <ShieldAlert className="h-3.5 w-3.5 text-slate-300" />}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{total} · {page + 1}/{pages}</span>
        <div className="flex gap-1">
          <button disabled={page === 0} onClick={() => { const p = page - 1; setPage(p); load(p); }} className="p-2 rounded-lg border border-slate-200 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <button disabled={page + 1 >= pages} onClick={() => { const p = page + 1; setPage(p); load(p); }} className="p-2 rounded-lg border border-slate-200 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {sel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setSel(null)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {selLoading || sel.loading ? (
              <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" /></div>
            ) : (() => {
              const c = sel.contact; const bk = sel.bookings || [];
              return (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-lg font-bold flex items-center justify-center shrink-0">{(c.name || c.email || '?')[0]?.toUpperCase()}</div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{c.name || '—'}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cx('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full', STATUS_CLS[c.status])}>{sl(c.status)}</span>
                          <span className={cx('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1', SEG_CLS[c.segment])}><Flame className="h-2.5 w-2.5" />{seg(c.segment)} · {c.score}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSel(null)} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600"><Mail className="h-4 w-4 text-slate-400" />{c.email}</div>
                    {c.phone && <div className="flex items-center gap-2 text-slate-600"><Phone className="h-4 w-4 text-slate-400" />{c.phone}</div>}
                    {c.locale && <div className="flex items-center gap-2 text-slate-600"><Globe2 className="h-4 w-4 text-slate-400" />{c.locale}</div>}
                    {c.first_source && <div className="flex items-center gap-2 text-slate-600"><Tag className="h-4 w-4 text-slate-400" />{c.first_source}</div>}
                    {c.is_user && <div className="flex items-center gap-2 text-emerald-700"><UserCheck className="h-4 w-4" />{t('is_user')}</div>}
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-100 p-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      {c.marketing_consent ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> : <ShieldAlert className="h-3.5 w-3.5 text-slate-300" />}{t('consent')}
                    </div>
                    <div className={cx('text-sm font-semibold', c.marketing_consent ? 'text-emerald-700' : 'text-slate-500')}>{c.marketing_consent ? t('consent_given') : t('consent_none')}</div>
                    {c.marketing_consent && c.marketing_consent_text && <p className="text-xs text-slate-500 mt-1 italic">“{c.marketing_consent_text}”</p>}
                    {c.marketing_consent_at && <p className="text-[11px] text-slate-400 mt-1">{fmt(c.marketing_consent_at)} · {c.marketing_consent_source}</p>}
                  </div>

                  <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/30 p-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-700"><Wand2 className="h-3.5 w-3.5" />{t('followup')}</div>
                      <button onClick={() => genFollowup(c.id)} disabled={fupBusy}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 rounded-full px-3 py-1.5 disabled:opacity-60">
                        {fupBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}{fupBusy ? t('fup_generating') : (fupText ? t('fup_regenerate') : t('fup_generate'))}
                      </button>
                    </div>
                    {fupText && <p className="text-sm text-slate-700 leading-relaxed bg-white rounded-xl border border-slate-200 p-3 whitespace-pre-wrap">{fupText}</p>}
                    {fupText && <p className="text-[11px] text-slate-400 mt-1.5">{t('fup_note')}</p>}
                  </div>

                  <div className="mt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{t('activity')}</div>
                    {bk.length === 0 ? <p className="text-sm text-slate-400">{t('no_activity')}</p> : (
                      <div className="space-y-1.5">
                        {bk.map((b: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{b.link_title || '—'}{b.host ? ` · ${b.host}` : ''}</span>
                            <span className="ml-auto text-xs text-slate-400 shrink-0">{fmt(b.scheduled_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{t('set_status')}</div>
                    <div className="flex flex-wrap gap-2">
                      {['lead', 'engaged', 'converted', 'unsubscribed'].map((s) => (
                        <button key={s} onClick={() => changeStatus(c.id, s)}
                          className={cx('text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors',
                            c.status === s ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300')}>
                          {sl(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
