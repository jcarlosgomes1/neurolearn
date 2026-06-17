'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Plus, Edit3, Trash2, ExternalLink, FileEdit, Globe, Lock, Eye, EyeOff } from 'lucide-react';

export function CmsPagesClient({ pages }: { pages: any[] }) {
  const router = useRouter();
  const locale = useLocale();
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!newSlug || !newTitle) {
      toast.error('Slug e título obrigatórios');
      return;
    }
    setBusy(true);
    try {
      const sb = createClient();
      const { data: pageId, error } = await sb.rpc('nl_admin_page_upsert', {
        p_slug: newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      });
      if (error) throw error;
      await sb.rpc('nl_admin_page_translation_upsert', {
        p_page_id: pageId, p_lang: 'pt', p_title: newTitle,
      });
      toast.success('Página criada');
      setCreating(false);
      setNewSlug(''); setNewTitle('');
      router.push(`/admin/cms-pages/${pageId}/edit`);
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string, title: string) {
    if (!confirm(`Apagar "${title}"? Esta acção não pode ser revertida.`)) return;
    try {
      const sb = createClient();
      await sb.rpc('nl_admin_page_delete', { p_id: id });
      toast.success('Página removida');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    }
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white text-sm font-semibold rounded-lg shadow-sm">
            <Plus className="h-4 w-4" /> Nova página
          </button>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2 shadow-sm">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título"
              className="px-2.5 py-1.5 border border-slate-200 rounded text-sm w-40 outline-none focus:border-fuchsia-500" />
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="slug-url"
              className="px-2.5 py-1.5 border border-slate-200 rounded text-sm w-32 font-mono outline-none focus:border-fuchsia-500" />
            <button onClick={create} disabled={busy} className="px-3 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-semibold rounded">
              {busy ? '…' : 'Criar'}
            </button>
            <button onClick={() => setCreating(false)} className="text-slate-500 hover:text-slate-900 px-2 py-1.5 text-sm">Cancelar</button>
          </div>
        )}
      </div>

      {pages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 items-center justify-center mb-3">
            <FileEdit className="h-7 w-7" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm mb-1">Sem páginas ainda</h3>
          <p className="text-sm text-slate-500">Cria a primeira página personalizada.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {pages.map((p) => (
              <div key={p.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 group">
                <div className="text-2xl">{p.emoji || '📄'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900">{p.title || '(sem título)'}</span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">/p/{p.slug}</span>
                    <StatusBadge status={p.status} />
                    {p.show_in_nav && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">Nav</span>}
                    {p.show_in_footer && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">Footer</span>}
                    {p.visibility !== 'public' && <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">{p.visibility}</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {p.lang_count} {p.lang_count === 1 ? 'idioma' : 'idiomas'} · atualizado {new Date(p.updated_at).toLocaleDateString('pt-PT')}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  {p.status === 'published' && (
                    <a
                      href={`/${locale}/p/${p.slug}`}
                      target="_blank"
                      className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-fuchsia-600"
                      title="Abrir página">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <a
                    href={`/${locale}/admin/cms-pages/${p.id}/edit`}
                    className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-fuchsia-600">
                    <Edit3 className="h-4 w-4" />
                  </a>
                  <button onClick={() => del(p.id, p.title || p.slug)} className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const M: Record<string, { label: string; cls: string; icon: any }> = {
    draft: { label: 'Rascunho', cls: 'bg-slate-100 text-slate-700', icon: EyeOff },
    published: { label: 'Publicado', cls: 'bg-emerald-100 text-emerald-700', icon: Eye },
    archived: { label: 'Arquivado', cls: 'bg-amber-100 text-amber-700', icon: Lock },
  };
  const m = M[status] || M.draft;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${m.cls}`}>
      <Icon className="h-2.5 w-2.5" /> {m.label}
    </span>
  );
}
