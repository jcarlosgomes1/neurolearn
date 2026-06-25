'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { Search, Check, Loader2, CalendarClock, Video, ShieldCheck } from 'lucide-react';

type Lang = 'pt' | 'en' | 'es' | 'fr';
const STR: Record<string, Record<Lang, string>> = {
  title: { pt: 'Mentores', en: 'Mentors', es: 'Mentores', fr: 'Mentors' },
  subtitle: {
    pt: 'Valida quem aparece como mentor. Por defeito, instrutores aprovados são mentores — aqui revogas ou repões.',
    en: 'Curate who appears as a mentor. Approved instructors are mentors by default — revoke or restore here.',
    es: 'Valida quién aparece como mentor. Los instructores aprobados son mentores por defecto — revoca o repón aquí.',
    fr: 'Valide qui apparaît comme mentor. Les instructeurs approuvés sont mentors par défaut — révoque ou rétablis ici.',
  },
  search: { pt: 'Procurar por nome ou identificador…', en: 'Search by name or handle…', es: 'Buscar por nombre o identificador…', fr: 'Rechercher par nom ou identifiant…' },
  mentors: { pt: 'mentores', en: 'mentors', es: 'mentores', fr: 'mentors' },
  candidates: { pt: 'candidatos', en: 'candidates', es: 'candidatos', fr: 'candidats' },
  is_mentor: { pt: 'Mentor', en: 'Mentor', es: 'Mentor', fr: 'Mentor' },
  availability_on: { pt: 'Disponibilidade ativa', en: 'Availability active', es: 'Disponibilidad activa', fr: 'Disponibilité active' },
  availability_off: { pt: 'Sem disponibilidade', en: 'No availability', es: 'Sin disponibilidad', fr: 'Sans disponibilité' },
  sessions: { pt: 'sessões de mentoria', en: 'mentoring sessions', es: 'sesiones de mentoría', fr: 'séances de mentorat' },
  empty: { pt: 'Sem candidatos. Instrutores aprovados aparecem aqui.', en: 'No candidates. Approved instructors show up here.', es: 'Sin candidatos. Los instructores aprobados aparecen aquí.', fr: 'Aucun candidat. Les instructeurs approuvés apparaissent ici.' },
  none_found: { pt: 'Nenhum resultado.', en: 'No results.', es: 'Sin resultados.', fr: 'Aucun résultat.' },
};
const ROLE_LABEL: Record<string, Record<Lang, string>> = {
  instructor: { pt: 'Instrutor', en: 'Instructor', es: 'Instructor', fr: 'Instructeur' },
  admin: { pt: 'Admin', en: 'Admin', es: 'Admin', fr: 'Admin' },
  super_admin: { pt: 'Super admin', en: 'Super admin', es: 'Super admin', fr: 'Super admin' },
  account_manager: { pt: 'Gestor', en: 'Manager', es: 'Gestor', fr: 'Gestionnaire' },
};
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

function Toggle({ on, onChange, busy }: { on: boolean; onChange: () => void; busy?: boolean }) {
  return (
    <button type="button" disabled={busy} onClick={onChange}
      className={cx('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        busy ? 'opacity-60' : '', on ? 'bg-gradient-to-r from-violet-500 to-indigo-600' : 'bg-slate-300')}>
      <span className={cx('inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform flex items-center justify-center', on ? 'translate-x-5' : 'translate-x-0.5')}>
        {busy && <Loader2 className="h-3 w-3 animate-spin text-violet-600" />}
      </span>
    </button>
  );
}

export function MentoresCockpit() {
  const locale = (useLocale() as Lang) || 'pt';
  const t = (k: string) => STR[k]?.[locale] ?? STR[k]?.pt ?? k;
  const sb = useMemo(() => createClient(), []);

  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    const { data } = await sb.rpc('nl_admin_mentor_candidates');
    setList(((data as any)?.candidates) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function setMentor(id: string, active: boolean) {
    setSavingId(id);
    await sb.rpc('nl_admin_set_mentor', { p_user_id: id, p_active: active } as any);
    setList((rows) => rows.map((r) => (r.id === id ? { ...r, is_mentor: active } : r)));
    setSavingId(null);
  }

  const filtered = list.filter((c) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (c.name || '').toLowerCase().includes(s) || (c.handle || '').toLowerCase().includes(s);
  });
  const mentorCount = list.filter((c) => c.is_mentor).length;

  return (
    <div className="space-y-6">
      <AppPageHeader backHref="/admin" title={`🎓 ${t('title')}`} description={t('subtitle')} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 text-violet-700 px-3 py-1.5 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4" />{mentorCount} {t('mentors')}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-600 px-3 py-1.5 text-sm font-medium">
          {list.length} {t('candidates')}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')}
          className="w-full rounded-2xl border border-slate-200 bg-white/80 backdrop-blur pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-300 outline-none" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">{list.length === 0 ? t('empty') : t('none_found')}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className={cx('rounded-2xl border bg-white/80 backdrop-blur p-4 flex items-center gap-3 transition-colors',
              c.is_mentor ? 'border-violet-200' : 'border-slate-200')}>
              {c.avatar_url
                ? <img src={c.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover shrink-0" />
                : <div className="h-11 w-11 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0">{(c.name || '?')[0]?.toUpperCase()}</div>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900 text-sm truncate">{c.name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{ROLE_LABEL[c.role]?.[locale] || c.role}</span>
                </div>
                <div className="text-xs text-slate-500 truncate">@{c.handle}</div>
                <div className="flex items-center gap-3 mt-1 text-xs flex-wrap">
                  <span className={cx('inline-flex items-center gap-1', c.has_availability ? 'text-emerald-600' : 'text-slate-400')}>
                    <CalendarClock className="h-3 w-3" />{c.has_availability ? t('availability_on') : t('availability_off')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-500"><Video className="h-3 w-3" />{c.mentoring_links} {t('sessions')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.is_mentor && <Check className="h-4 w-4 text-violet-600" />}
                <Toggle on={!!c.is_mentor} busy={savingId === c.id} onChange={() => setMentor(c.id, !c.is_mentor)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
