'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Shield, Download, Trash2, AlertCircle, CheckCircle, Loader2, Clock, RotateCcw } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800', processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800', failed: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-slate-100 text-slate-600',
};

export function PrivacidadeClient({ email, requests: initial }: { email: string; requests: any[] }) {
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
      const { data, error } = await sb.rpc('nl_gdpr_request_export');
      if (error || !(data as any)?.ok) {
        setError(error?.message || (data as any)?.error || 'Falha');
      } else {
        setSuccess('Pedido de exportação criado. Receberás email com link em até 24h.');
        reload();
      }
    });
  }

  function requestDeletion() {
    if (confirmText !== 'ELIMINAR') return setError('Escreve ELIMINAR para confirmar');
    setError(null); setSuccess(null);
    startTransition(async () => {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_gdpr_request_deletion', { p_reason: 'user_request' });
      if (error || !(data as any)?.ok) {
        setError(error?.message || (data as any)?.error || 'Falha');
      } else {
        setSuccess('Pedido de eliminação registado. A tua conta será apagada em 30 dias. Podes cancelar antes.');
        setConfirmDelete(false); setConfirmText('');
        reload();
      }
    });
  }

  function cancelDeletion(id: string) {
    startTransition(async () => {
      const sb = createClient();
      await sb.rpc('nl_gdpr_cancel_deletion', { p_request_id: id });
      reload();
    });
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Shield className="h-6 w-6 text-emerald-600" /> Privacidade & Dados</h1>
          <p className="text-sm text-slate-500 mt-1">Os teus direitos sob o RGPD. Conta: <strong>{email}</strong></p>
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
              <h2 className="font-semibold text-slate-900">Exportar os meus dados</h2>
              <p className="text-sm text-slate-600">Recebes um ficheiro JSON com todos os teus dados pessoais (perfil, inscrições, progresso, certificados, comentários).</p>
            </div>
          </div>
          <button onClick={requestExport} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Download className="h-4 w-4" /> Pedir exportação
          </button>
        </section>

        {/* Delete */}
        <section className="bg-white border border-rose-200 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center"><Trash2 className="h-5 w-5" /></div>
            <div>
              <h2 className="font-semibold text-slate-900">Eliminar a minha conta</h2>
              <p className="text-sm text-slate-600">Pedido de eliminação. Conta é apagada em 30 dias (podes cancelar antes). Inscrições, progresso e certificados são removidos. Compras passadas mantidas em arquivo legal por 10 anos.</p>
            </div>
          </div>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg">
              <Trash2 className="h-4 w-4" /> Pedir eliminação
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-700">Escreve <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">ELIMINAR</code> para confirmar:</p>
              <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-rose-200 rounded-lg font-mono uppercase" placeholder="ELIMINAR" />
              <div className="flex gap-2">
                <button onClick={requestDeletion} disabled={pending || confirmText !== 'ELIMINAR'}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar eliminação
                </button>
                <button onClick={() => { setConfirmDelete(false); setConfirmText(''); }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
              </div>
            </div>
          )}
        </section>

        {/* Pedidos anteriores */}
        {requests.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> Pedidos anteriores</h2>
            <ul className="divide-y divide-slate-100">
              {requests.map((r: any) => (
                <li key={r.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900">{r.kind === 'export' ? 'Exportação de dados' : 'Eliminação de conta'}</div>
                    <div className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString('pt-PT')}{r.scheduled_deletion_at && ` · agendado para ${new Date(r.scheduled_deletion_at).toLocaleDateString('pt-PT')}`}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[r.status] || 'bg-slate-100'}`}>{r.status}</span>
                  {r.kind === 'deletion' && ['pending', 'processing'].includes(r.status) && (
                    <button onClick={() => cancelDeletion(r.id)} className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" /> Cancelar
                    </button>
                  )}
                  {r.export_url && (
                    <a href={r.export_url} className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                      <Download className="h-3 w-3" /> Download
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
