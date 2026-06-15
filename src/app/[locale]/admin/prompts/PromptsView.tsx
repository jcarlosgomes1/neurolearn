'use client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface PromptSummary {
  id: string; model: string; max_tokens: number; category: string | null;
  description: string | null; version: number; updated_at: string;
  content_preview: string; content_length: number;
}
interface PromptFull extends PromptSummary { content: string }
interface HistoryEntry { id: number; version: number; model: string | null; max_tokens: number | null; description: string | null; change_note: string | null; changed_at: string; content: string }

const CATEGORY_META: Record<string, { emoji: string; labelKey: string }> = {
  blog: { emoji: '📝', labelKey: 'prompts_admin.cat_blog' },
  social: { emoji: '📣', labelKey: 'prompts_admin.cat_social' },
  scout: { emoji: '🔭', labelKey: 'prompts_admin.cat_scout' },
  editorial: { emoji: '✏️', labelKey: 'prompts_admin.cat_editorial' },
  translation: { emoji: '🌐', labelKey: 'prompts_admin.cat_translation' },
  uncategorized: { emoji: '📄', labelKey: 'prompts_admin.cat_other' },
};

const MODEL_OPTIONS = [
  { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 (rápido, barato)' },
  { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6 (equilibrado)' },
  { value: 'claude-opus-4-8', label: 'Opus 4.8 (máxima qualidade)' },
];

async function callApi<T>(action: string, payload: Record<string, unknown> = {}): Promise<T | null> {
  const sb = createClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { toast.error('Sessão inválida'); return null; }
  const res = await fetch(`${SUPABASE_URL}/functions/v1/prompts-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

export function PromptsView() {
  const t = useTranslations();
  const [groups, setGroups] = useState<Record<string, PromptSummary[]>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PromptFull | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await callApi<{ ok: boolean; groups: Record<string, PromptSummary[]> }>('list');
    if (res?.ok) setGroups(res.groups);
    else toast.error(t('prompts_admin.toast_load_fail'));
    setLoading(false);
  }, [t]);

  useEffect(() => { load(); }, [load]);

  async function openEdit(id: string) {
    const res = await callApi<{ ok: boolean; prompt: PromptFull }>('get', { id });
    if (res?.ok) setEditing(res.prompt);
    else toast.error(t('prompts_admin.toast_load_fail'));
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        backHref="/admin"
        emoji="📝"
        title={t('prompts_admin.title')}
        description={t('prompts_admin.subtitle')}
        actions={<button onClick={load} className="text-sm bg-white border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-lg">{t('prompts_admin.reload')}</button>}
      />

      {loading ? (
        <div className="mt-8 text-center text-slate-400 py-10">{t('prompts_admin.loading')}</div>
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(groups).map(([cat, prompts]) => {
            const meta = CATEGORY_META[cat] || CATEGORY_META.uncategorized;
            return (
              <section key={cat}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                  <span className="text-base">{meta.emoji}</span>
                  {t(meta.labelKey)}
                  <span className="text-xs font-normal text-slate-400">({prompts.length})</span>
                </h2>
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {prompts.map(p => (
                    <button key={p.id} onClick={() => openEdit(p.id)}
                      className="w-full p-4 hover:bg-slate-50 flex items-start gap-3 text-left">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-sm font-mono font-semibold text-slate-900">{p.id}</code>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">v{p.version}</span>
                        </div>
                        {p.description && <p className="text-xs text-slate-600 mt-1">{p.description}</p>}
                        <div className="text-[10px] text-slate-400 mt-1 font-mono flex flex-wrap gap-x-3">
                          <span>{p.model}</span>
                          <span>max_tokens: {p.max_tokens}</span>
                          <span>{p.content_length} chars</span>
                        </div>
                      </div>
                      <span className="text-xs text-brand-600 flex-shrink-0">{t('prompts_admin.btn_open')} →</span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {editing && <PromptModal prompt={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

interface ModalProps { prompt: PromptFull; onClose: () => void; onSaved: () => void }

function PromptModal({ prompt, onClose, onSaved }: ModalProps) {
  const t = useTranslations();
  const [draft, setDraft] = useState({
    content: prompt.content,
    model: prompt.model,
    max_tokens: prompt.max_tokens,
    description: prompt.description || '',
    category: prompt.category || '',
    change_note: '',
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'edit' | 'test' | 'history'>('edit');
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{ output: string; duration_ms: number; input_tokens: number; output_tokens: number; model: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function save() {
    setSaving(true);
    const res = await callApi<{ ok: boolean; error?: string }>('save', {
      id: prompt.id,
      content: draft.content,
      model: draft.model,
      max_tokens: draft.max_tokens,
      description: draft.description,
      category: draft.category || null,
      change_note: draft.change_note || null,
    });
    if (res?.ok) { toast.success(t('prompts_admin.toast_saved')); onSaved(); }
    else toast.error(res?.error || t('prompts_admin.toast_save_fail'));
    setSaving(false);
  }

  async function test() {
    if (!testInput.trim()) { toast.error(t('prompts_admin.toast_input_required')); return; }
    setTesting(true);
    setTestResult(null);
    const res = await callApi<{ ok: boolean; error?: string; output: string; duration_ms: number; input_tokens: number; output_tokens: number; model: string }>('test', {
      id: prompt.id,
      user_input: testInput,
    });
    if (res?.ok) setTestResult(res);
    else toast.error(res?.error || t('prompts_admin.toast_test_fail'));
    setTesting(false);
  }

  async function loadHistory() {
    setLoadingHistory(true);
    const res = await callApi<{ ok: boolean; history: HistoryEntry[] }>('history', { id: prompt.id, limit: 20 });
    if (res?.ok) setHistory(res.history);
    setLoadingHistory(false);
  }

  async function restore(version: number) {
    if (!confirm(t('prompts_admin.confirm_restore', { v: version }))) return;
    const res = await callApi<{ ok: boolean }>('restore', { id: prompt.id, version });
    if (res?.ok) { toast.success(t('prompts_admin.toast_restored')); onSaved(); }
  }

  useEffect(() => { if (tab === 'history' && history.length === 0) loadHistory(); }, [tab]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-4xl sm:rounded-2xl shadow-2xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate font-mono text-sm">{prompt.id}</div>
            <div className="text-xs text-slate-500">v{prompt.version} · {prompt.category || t('prompts_admin.cat_other')}</div>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex bg-slate-100 rounded-md p-0.5 text-[11px] font-medium">
              <button onClick={() => setTab('edit')} className={`px-2 py-1 rounded ${tab === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('prompts_admin.tab_edit')}</button>
              <button onClick={() => setTab('test')} className={`px-2 py-1 rounded ${tab === 'test' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('prompts_admin.tab_test')}</button>
              <button onClick={() => setTab('history')} className={`px-2 py-1 rounded ${tab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('prompts_admin.tab_history')}</button>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 ml-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'edit' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('prompts_admin.field_description')}</label>
                <input type="text" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('prompts_admin.field_model')}</label>
                  <select value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                    className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none">
                    {MODEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">max_tokens</label>
                  <input type="number" value={draft.max_tokens} onChange={(e) => setDraft({ ...draft, max_tokens: parseInt(e.target.value) || 1024 })}
                    className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>{t('prompts_admin.field_content')}</span>
                  <span className="text-slate-400 font-normal">{draft.content.length} chars</span>
                </label>
                <textarea value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} rows={20}
                  className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none" spellCheck={false} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('prompts_admin.field_change_note')}</label>
                <input type="text" value={draft.change_note} onChange={(e) => setDraft({ ...draft, change_note: e.target.value })}
                  placeholder={t('prompts_admin.change_note_placeholder')}
                  className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none" />
              </div>
            </>
          )}

          {tab === 'test' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
                {t('prompts_admin.test_hint')}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('prompts_admin.field_user_input')}</label>
                <textarea value={testInput} onChange={(e) => setTestInput(e.target.value)} rows={6}
                  placeholder={t('prompts_admin.input_placeholder')}
                  className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none" />
              </div>
              <button onClick={test} disabled={testing || !testInput.trim()}
                className="text-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg">
                {testing ? t('prompts_admin.testing') : t('prompts_admin.btn_run_test')}
              </button>
              {testResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
                  <div className="text-xs flex flex-wrap gap-x-4 text-slate-600">
                    <span>⏱ {testResult.duration_ms}ms</span>
                    <span>📥 {testResult.input_tokens} in</span>
                    <span>📤 {testResult.output_tokens} out</span>
                    <span className="font-mono">{testResult.model}</span>
                  </div>
                  <pre className="text-xs bg-white p-3 rounded border border-slate-200 whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">{testResult.output}</pre>
                </div>
              )}
            </>
          )}

          {tab === 'history' && (
            <>
              {loadingHistory ? (
                <div className="text-center py-8 text-slate-400 text-sm">{t('prompts_admin.loading')}</div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">{t('prompts_admin.no_history')}</div>
              ) : (
                <div className="space-y-2">
                  {history.map(h => (
                    <details key={h.id} className="bg-slate-50 rounded-lg border border-slate-200">
                      <summary className="cursor-pointer p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">v{h.version}</span>
                          <span className="text-xs text-slate-500">{new Date(h.changed_at).toLocaleString('pt-PT')}</span>
                          {h.change_note && <span className="text-xs text-slate-700 italic">"{h.change_note}"</span>}
                        </div>
                        <button onClick={(e) => { e.preventDefault(); restore(h.version); }}
                          className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium px-2 py-1 rounded">
                          ↺ {t('prompts_admin.btn_restore')}
                        </button>
                      </summary>
                      <pre className="px-3 pb-3 text-[11px] text-slate-700 whitespace-pre-wrap font-mono">{h.content}</pre>
                    </details>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {tab === 'edit' && (
          <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
            <button onClick={onClose} disabled={saving} className="text-sm font-medium px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700">{t('prompts_admin.cancel')}</button>
            <button onClick={save} disabled={saving} className="text-sm font-medium px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50">
              {saving ? t('prompts_admin.saving') : t('prompts_admin.save')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
