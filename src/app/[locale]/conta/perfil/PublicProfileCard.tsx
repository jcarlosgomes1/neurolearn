'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Check, Loader2, Wand2, Heart, X, RefreshCw } from 'lucide-react';

type Lang = 'pt' | 'en' | 'es' | 'fr';
type Interest = { slug: string; category: string; emoji: string; label: string };

const STR: Record<string, Record<Lang, string>> = {
  interests_title: { pt: 'Interesses', en: 'Interests', es: 'Intereses', fr: 'Centres d\u2019intérêt' },
  interests_hint: { pt: 'Escolhe o que te representa \u2014 ajuda a personalizar a tua presença.', en: 'Pick what represents you \u2014 it personalizes your presence.', es: 'Elige lo que te representa \u2014 personaliza tu presencia.', fr: 'Choisis ce qui te représente \u2014 cela personnalise ta présence.' },
  save: { pt: 'Guardar', en: 'Save', es: 'Guardar', fr: 'Enregistrer' },
  saved: { pt: 'Guardado', en: 'Saved', es: 'Guardado', fr: 'Enregistré' },
  auto_title: { pt: 'Apresentação automática', en: 'Automatic introduction', es: 'Presentación automática', fr: 'Présentation automatique' },
  auto_desc: { pt: 'Compomos um título e uma apresentação a partir do teu perfil e interesses. Tu revês e publicas \u2014 sem escrever nada.', en: 'We compose a headline and intro from your profile and interests. You review and publish \u2014 no writing needed.', es: 'Componemos un título y una presentación a partir de tu perfil e intereses. Tú revisas y publicas \u2014 sin escribir nada.', fr: 'Nous composons un titre et une présentation à partir de ton profil et de tes centres d\u2019intérêt. Tu vérifies et publies \u2014 sans rien écrire.' },
  compose: { pt: 'Compor automaticamente', en: 'Compose automatically', es: 'Componer automáticamente', fr: 'Composer automatiquement' },
  recompose: { pt: 'Compor de novo', en: 'Compose again', es: 'Componer de nuevo', fr: 'Composer à nouveau' },
  composing: { pt: 'A compor\u2026', en: 'Composing\u2026', es: 'Componiendo\u2026', fr: 'Composition\u2026' },
  proposal: { pt: 'Proposta', en: 'Proposal', es: 'Propuesta', fr: 'Proposition' },
  publish: { pt: 'Publicar', en: 'Publish', es: 'Publicar', fr: 'Publier' },
  discard: { pt: 'Descartar', en: 'Discard', es: 'Descartar', fr: 'Rejeter' },
  published: { pt: 'Publicado', en: 'Published', es: 'Publicado', fr: 'Publié' },
  current: { pt: 'A tua apresentação', en: 'Your introduction', es: 'Tu presentación', fr: 'Ta présentation' },
  err: { pt: 'Não foi possível compor agora. Tenta novamente.', en: 'Could not compose now. Please try again.', es: 'No se pudo componer ahora. Inténtalo de nuevo.', fr: 'Impossible de composer pour le moment. Réessaie.' },
};

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function PublicProfileCard({ catalogue, initialInterests, initialPublic }: {
  catalogue: Interest[];
  initialInterests: string[];
  initialPublic: any;
}) {
  const locale = (useLocale() as Lang) || 'pt';
  const t = (k: string) => STR[k]?.[locale] ?? STR[k]?.pt ?? k;
  const sb = useMemo(() => createClient(), []);
  const pick = (o: any): string => (o && (o[locale] || o.pt || (Object.values(o)[0] as string))) || '';

  const [selected, setSelected] = useState<string[]>(initialInterests || []);
  const [savingInt, setSavingInt] = useState(false);
  const [savedInt, setSavedInt] = useState(false);

  const [status, setStatus] = useState<string>(initialPublic?.status || 'none');
  const [appHead, setAppHead] = useState<string>(pick(initialPublic?.headline));
  const [appBlurb, setAppBlurb] = useState<string>(pick(initialPublic?.blurb));
  const [propHead, setPropHead] = useState<string>(pick(initialPublic?.proposed_headline));
  const [propBlurb, setPropBlurb] = useState<string>(pick(initialPublic?.proposed_blurb));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const grouped = useMemo(() => {
    const m: Record<string, Interest[]> = {};
    for (const it of catalogue || []) (m[it.category] = m[it.category] || []).push(it);
    return m;
  }, [catalogue]);

  function toggle(slug: string) {
    setSelected((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));
  }
  async function saveInterests() {
    setSavingInt(true);
    await sb.rpc('nl_profile_interests_set', { p_slugs: selected });
    setSavingInt(false); setSavedInt(true); setTimeout(() => setSavedInt(false), 1600);
  }

  async function compose() {
    setErr(''); setBusy(true); setStatus('generating');
    const { data: fired } = await sb.rpc('nl_profile_blurb_enqueue');
    if (!(fired as any)?.ok) { setErr(t('err')); setBusy(false); setStatus(appBlurb ? 'approved' : 'none'); return; }
    for (let i = 0; i < 18; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      const { data: c } = await sb.rpc('nl_profile_blurb_collect');
      const cc = c as any;
      if (cc?.status === 'proposed') {
        setPropHead(pick(cc.proposed_headline)); setPropBlurb(pick(cc.proposed_blurb));
        setStatus('proposed'); setBusy(false); return;
      }
      if (cc?.ok === false) { setErr(t('err')); setStatus(appBlurb ? 'approved' : 'none'); setBusy(false); return; }
    }
    setErr(t('err')); setStatus(appBlurb ? 'approved' : 'none'); setBusy(false);
  }
  async function publish() {
    setBusy(true); await sb.rpc('nl_profile_blurb_approve');
    setAppHead(propHead); setAppBlurb(propBlurb); setStatus('approved'); setBusy(false);
  }
  async function discard() {
    setBusy(true); await sb.rpc('nl_profile_blurb_reject');
    setPropHead(''); setPropBlurb(''); setStatus(appBlurb ? 'approved' : 'none'); setBusy(false);
  }

  return (
    <>
      {/* Interesses */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Heart className="h-5 w-5 text-violet-600" />{t('interests_title')}</h2>
          <button onClick={saveInterests} disabled={savingInt}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 shrink-0">
            {savingInt ? <Loader2 className="h-4 w-4 animate-spin" /> : savedInt ? <Check className="h-4 w-4" /> : null}{savedInt ? t('saved') : t('save')}
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-4">{t('interests_hint')}</p>
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex flex-wrap gap-2">
                {items.map((it) => {
                  const on = selected.includes(it.slug);
                  return (
                    <button key={it.slug} onClick={() => toggle(it.slug)}
                      className={cx('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                        on ? 'bg-violet-600 text-white border-violet-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300')}>
                      <span>{it.emoji}</span>{it.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Apresentação automática */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1"><Wand2 className="h-5 w-5 text-violet-600" />{t('auto_title')}</h2>
        <p className="text-sm text-slate-500 mb-4">{t('auto_desc')}</p>

        {status === 'approved' && appBlurb && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 mb-4">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1.5"><Check className="h-3.5 w-3.5" />{t('published')}</div>
            {appHead && <div className="font-semibold text-slate-900">{appHead}</div>}
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{appBlurb}</p>
          </div>
        )}

        {status === 'proposed' && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4 mb-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-violet-700 mb-1.5">{t('proposal')}</div>
            {propHead && <div className="font-semibold text-slate-900">{propHead}</div>}
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{propBlurb}</p>
            <div className="flex items-center gap-2 mt-4">
              <button onClick={publish} disabled={busy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-sm disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{t('publish')}
              </button>
              <button onClick={discard} disabled={busy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium disabled:opacity-50">
                <X className="h-4 w-4" />{t('discard')}
              </button>
            </div>
          </div>
        )}

        {err && <p className="text-sm text-rose-600 mb-3">{err}</p>}

        {status !== 'proposed' && (
          <button onClick={compose} disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" />{t('composing')}</> : <>{(status === 'approved' && appBlurb) ? <RefreshCw className="h-4 w-4" /> : <Wand2 className="h-4 w-4" />}{(status === 'approved' && appBlurb) ? t('recompose') : t('compose')}</>}
          </button>
        )}
      </div>
    </>
  );
}
