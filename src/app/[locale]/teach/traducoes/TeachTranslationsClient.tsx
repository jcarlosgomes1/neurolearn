'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Globe2, Plus, Trash2, Loader2, BadgeCheck } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { toast } from 'sonner';

interface Locale { code: string; name: string; }
interface Lang { lang_code: string; level: string; verified: boolean; }
interface Req { target_lang: string; status: string; }
interface Course { course_id: string; title: string; source_lang: string; requests: Req[]; }

const LEVELS = [
  { v: 'native', label: 'Nativo' },
  { v: 'fluent', label: 'Fluente' },
  { v: 'professional', label: 'Profissional' },
];

const REQ_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pendente', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Em tradução', cls: 'bg-sky-100 text-sky-700' },
  translating: { label: 'Em tradução', cls: 'bg-sky-100 text-sky-700' },
  done: { label: 'Disponível', cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Recusado', cls: 'bg-rose-100 text-rose-700' },
  failed: { label: 'Falhou', cls: 'bg-rose-100 text-rose-700' },
};

export function TeachTranslationsClient() {
  const [locales, setLocales] = useState<Locale[]>([]);
  const [langs, setLangs] = useState<Lang[] | null>(null);
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [newLang, setNewLang] = useState('');
  const [newLevel, setNewLevel] = useState('professional');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = createClient();
    const [loc, lg, cs] = await Promise.all([
      sb.rpc('nl_platform_locales'),
      sb.rpc('nl_instructor_my_languages'),
      sb.rpc('nl_teach_translatable_courses'),
    ]);
    setLocales((loc.data as Locale[]) || []);
    const l = lg.data as { ok?: boolean; languages?: Lang[] };
    setLangs(l?.ok ? (l.languages || []) : []);
    const c = cs.data as { ok?: boolean; courses?: Course[] };
    setCourses(c?.ok ? (c.courses || []) : []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const localeName = (code: string) => locales.find((l) => l.code === code)?.name || (code || '').toUpperCase();

  async function addLang() {
    if (!newLang) return;
    setBusy('addlang');
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_instructor_set_language', { p_lang: newLang, p_level: newLevel });
      if (error || !(data as { ok?: boolean })?.ok) throw new Error();
      setNewLang('');
      toast.success('Idioma adicionado');
      await load();
    } catch { toast.error('Não foi possível adicionar.'); }
    setBusy(null);
  }

  async function removeLang(code: string) {
    setBusy('lang_' + code);
    try {
      const sb = createClient();
      await sb.rpc('nl_instructor_remove_language', { p_lang: code });
      setLangs((xs) => (xs || []).filter((x) => x.lang_code !== code));
    } catch { toast.error('Erro'); }
    setBusy(null);
  }

  async function requestTranslation(courseId: string, target: string) {
    setBusy(courseId + '_' + target);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_translation_request_create', { p_course_id: courseId, p_target_lang: target });
      if (error || !(data as { ok?: boolean })?.ok) throw new Error();
      const st = (data as { status?: string }).status || 'pending';
      setCourses((cs) => (cs || []).map((c) => c.course_id === courseId ? {
        ...c,
        requests: [...c.requests.filter((r) => r.target_lang !== target), { target_lang: target, status: st }],
      } : c));
      toast.success('Pedido enviado para aprovação');
    } catch { toast.error('Não foi possível pedir.'); }
    setBusy(null);
  }

  const declared = new Set((langs || []).map((l) => l.lang_code));
  const addable = locales.filter((l) => !declared.has(l.code));

  return (
    <div className="py-8 space-y-6">
      <AppPageHeader title="Traduções" description="Declara os idiomas que dominas e pede a tradução dos teus cursos para alcançar novos mercados. Cada pedido é validado pela equipa." />

      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3"><Globe2 className="h-4 w-4 text-brand-600" /><h2 className="font-semibold text-slate-900">Idiomas que domino</h2></div>
        {langs === null ? <p className="text-sm text-slate-400">A carregar…</p> : (
          <>
            {langs.length > 0 && (
              <ul className="space-y-2 mb-4">
                {langs.map((l) => (
                  <li key={l.lang_code} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{localeName(l.lang_code)}</span>
                      <span className="text-xs text-slate-400">· {LEVELS.find((x) => x.v === l.level)?.label || l.level}</span>
                      {l.verified
                        ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" /> Verificado</span>
                        : <span className="text-[11px] text-amber-600">Por verificar</span>}
                    </span>
                    <button disabled={busy === 'lang_' + l.lang_code} onClick={() => removeLang(l.lang_code)} className="p-1 text-slate-400 hover:text-rose-600 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ul>
            )}
            {addable.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <select value={newLang} onChange={(e) => setNewLang(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-brand-500">
                  <option value="">Idioma…</option>
                  {addable.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
                <select value={newLevel} onChange={(e) => setNewLevel(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-brand-500">
                  {LEVELS.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}
                </select>
                <button disabled={!newLang || busy === 'addlang'} onClick={addLang} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50">
                  {busy === 'addlang' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar
                </button>
              </div>
            ) : <p className="text-xs text-slate-400">Todos os idiomas disponíveis já estão declarados.</p>}
          </>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-900">Pedir tradução de cursos</h2></div>
        {courses === null ? <div className="p-5 text-sm text-slate-400">A carregar…</div>
          : courses.length === 0 ? <div className="p-5 text-sm text-slate-400">Ainda não tens cursos.</div>
          : (
            <ul className="divide-y divide-slate-100">
              {courses.map((c) => {
                const targets = locales.filter((l) => l.code !== (c.source_lang || 'pt'));
                return (
                  <li key={c.course_id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-medium text-slate-900 text-sm truncate">{c.title}</span>
                      <span className="text-[11px] text-slate-400 flex-shrink-0">Original: {localeName(c.source_lang || 'pt')}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {targets.map((t) => {
                        const req = c.requests.find((r) => r.target_lang === t.code);
                        const b = req ? REQ_BADGE[req.status] : null;
                        const pending = busy === c.course_id + '_' + t.code;
                        if (b && req && req.status !== 'rejected' && req.status !== 'failed') {
                          return <span key={t.code} className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${b.cls}`}>{t.name} · {b.label}</span>;
                        }
                        return (
                          <button key={t.code} disabled={pending} onClick={() => requestTranslation(c.course_id, t.code)}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700 disabled:opacity-50">
                            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} {t.name}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
      </section>
    </div>
  );
}
