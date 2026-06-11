'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface HomeBlock { slug: string; lang: string; data: Record<string, unknown>; updated_at: string }
interface LegalPage { id: number; page_slug: string; lang_code: string; title: string; content_md: string; last_updated_label: string | null; is_active: boolean; updated_at: string }

interface EditingState { source: string; slug: string; lang: string; data: Record<string, unknown> }

const LANG_LABEL: Record<string, string> = { pt: '🇵🇹 PT', en: '🇬🇧 EN', es: '🇪🇸 ES', fr: '🇫🇷 FR' };

// Field label hints (per slug.key) — shown in UI as friendly labels
const FIELD_LABELS: Record<string, string> = {
  title: 'Título',
  subtitle: 'Subtítulo',
  sub: 'Subtítulo',
  badge: 'Badge / Etiqueta',
  trust: 'Linha de confiança',
  note: 'Nota',
  btn1: 'Botão primário',
  btn2: 'Botão secundário',
  btn_primary: 'Botão primário',
  btn_secondary: 'Botão secundário',
  cta: 'Call to action',
  popular: 'Etiqueta "Popular"',
  brand: 'Nome da marca',
  items: 'Items',
  content_md: 'Conteúdo (Markdown)',
  last_updated_label: 'Etiqueta de última atualização',
};

