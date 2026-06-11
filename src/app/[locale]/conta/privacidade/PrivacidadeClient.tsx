'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { assertNotPeekClient } from '@/lib/peek-client';
import { useTranslations } from 'next-intl';
import { Shield, Download, Trash2, AlertCircle, CheckCircle, Loader2, Clock, RotateCcw } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800', processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800', failed: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-slate-100 text-slate-600',
};

export function PrivacidadeClient({ email, requests: initial }: { email: string; requests: any[] }) {
  const t = useTranslations();
  const deleteKeyword = t('privacy.delete_keyword');
  const [requests, setRequests] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function reload() {
    const sb = createClient();
    const { data } = await sb.rpc('nl_gdpr_my_requests');
    setRequests((data as any)?.requests || []);
  }

  function requestExport() {
    setError(null); setSuccess(null);
    startTransition(async () => {
      const sb = createClient();
      assertNotPeekClient();
      const { data, error } = await sb.rpc('nl_gdpr_request_export');
      if (error || !(data as any)?.ok) {
        setError(error?.message || (data as any)?.error || t('privacy.failed'));
      } else {
        setSuccess(t('privacy.export_success'));
        reload();
      }
    });
  }

  function requestDeletion() {
    if (confirmText !== deleteKeyword) return setError(t('privacy.type_to_confirm', { kw: deleteKeyword }));
    setError(null); setSuccess(null);
    startTransition(async () => {
      const sb = createClient();
      assertNotPeekClient();
      const { data, error } = await sb.rpc('nl_gdpr_request_deletion', { p_reason: 'user_request' });
      if (error || !(data as any)?.ok) {
        setError(error?.message || (data as any)?.error || t('privacy.failed'));
      } else {
        setSuccess(t('privacy.deletion_success'));
        setConfirmDelete(false); setConfirmText('');
        reload();
      }
    });
  }

  function cancelDeletion(id: string) {
    startTransition(async () => {
      const sb = createClient();
      assertNotPeekClient();
      await sb.rpc('nl_gdpr_cancel_deletion', { p_request_id: id });
      reload();
    });
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Shield className="h-6 w-6 text-emerald-600" /> {t('privacy.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('privacy.subtitle_pre')}<strong>{email}</strong></p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>}
        {success && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> {success}</div>}

        {/* Export */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><Download className="h-5 w-5" /></div>
            <div>
              <h2 className="font-semibold text-slate-900">{t('privacy.export_title')}</h2>
              <p className="text-sm text-slate-600">{t('privacy.export_desc')}</p>
            </div>
          </div>
          <button onClick={requestExport} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Download className="h-4 w-4" /> {t('privacy.export_btn')}
          </button>
        </section>

        {/* Delete */}
        <section className="bg-white border border-rose-200 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center"><Trash2 className="h-5 w-5" /></div>
            <div>
              <h2 className="font-semibold text-slate-900">{t('privacy.delete_title')}</h2>
              <p className="text-sm text-slate-600">{t('privacy.delete_desc')}</p>
            </div>
          </div>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg">
              <Trash2 className="h-4 w-4" /> {t('privacy.delete_btn')}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-700">{t('privacy.confirm_prompt_pre')}<code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{deleteKeyword}</code>{t('privacy.confirm_prompt_post')}</p>
              <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-rose-200 rounded-lg font-mono uppercase" placeholder={deleteKeyword} />
              <div className="flex gap-2">
                <button onClick={requestDeletion} disabled={pending || confirmText !== deleteKeyword}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />} {t('privacy.confirm_delete_btn')}
                </button>
                <button onClick={() => { setConfirmDelete(false); setConfirmText(''); }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">{t('btn.cancel')}</button>
              </div>
            </div>
          )}
        </section>

        {/* Pedidos anteriores */}
        {requests.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> {t('privacy.history_title')}</h2>
            <ul className="divide-y divide-slate-100">
              {requests.map((r: any) => (
                <li key={r.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900">{r.kind === 'export' ? t('privacy.kind_export') : t('privacy.kind_deletion')}</div>
                    <div className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}{r.scheduled_deletion_at ? ` · ${t('privacy.scheduled_for', { date: new Date(r.scheduled_deletion_at).toLocaleDateString() })}` : ''}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[r.status] || 'bg-slate-100'}`}>{r.status}</span>
                  {r.kind === 'deletion' && ['pending', 'processing'].includes(r.status) && (
                    <button onClick={() => cancelDeletion(r.id)} className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" /> {t('btn.cancel')}
                    </button>
                  )}
                  {r.export_url && (
                    <a href={r.export_url} className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                      <Download className="h-3 w-3" /> {t('privacy.download')}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
