'use client';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Save, Eye, Code2, FileText, Globe2, Settings2, Trash2 } from 'lucide-react';

const LANGS = [
  { code: 'pt', label: 'PT', flag: '🇵🇹' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
];

export function PageEditor({ initial }: { initial: { page: any; translations: any[] } }) {
  const router = useRouter();
  const [page, setPage] = useState<any>(initial.page);
  const [translations, setTranslations] = useState<any[]>(initial.translations || []);
  const [activeLang, setActiveLang] = useState<string>('pt');
  const [activeTab, setActiveTab] = useState<'content' | 'preview' | 'settings'>('content');
  const [busy, setBusy] = useState(false);

  const current = useMemo(() => translations.find((t) => t.lang === activeLang) || {
    page_id: page.id, lang: activeLang, title: '', subtitle: '', excerpt: '', content_md: '',
  }, [translations, activeLang, page.id]);

  function updateMeta<K extends string>(key: K, value: any) {
    setPage((prev: any) => ({ ...prev, [key]: value }));
  }
  function updateTr(key: string, value: any) {
    setTranslations((prev) => {
      const idx = prev.findIndex((t) => t.lang === activeLang);
      if (idx >= 0) {
        const out = [...prev];
        out[idx] = { ...out[idx], [key]: value };
        return out;
      }
      return [...prev, { page_id: page.id, lang: activeLang, [key]: value }];
    });
  }

  async function saveAll() {
    setBusy(true);
    try {
      const sb = createClient();
      await sb.rpc('nl_admin_page_upsert', {
        p_id: page.id, p_slug: page.slug, p_status: page.status,
        p_show_in_nav: page.show_in_nav, p_show_in_footer: page.show_in_footer,
        p_visibility: page.visibility, p_sort_order: page.sort_order,
        p_emoji: page.emoji, p_cover_url: page.cover_url, p_nav_label: page.nav_label,
      });
      for (const t of translations) {
        if (!t.title) continue;
        await sb.rpc('nl_admin_page_translation_upsert', {
          p_page_id: page.id, p_lang: t.lang, p_title: t.title,
          p_subtitle: t.subtitle || null, p_excerpt: t.excerpt || null,
          p_content_md: t.content_md || null, p_meta_title: t.meta_title || null,
          p_meta_description: t.meta_description || null,
        });
      }
      toast.success('Guardado');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <AdminPageHeader title={translations.find((t) => t.lang === 'pt')?.title || page.slug} description={`/p/${page.slug}`} emoji={page.emoji || '📄'} />
        <button
          onClick={saveAll}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-br from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50">
          <Save className="h-4 w-4" /> {busy ? 'A guardar…' : 'Guardar tudo'}
        </button>
      </div>

      {/* Lang tabs */}
      <div className="flex items-center gap-1 mb-3">
        {LANGS.map((l) => {
          const has = translations.find((t) => t.lang === l.code && t.title);
          return (
            <button
              key={l.code}
              onClick={() => setActiveLang(l.code)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${activeLang === l.code ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              <span className="text-base">{l.flag}</span>
              {l.label}
              {has && <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full ml-1" />}
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center border-b border-slate-100 bg-slate-50/60 px-2 pt-2">
          {[
            { id: 'content', icon: FileText, label: 'Conteúdo' },
            { id: 'preview', icon: Eye, label: 'Pré-visualizar' },
            { id: 'settings', icon: Settings2, label: 'Definições' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-t-lg ${activeTab === t.id ? 'bg-white text-fuchsia-600 border-x border-t border-slate-200 -mb-px' : 'text-slate-500 hover:text-slate-700'}`}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'content' && (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Título ({activeLang.toUpperCase()})</label>
              <input
                value={current.title || ''}
                onChange={(e) => updateTr('title', e.target.value)}
                placeholder="Título da página"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-base font-semibold focus:border-fuchsia-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Subtítulo</label>
              <input
                value={current.subtitle || ''}
                onChange={(e) => updateTr('subtitle', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-fuchsia-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Excerpt <span className="text-slate-400 font-normal">(meta description fallback)</span></label>
              <textarea
                value={current.excerpt || ''}
                onChange={(e) => updateTr('excerpt', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-fuchsia-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Code2 className="h-3 w-3" /> Conteúdo (Markdown)
              </label>
              <textarea
                value={current.content_md || ''}
                onChange={(e) => updateTr('content_md', e.target.value)}
                rows={20}
                placeholder={`# Bem-vindos\n\nMarkdown completo suportado.\n\n## Secção\n\nTexto…`}
                className="w-full px-3 py-3 border border-slate-200 rounded-lg text-sm font-mono focus:border-fuchsia-500 outline-none resize-y leading-relaxed" />
              <p className="text-[11px] text-slate-400 mt-1.5">Dica: usa <code className="bg-slate-100 px-1 rounded">##</code> para activar accordion em legal/FAQ.</p>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{current.title || '(sem título)'}</h1>
            {current.subtitle && <p className="mt-2 text-base text-slate-600">{current.subtitle}</p>}
            <div className="mt-6 prose prose-slate prose-sm sm:prose-base max-w-none whitespace-pre-wrap">
              {current.content_md || <span className="text-slate-400 italic">Sem conteúdo</span>}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-5 space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Slug</label>
                <input
                  value={page.slug || ''}
                  onChange={(e) => updateMeta('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:border-fuchsia-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Estado</label>
                <select
                  value={page.status || 'draft'}
                  onChange={(e) => updateMeta('status', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-fuchsia-500 outline-none">
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Visibilidade</label>
                <select
                  value={page.visibility || 'public'}
                  onChange={(e) => updateMeta('visibility', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-fuchsia-500 outline-none">
                  <option value="public">Pública</option>
                  <option value="authenticated">Apenas autenticados</option>
                  <option value="admin">Apenas admin</option>
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Emoji</label>
                <input
                  value={page.emoji || ''}
                  onChange={(e) => updateMeta('emoji', e.target.value)}
                  placeholder="📄"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-fuchsia-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Cover URL</label>
                <input
                  value={page.cover_url || ''}
                  onChange={(e) => updateMeta('cover_url', e.target.value)}
                  placeholder="https://…"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-fuchsia-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Ordem (no nav/footer)</label>
                <input
                  type="number"
                  value={page.sort_order ?? 0}
                  onChange={(e) => updateMeta('sort_order', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-fuchsia-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Label nav (se diferente do título)</label>
              <input
                value={page.nav_label || ''}
                onChange={(e) => updateMeta('nav_label', e.target.value)}
                placeholder="Vazio = usa título"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-fuchsia-500 outline-none" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!page.show_in_nav}
                  onChange={(e) => updateMeta('show_in_nav', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-fuchsia-600" />
                <div>
                  <div className="text-sm text-slate-900 font-medium">Mostrar no menu principal</div>
                  <div className="text-xs text-slate-500 mt-0.5">Aparece no header de navegação</div>
                </div>
              </label>
              <label className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!page.show_in_footer}
                  onChange={(e) => updateMeta('show_in_footer', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-fuchsia-600" />
                <div>
                  <div className="text-sm text-slate-900 font-medium">Mostrar no footer</div>
                  <div className="text-xs text-slate-500 mt-0.5">Aparece na secção da empresa</div>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
