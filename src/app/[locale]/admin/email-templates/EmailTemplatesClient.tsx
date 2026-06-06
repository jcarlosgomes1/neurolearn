'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Mail, Plus, Edit3, X, Globe, Code2, Eye, Save } from 'lucide-react';

const LANGUAGES = [
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export function EmailTemplatesClient({ templates }: { templates: any[] }) {
  const [editing, setEditing] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const t of templates) {
      const arr = map.get(t.template_key) || [];
      arr.push(t);
      map.set(t.template_key, arr);
    }
    return Array.from(map.entries()).map(([key, langs]) => ({ key, langs }));
  }, [templates]);

  async function save(form: any) {
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_email_template_upsert', {
        p_template_key: form.template_key,
        p_lang: form.lang,
        p_subject: form.subject,
        p_body_html: form.body_html,
        p_body_text: form.body_text || null,
      });
      if (error) throw error;
      toast.success('Template guardado');
      setEditing(null);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao guardar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setEditing({ template_key: '', lang: 'pt', subject: '', body_html: '', body_text: '' })}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm">
          <Plus className="h-4 w-4" /> Novo template
        </button>
      </div>

      {grouped.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 items-center justify-center mb-3">
            <Mail className="h-7 w-7" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm mb-1">Sem templates ainda</h3>
          <p className="text-sm text-slate-500">Cria um template para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {grouped.map(({ key, langs }) => (
            <div key={key} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900 font-mono">{key}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{langs.length} {langs.length === 1 ? 'idioma' : 'idiomas'}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-2">
                {LANGUAGES.map((lang) => {
                  const t = langs.find((l) => l.lang === lang.code);
                  return (
                    <button
                      key={lang.code}
                      onClick={() => setEditing(t ? t : { template_key: key, lang: lang.code, subject: '', body_html: '', body_text: '' })}
                      className="w-full flex items-center gap-2 px-2 py-2 hover:bg-slate-50 rounded-lg group transition-colors text-left">
                      <span className="text-base">{lang.flag}</span>
                      <span className="text-xs text-slate-700 flex-1 truncate font-medium">
                        {t ? t.subject : <span className="text-slate-400 italic">— Sem template em {lang.label}</span>}
                      </span>
                      {t ? <Edit3 className="h-3 w-3 text-slate-300 group-hover:text-blue-500" /> : <Plus className="h-3 w-3 text-slate-300 group-hover:text-blue-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <TemplateEditor initial={editing} busy={busy} onSave={save} onClose={() => setEditing(null)} />}
    </>
  );
}

function TemplateEditor({ initial, busy, onSave, onClose }: any) {
  const [form, setForm] = useState({ ...initial });
  const [tab, setTab] = useState<'html' | 'text' | 'preview'>('html');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 flex items-stretch sm:items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-full sm:max-h-[92vh] shadow-2xl overflow-hidden flex flex-col">
        <div className="border-b border-slate-100 p-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">{initial.subject ? 'Editar' : 'Novo'} template</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{form.template_key || 'template_key'} · {form.lang}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-4 border-b border-slate-100 grid grid-cols-3 gap-3 flex-shrink-0">
          <div>
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1 block">Key</label>
            <input
              type="text"
              value={form.template_key || ''}
              onChange={(e) => setForm({ ...form, template_key: e.target.value })}
              disabled={!!initial.subject}
              placeholder="welcome_email"
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1 block">Idioma</label>
            <select
              value={form.lang || 'pt'}
              onChange={(e) => setForm({ ...form, lang: e.target.value })}
              disabled={!!initial.subject}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none disabled:bg-slate-50">
              {['pt','en','es','fr'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1 block">Assunto</label>
            <input
              type="text"
              value={form.subject || ''}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Bem-vindo, {{first_name}}!"
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
          </div>
        </div>

        <div className="flex items-center gap-1 px-4 pt-2 border-b border-slate-100 flex-shrink-0 bg-slate-50/60">
          {[
            { id: 'html', icon: Code2, label: 'HTML' },
            { id: 'text', icon: Mail, label: 'Texto' },
            { id: 'preview', icon: Eye, label: 'Pré-visualizar' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg ${tab === t.id ? 'bg-white text-blue-600 border-x border-t border-slate-200 -mb-px' : 'text-slate-500 hover:text-slate-700'}`}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === 'html' && (
            <textarea
              value={form.body_html || ''}
              onChange={(e) => setForm({ ...form, body_html: e.target.value })}
              placeholder="<!DOCTYPE html><html>..."
              className="w-full h-full min-h-[300px] px-4 py-3 text-xs font-mono outline-none resize-none border-0 focus:ring-0"
              spellCheck={false} />
          )}
          {tab === 'text' && (
            <textarea
              value={form.body_text || ''}
              onChange={(e) => setForm({ ...form, body_text: e.target.value })}
              placeholder="Versão texto plano (fallback para clientes que não renderizam HTML)"
              className="w-full h-full min-h-[300px] px-4 py-3 text-sm outline-none resize-none border-0 focus:ring-0" />
          )}
          {tab === 'preview' && (
            <div className="p-4 min-h-[300px]">
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 text-xs">
                  <div className="font-semibold text-slate-700">{form.subject || '(sem assunto)'}</div>
                </div>
                <div className="p-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: form.body_html || '<p class="text-slate-400">Sem conteúdo HTML</p>' }} />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-4 flex items-center justify-between gap-2 flex-shrink-0 bg-slate-50">
          <div className="text-[11px] text-slate-500">
            Variáveis suportadas: <code className="font-mono bg-white px-1 rounded">{`{{first_name}}`}</code> <code className="font-mono bg-white px-1 rounded">{`{{course_title}}`}</code> etc
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-white rounded-lg font-medium">Cancelar</button>
            <button
              onClick={() => onSave(form)}
              disabled={busy || !form.template_key || !form.subject}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
              <Save className="h-3.5 w-3.5" /> {busy ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