function friendlyLabel(key: string): string {
  return FIELD_LABELS[key] || key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

export function CmsView() {
  const t = useTranslations('cms_admin');
  const [homeBlocks, setHomeBlocks] = useState<HomeBlock[]>([]);
  const [legalPages, setLegalPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);

  const SLUG_DISPLAY: Record<string, { label: string; emoji: string; group: string }> = {
    hero: { label: t('slug.hero'), emoji: '🎯', group: t('group_home') },
    features: { label: t('slug.features'), emoji: '✨', group: t('group_home') },
    stats: { label: t('slug.stats'), emoji: '📊', group: t('group_home') },
    testimonials: { label: t('slug.testimonials'), emoji: '💬', group: t('group_home') },
    plans: { label: t('slug.plans'), emoji: '💳', group: t('group_pricing') },
    pricing_header: { label: t('slug.pricing_header'), emoji: '📑', group: t('group_pricing') },
    cta_section: { label: t('slug.cta_section'), emoji: '🚀', group: t('group_home') },
    faq: { label: t('slug.faq'), emoji: '❓', group: t('group_home') },
    footer_brand: { label: t('slug.footer_brand'), emoji: '🦶', group: t('group_footer') },
  };

  async function callApi(action: string, body: Record<string, unknown> = {}) {
    const sb = createClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) throw new Error(t('err_no_session'));
    const res = await fetch(`${SUPABASE_URL}/functions/v1/cms-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action, ...body }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || t('err_api'));
    return data;
  }

  async function load() {
    try {
      const data = await callApi('list');
      setHomeBlocks(data.home_blocks || []);
      setLegalPages(data.legal_pages || []);
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function startEdit(source: string, slug: string, lang: string) {
    try {
      const data = await callApi('get', { source, slug, lang });
      if (!data.item) { toast.error(t('err_not_found')); return; }
      const editData = source === 'nl_home_blocks' 
        ? data.item.data 
        : { title: data.item.title, content_md: data.item.content_md, last_updated_label: data.item.last_updated_label };
      setEditing({ source, slug, lang, data: editData });
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      await callApi('save', { ...editing });
      toast.success(t('toast_saved'));
      setEditing(null);
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(false); }
  }

  async function autoTranslate(source: string, slug: string) {
    setTranslating(`${source}:${slug}`);
    try {
      const data = await callApi('auto_translate', { source, slug });
      const okLangs = Object.entries(data.translated as Record<string, boolean>).filter(([, v]) => v).map(([k]) => k.toUpperCase());
      toast.success(t('toast_translated', { langs: okLangs.join(', ') }));
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
    finally { setTranslating(null); }
  }

  function updateEditingData(newData: Record<string, unknown>) {
    if (!editing) return;
    setEditing({ ...editing, data: newData });
  }

  const blocksBySlug = homeBlocks.reduce((acc, b) => {
    if (!acc[b.slug]) acc[b.slug] = {};
    acc[b.slug][b.lang] = b;
    return acc;
  }, {} as Record<string, Record<string, HomeBlock>>);

  const pagesBySlug = legalPages.reduce((acc, p) => {
    if (!acc[p.page_slug]) acc[p.page_slug] = {};
    acc[p.page_slug][p.lang_code] = p;
    return acc;
  }, {} as Record<string, Record<string, LegalPage>>);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader backHref="/admin" emoji="🧱" title={t('title')} description={t('subtitle')} />

      {loading ? (
        <div className="mt-8 text-center text-slate-400 py-10">{t('loading')}</div>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="text-lg font-bold text-slate-900 mb-3">{t('home_section')}</h2>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {Object.keys(blocksBySlug).sort().map(slug => {
                const meta = SLUG_DISPLAY[slug] || { label: slug, emoji: '📄', group: t('group_other') };
                const langs = blocksBySlug[slug];
                return (
                  <div key={slug} className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="text-2xl">{meta.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900">{meta.label}</div>
                        <div className="text-xs text-slate-500 font-mono">{slug} · {meta.group}</div>
                      </div>
                      <button onClick={() => autoTranslate('nl_home_blocks', slug)} disabled={translating === `nl_home_blocks:${slug}`}
                        className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium px-3 py-1.5 rounded-md disabled:opacity-50">
                        {translating === `nl_home_blocks:${slug}` ? t('translating') : t('auto_translate')}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['pt', 'en', 'es', 'fr'] as const).map(lang => (
                        <button key={lang} onClick={() => startEdit('nl_home_blocks', slug, lang)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-md border ${langs[lang] ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'}`}>
                          {LANG_LABEL[lang]} {!langs[lang] && t('create')}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-3">{t('legal_section')}</h2>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {Object.keys(pagesBySlug).sort().map(slug => {
                const langs = pagesBySlug[slug];
                const ptPage = langs.pt;
                return (
                  <div key={slug} className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="text-2xl">📄</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900">{ptPage?.title || slug}</div>
                        <div className="text-xs text-slate-500 font-mono">{slug}{ptPage?.last_updated_label ? ` · ${ptPage.last_updated_label}` : ''}</div>
                      </div>
                      <button onClick={() => autoTranslate('nl_legal_pages', slug)} disabled={translating === `nl_legal_pages:${slug}`}
                        className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium px-3 py-1.5 rounded-md disabled:opacity-50">
                        {translating === `nl_legal_pages:${slug}` ? t('translating') : t('auto_translate')}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['pt', 'en', 'es', 'fr'] as const).map(lang => (
                        <button key={lang} onClick={() => startEdit('nl_legal_pages', slug, lang)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-md border ${langs[lang] ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'}`}>
                          {LANG_LABEL[lang]} {!langs[lang] && t('create')}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {editing && <EditModal editing={editing} onClose={() => setEditing(null)} onSave={save} onChange={updateEditingData} saving={saving} />}
    </div>
  );
}

interface EditModalProps { editing: EditingState; onClose: () => void; onSave: () => void; onChange: (data: Record<string, unknown>) => void; saving: boolean }

function EditModal({ editing, onClose, onSave, onChange, saving }: EditModalProps) {
  const t = useTranslations('cms_admin');
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [jsonText, setJsonText] = useState(JSON.stringify(editing.data, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  function setKey(key: string, value: unknown) {
    onChange({ ...editing.data, [key]: value });
  }
  function setJsonAndSync(text: string) {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      onChange(parsed);
      setJsonError(null);
    } catch (e) { setJsonError(e instanceof Error ? e.message : String(e)); }
  }
  function switchToJson() {
    setJsonText(JSON.stringify(editing.data, null, 2));
    setJsonError(null);
    setMode('json');
  }
  function switchToForm() {
    try {
      const parsed = JSON.parse(jsonText);
      onChange(parsed);
      setJsonError(null);
      setMode('form');
    } catch (e) { setJsonError(e instanceof Error ? e.message : String(e)); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate">{t('modal_title', { slug: editing.slug })}</div>
            <div className="text-xs text-slate-500 font-mono truncate">{editing.source} · {editing.lang.toUpperCase()}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-md p-0.5 text-[11px] font-medium">
              <button onClick={mode === 'json' ? switchToForm : undefined}
                className={`px-2 py-1 rounded ${mode === 'form' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                {t('mode_form')}
              </button>
              <button onClick={mode === 'form' ? switchToJson : undefined}
                className={`px-2 py-1 rounded ${mode === 'json' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                {t('mode_json')}
              </button>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {mode === 'form' ? (
            <FieldRenderer data={editing.data} onChange={(d) => onChange(d)} />
          ) : (
            <>
              <p className="text-xs text-slate-500 mb-2">{t('modal_desc_json')}</p>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonAndSync(e.target.value)}
                className="w-full h-96 font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none"
                spellCheck={false}
              />
              {jsonError && <p className="mt-2 text-sm text-rose-600">{t('json_invalid', { err: jsonError })}</p>}
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="text-sm font-medium px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700">{t('cancel')}</button>
          <button onClick={onSave} disabled={saving || !!jsonError} className="text-sm font-medium px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50">
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// === Recursive field renderer ===
function FieldRenderer({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) => (
        <FieldEditor key={key} fieldKey={key} value={value} onChange={(v) => onChange({ ...data, [key]: v })} />
      ))}
    </div>
  );
}

function FieldEditor({ fieldKey, value, onChange }: { fieldKey: string; value: unknown; onChange: (v: unknown) => void }) {
  const label = friendlyLabel(fieldKey);

  // String
  if (typeof value === 'string') {
    const isLong = value.length > 80 || value.includes('\n');
    const isMarkdown = fieldKey === 'content_md';
    if (isMarkdown) {
      return (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
          <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={18}
            className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none"
            spellCheck={false} />
          <p className="text-[10px] text-slate-400 mt-1">Markdown · suporta # ## ### **negrito** *itálico* [link](url) - listas</p>
        </div>
      );
    }
    if (isLong) {
      return (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
          <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
            className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none" />
        </div>
      );
    }
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none" />
      </div>
    );
  }

  // Number
  if (typeof value === 'number') {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
          className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none" />
      </div>
    );
  }

  // Boolean
  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <input type="checkbox" id={`f-${fieldKey}`} checked={value} onChange={(e) => onChange(e.target.checked)}
          className="rounded border-slate-300" />
        <label htmlFor={`f-${fieldKey}`} className="text-sm font-medium text-slate-700">{label}</label>
      </div>
    );
  }

  // Array
  if (Array.isArray(value)) {
    return <ArrayEditor fieldKey={fieldKey} label={label} value={value} onChange={onChange} />;
  }

  // Object
  if (value && typeof value === 'object') {
    return (
      <div className="border border-slate-200 rounded-lg bg-slate-50 p-3">
        <div className="text-xs font-semibold text-slate-700 mb-2">{label}</div>
        <div className="space-y-3 pl-2 border-l-2 border-slate-200">
          <FieldRenderer data={value as Record<string, unknown>} onChange={(d) => onChange(d)} />
        </div>
      </div>
    );
  }

  // Null / undefined
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
      <input type="text" value="" onChange={(e) => onChange(e.target.value)}
        placeholder={String(value)}
        className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none" />
    </div>
  );
}

function ArrayEditor({ fieldKey, label, value, onChange }: { fieldKey: string; label: string; value: unknown[]; onChange: (v: unknown[]) => void }) {
  // Determine element shape from first non-null item
  const sample = value.find((v) => v !== null && v !== undefined);
  const isStringArray = !sample || typeof sample === 'string';
  const isObjectArray = sample && typeof sample === 'object' && !Array.isArray(sample);

  function addItem() {
    if (isStringArray) onChange([...value, '']);
    else if (isObjectArray) {
      const template: Record<string, unknown> = {};
      for (const k of Object.keys(sample as Record<string, unknown>)) {
        const v = (sample as Record<string, unknown>)[k];
        if (typeof v === 'string') template[k] = '';
        else if (typeof v === 'number') template[k] = 0;
        else if (Array.isArray(v)) template[k] = [];
        else template[k] = '';
      }
      onChange([...value, template]);
    } else onChange([...value, '']);
  }

  function removeItem(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function moveItem(i: number, dir: -1 | 1) {
    const newArr = [...value];
    const target = i + dir;
    if (target < 0 || target >= newArr.length) return;
    [newArr[i], newArr[target]] = [newArr[target], newArr[i]];
    onChange(newArr);
  }

  function updateItem(i: number, v: unknown) {
    const newArr = [...value];
    newArr[i] = v;
    onChange(newArr);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-semibold text-slate-700">{label} <span className="text-slate-400 font-normal">({value.length})</span></label>
        <button type="button" onClick={addItem}
          className="text-[11px] font-medium px-2 py-1 rounded bg-brand-50 text-brand-700 hover:bg-brand-100">
          + Adicionar
        </button>
      </div>
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="border border-slate-200 rounded-lg bg-white p-2 sm:p-3 relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-400 font-mono">#{i + 1}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0}
                  className="w-6 h-6 rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30 text-xs">↑</button>
                <button type="button" onClick={() => moveItem(i, 1)} disabled={i === value.length - 1}
                  className="w-6 h-6 rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30 text-xs">↓</button>
                <button type="button" onClick={() => removeItem(i)}
                  className="w-6 h-6 rounded text-rose-500 hover:bg-rose-50 text-xs">✕</button>
              </div>
            </div>
            {typeof item === 'string' ? (
              item.length > 80 || item.includes('\n') ? (
                <textarea value={item} onChange={(e) => updateItem(i, e.target.value)} rows={2}
                  className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded focus:border-brand-400 focus:outline-none" />
              ) : (
                <input type="text" value={item} onChange={(e) => updateItem(i, e.target.value)}
                  className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded focus:border-brand-400 focus:outline-none" />
              )
            ) : item && typeof item === 'object' && !Array.isArray(item) ? (
              <FieldRenderer data={item as Record<string, unknown>} onChange={(d) => updateItem(i, d)} />
            ) : (
              <input type="text" value={String(item ?? '')} onChange={(e) => updateItem(i, e.target.value)}
                className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded focus:border-brand-400 focus:outline-none" />
            )}
          </div>
        ))}
        {value.length === 0 && (
          <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
            Sem items. Carrega em &quot;+ Adicionar&quot; para criar.
          </div>
        )}
      </div>
    </div>
  );
}
