'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface HomeBlock { slug: string; lang: string; data: any; updated_at: string }
interface LegalPage { id: number; page_slug: string; lang_code: string; title: string; last_updated_label: string | null; is_active: boolean; updated_at: string }

const SLUG_DISPLAY: Record<string, { label: string; emoji: string; group: string }> = {
  hero: { label: 'Hero', emoji: '🎯', group: 'Home pública' },
  features: { label: 'Features', emoji: '✨', group: 'Home pública' },
  stats: { label: 'Stats', emoji: '📊', group: 'Home pública' },
  testimonials: { label: 'Testemunhos', emoji: '💬', group: 'Home pública' },
  plans: { label: 'Planos', emoji: '💳', group: 'Pricing' },
  pricing_header: { label: 'Header Pricing', emoji: '📑', group: 'Pricing' },
  cta_section: { label: 'CTA final', emoji: '🚀', group: 'Home pública' },
  faq: { label: 'FAQ home', emoji: '❓', group: 'Home pública' },
  footer_brand: { label: 'Footer brand', emoji: '🦶', group: 'Footer' },
};

const LANG_LABEL: Record<string, string> = { pt: '🇵🇹 PT', en: '🇬🇧 EN', es: '🇪🇸 ES', fr: '🇫🇷 FR' };

export function CmsView() {
  const [homeBlocks, setHomeBlocks] = useState<HomeBlock[]>([]);
  const [legalPages, setLegalPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ source: string; slug: string; lang: string; data: any } | null>(null);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);

  async function callApi(action: string, body: any = {}) {
    const sb = createClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) throw new Error('Sem sessão');
    const res = await fetch(`${SUPABASE_URL}/functions/v1/cms-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action, ...body }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'API error');
    return data;
  }

  async function load() {
    try {
      const data = await callApi('list');
      setHomeBlocks(data.home_blocks || []);
      setLegalPages(data.legal_pages || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function startEdit(source: string, slug: string, lang: string) {
    try {
      const data = await callApi('get', { source, slug, lang });
      if (!data.item) { toast.error('Item não encontrado'); return; }
      const editData = source === 'nl_home_blocks' 
        ? data.item.data 
        : { title: data.item.title, content_md: data.item.content_md, last_updated_label: data.item.last_updated_label };
      setEditing({ source, slug, lang, data: editData });
    } catch (e: any) { toast.error(e.message); }
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      await callApi('save', editing);
      toast.success('Guardado');
      setEditing(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function autoTranslate(source: string, slug: string) {
    setTranslating(`${source}:${slug}`);
    try {
      const data = await callApi('auto_translate', { source, slug });
      const okLangs = Object.entries(data.translated).filter(([_, v]) => v).map(([k]) => k.toUpperCase());
      toast.success(`Traduzido para ${okLangs.join(', ')}`);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setTranslating(null); }
  }

  // Agrupa blocos por slug → langs disponíveis
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
      <Link href={'/admin' as any} className="text-sm text-brand-600 hover:underline">← Cockpit</Link>
      <div className="mt-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">📝 CMS</h1>
        <p className="text-sm text-slate-500 mt-1">Edita todos os textos públicos do site (hero, features, FAQ, footer, páginas legais). Traduções automáticas para EN/ES/FR.</p>
      </div>

      {loading ? (
        <div className="mt-8 text-center text-slate-400 py-10">A carregar...</div>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="text-lg font-bold text-slate-900 mb-3">🏠 Blocos da home & páginas públicas</h2>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {Object.keys(blocksBySlug).sort().map(slug => {
                const meta = SLUG_DISPLAY[slug] || { label: slug, emoji: '📄', group: 'Outros' };
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
                        {translating === `nl_home_blocks:${slug}` ? '⏳ A traduzir...' : '🌍 Auto-traduzir PT → EN/ES/FR'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['pt', 'en', 'es', 'fr'] as const).map(lang => (
                        <button key={lang} onClick={() => startEdit('nl_home_blocks', slug, lang)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-md border ${langs[lang] ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'}`}>
                          {LANG_LABEL[lang]} {!langs[lang] && '+ criar'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-3">📋 Páginas legais</h2>
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
                        {translating === `nl_legal_pages:${slug}` ? '⏳ A traduzir...' : '🌍 Auto-traduzir PT → EN/ES/FR'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['pt', 'en', 'es', 'fr'] as const).map(lang => (
                        <button key={lang} onClick={() => startEdit('nl_legal_pages', slug, lang)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-md border ${langs[lang] ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'}`}>
                          {LANG_LABEL[lang]} {!langs[lang] && '+ criar'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-bold text-slate-900 mb-2">💡 Como usar</h3>
            <ol className="space-y-1.5 text-sm text-slate-700">
              <li><strong>1.</strong> Edita o conteúdo PT primeiro (é o master).</li>
              <li><strong>2.</strong> Clica "🌍 Auto-traduzir" — gera EN/ES/FR automaticamente via Claude.</li>
              <li><strong>3.</strong> Revê cada idioma e ajusta se necessário.</li>
              <li><strong>4.</strong> O site refresca o conteúdo dentro de 60 segundos (revalidate de Next.js).</li>
            </ol>
          </section>
        </>
      )}

      {editing && <EditModal editing={editing} onClose={() => setEditing(null)} onSave={save} onChange={(data) => setEditing({ ...editing, data })} saving={saving} />}
    </div>
  );
}

function EditModal({ editing, onClose, onSave, onChange, saving }: any) {
  const [jsonText, setJsonText] = useState(JSON.stringify(editing.data, null, 2));
  const [error, setError] = useState<string | null>(null);

  function tryParse() {
    try {
      const parsed = JSON.parse(jsonText);
      setError(null);
      onChange(parsed);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  }

  function handleSave() {
    if (tryParse()) onSave();
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-900">Editar {editing.slug}</div>
            <div className="text-xs text-slate-500 font-mono">{editing.source} · {editing.lang.toUpperCase()}</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-xs text-slate-500 mb-2">Edita o JSON do bloco. Os campos serão usados no site directamente.</p>
          <textarea
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setError(null); }}
            onBlur={tryParse}
            className="w-full h-96 font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none"
            spellCheck={false}
          />
          {error && <p className="mt-2 text-sm text-rose-600">⚠ JSON inválido: {error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="text-sm font-medium px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !!error} className="text-sm font-medium px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50">
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
