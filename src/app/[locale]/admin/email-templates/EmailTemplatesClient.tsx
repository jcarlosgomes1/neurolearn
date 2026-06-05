'use client';

import { useEffect, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Edit, Save, Eye, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonList } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

const LANGS = ['pt', 'en', 'es', 'fr'];

interface TemplateForm {
  template_key: string;
  lang: string;
  subject: string;
  body_html: string;
  body_text: string;
  isNew?: boolean;
}

export function EmailTemplatesClient() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TemplateForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [_, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_email_templates_list');
      if (!error && Array.isArray(data)) setTemplates(data);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    if (!editing.template_key.trim() || !editing.lang) { toast.error('Key e lang obrigatórios'); return; }
    setSaving(true);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('nl_admin_email_template_upsert', {
        p_template_key: editing.template_key.trim(),
        p_lang: editing.lang,
        p_subject: editing.subject,
        p_body_html: editing.body_html,
        p_body_text: editing.body_text || null,
      });
      if (error) throw error;
      toast.success('Template guardado');
      setEditing(null);
      startTransition(load);
    } catch (e: any) {
      toast.error(e?.message || 'Erro');
    } finally { setSaving(false); }
  }

  // Agrupa por template_key
  const grouped: Record<string, any[]> = {};
  for (const t of templates) {
    if (!grouped[t.template_key]) grouped[t.template_key] = [];
    grouped[t.template_key].push(t);
  }
  const keys = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing({ template_key: '', lang: 'pt', subject: '', body_html: '', body_text: '', isNew: true })}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium">
          <Plus className="h-4 w-4" /> Novo template
        </button>
      </div>

      {loading ? <SkeletonList rows={4} /> : keys.length === 0 ? (
        <EmptyState icon={<Mail className="h-6 w-6" />} title="Sem templates"
          description="Cria templates para emails transacionais (welcome, password reset, etc)."
          cta={{ label: 'Criar template', onClick: () => setEditing({ template_key: '', lang: 'pt', subject: '', body_html: '', body_text: '', isNew: true }) }} />
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div key={key} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <h3 className="font-mono text-sm font-bold text-slate-800">{key}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {LANGS.map((lang) => {
                  const t = grouped[key].find((x) => x.lang === lang);
                  return (
                    <button key={lang}
                      onClick={() => setEditing(t ? {
                        template_key: t.template_key, lang: t.lang,
                        subject: t.subject || '', body_html: '', body_text: t.body_text || '',
                      } : {
                        template_key: key, lang, subject: '', body_html: '', body_text: '',
                      })}
                      className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                        t ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 border-dashed border-slate-300 hover:bg-slate-100'
                      }`}>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{lang}</div>
                      <div className="text-xs text-slate-700 truncate mt-0.5">{t ? t.subject || '(sem subject)' : '(criar)'}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Edit */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl max-w-3xl w-full p-5 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900">{editing.isNew ? 'Novo template' : 'Editar template'}</h3>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-[2fr_1fr] gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Template key</span>
                  <input value={editing.template_key} onChange={(e) => setEditing({ ...editing, template_key: e.target.value })}
                    disabled={!editing.isNew} placeholder="welcome_email"
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 disabled:bg-slate-50 font-mono" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Idioma</span>
                  <select value={editing.lang} onChange={(e) => setEditing({ ...editing, lang: e.target.value })}
                    disabled={!editing.isNew}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 disabled:bg-slate-50">
                    {LANGS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Subject</span>
                <input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} placeholder="Bem-vindo ao NeuroLearn"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Body HTML</span>
                <textarea value={editing.body_html} onChange={(e) => setEditing({ ...editing, body_html: e.target.value })} rows={10}
                  placeholder="<p>Olá {{name}}, ...</p>"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-400 font-mono" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Body text (fallback, opcional)</span>
                <textarea value={editing.body_text} onChange={(e) => setEditing({ ...editing, body_text: e.target.value })} rows={4}
                  placeholder="Versão texto plano..."
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-400 font-mono" />
              </label>
              <p className="text-[11px] text-slate-500">Variáveis disponíveis: <code className="bg-slate-100 px-1 rounded">{'{{name}}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{{email}}'}</code>, <code className="bg-slate-100 px-1 rounded">{'{{url}}'}</code></p>
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button onClick={save} disabled={saving}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5">
                <Save className="h-4 w-4" /> {saving ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
