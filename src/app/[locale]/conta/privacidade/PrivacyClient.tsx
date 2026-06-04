'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import { Shield, Download, Trash2, AlertCircle, Loader2, ArrowLeft, ExternalLink, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { requestDataExportAction, requestAccountDeletionAction, cancelAccountDeletionAction } from '../actions';

interface GdprRequest {
  id: string; kind: string; status: string;
  export_url?: string | null; export_expires_at?: string | null;
  scheduled_deletion_at?: string | null;
  created_at: string;
}

const STATUS_BADGE: Record<string,string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  ready: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-slate-100 text-slate-500',
  failed: 'bg-rose-100 text-rose-700',
  expired: 'bg-slate-100 text-slate-500',
};

export function PrivacyClient({ initial, userEmail }: { initial: GdprRequest[]; userEmail: string }) {
  const [requests, setRequests] = useState<GdprRequest[]>(initial);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();
  
  const pendingDeletion = requests.find((r) => r.kind === 'delete_account' && r.status === 'pending');
  const pendingExport = requests.find((r) => r.kind === 'export_data' && (r.status === 'pending' || r.status === 'processing'));
  const readyExport = requests.find((r) => r.kind === 'export_data' && r.status === 'ready');
  
  function handleExport() {
    startTransition(async () => {
      const r = await requestDataExportAction();
      if (r.ok) {
        toast.success('Pedido de export criado. Vais receber notificação quando estiver pronto.');
        // refresh — simplificado, apenas adiciona localmente
        setRequests((prev) => [{ 
          id: (r.data as any).request_id, 
          kind: 'export_data', 
          status: 'pending', 
          created_at: new Date().toISOString() 
        } as GdprRequest, ...prev]);
      } else { toast.error(r.error || 'Falhou'); }
    });
  }
  
  function handleDeletion() {
    if (confirmText !== userEmail) { toast.error('Email não corresponde'); return; }
    startTransition(async () => {
      const r = await requestAccountDeletionAction(reason);
      if (r.ok) {
        toast.success('Conta agendada para eliminação. Tens 30 dias para cancelar.');
        setShowDeleteConfirm(false);
        const scheduled = (r.data as any).scheduled_deletion_at;
        setRequests((prev) => [{ 
          id: 'temp', kind: 'delete_account', status: 'pending', 
          scheduled_deletion_at: scheduled, created_at: new Date().toISOString() 
        } as GdprRequest, ...prev]);
      } else { 
        toast.error(r.error === 'owner_with_members' 
          ? 'És owner de uma empresa com membros. Transfere ownership primeiro.'
          : (r.error || 'Falhou')); 
      }
    });
  }
  
  function handleCancelDeletion() {
    if (!confirm('Cancelar pedido de eliminação?')) return;
    startTransition(async () => {
      const r = await cancelAccountDeletionAction();
      if (r.ok) {
        toast.success('Pedido cancelado');
        setRequests((prev) => prev.map((req) => 
          req.kind === 'delete_account' && req.status === 'pending' ? { ...req, status: 'cancelled' } : req
        ));
      } else { toast.error(r.error || 'Falhou'); }
    });
  }
  
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link href={`/conta` as any} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </Link>
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="h-6 w-6 text-brand-600" /> Privacidade e dados
        </h1>
        <p className="text-sm text-slate-500 mt-1">Os teus direitos GDPR/RGPD: aceder, exportar e eliminar.</p>
      </div>
      
      {pendingDeletion?.scheduled_deletion_at && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-rose-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-rose-900">Eliminação agendada</h3>
              <p className="text-sm text-rose-800 mt-1">
                A tua conta será eliminada em <strong>{new Date(pendingDeletion.scheduled_deletion_at).toLocaleDateString('pt-PT')}</strong>.
                Todos os dados pessoais serão removidos permanentemente.
              </p>
            </div>
          </div>
          <button onClick={handleCancelDeletion} disabled={isPending}
            className="w-full px-4 py-2 rounded-lg bg-white border border-rose-300 hover:bg-rose-100 text-rose-700 font-semibold text-sm disabled:opacity-50">
            Cancelar eliminação
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
          <Download className="h-4 w-4 text-brand-600" /> Exportar os meus dados
        </h2>
        <p className="text-sm text-slate-600 mb-3">
          Recebe um JSON com todos os teus dados pessoais: perfil, inscrições, certificados, progresso, quizzes, notificações.
        </p>
        {readyExport ? (
          <a href={readyExport.export_url || '#'} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">
            <Download className="h-4 w-4" /> Descarregar export
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : pendingExport ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 text-amber-800 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin" /> A preparar export…
          </div>
        ) : (
          <button onClick={handleExport} disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Pedir export
          </button>
        )}
      </div>
      
      {!pendingDeletion && (
        <div className="bg-white rounded-xl border border-rose-200 p-4 sm:p-5">
          <h2 className="font-semibold text-rose-900 flex items-center gap-2 mb-2">
            <Trash2 className="h-4 w-4 text-rose-600" /> Eliminar a minha conta
          </h2>
          <p className="text-sm text-slate-600 mb-3">
            Os teus dados serão eliminados em 30 dias. Podes cancelar dentro desse período.
            Certificados emitidos manterão o registo público de verificação (anonimizado) por requisito legal.
          </p>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-lg bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 text-sm font-semibold">
              Eliminar conta
            </button>
          ) : (
            <div className="space-y-3 mt-3 border-t border-slate-100 pt-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Motivo (opcional)</label>
                <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="Ajuda-nos a melhorar..."
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 resize-none" />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">
                  Confirma escrevendo <strong>{userEmail}</strong>:
                </label>
                <input type="email" value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} disabled={isPending}
                  className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm">Cancelar</button>
                <button onClick={handleDeletion} disabled={isPending || confirmText !== userEmail}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold disabled:opacity-50">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Confirmar eliminação
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Pedidos recentes</h3>
        {requests.length === 0 ? (
          <p className="text-sm text-slate-500">Sem pedidos.</p>
        ) : (
          <div className="space-y-2">
            {requests.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700">
                    {r.kind === 'export_data' ? 'Export de dados' : 'Eliminação de conta'}
                  </div>
                  <div className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString('pt-PT')}</div>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${STATUS_BADGE[r.status] || 'bg-slate-100 text-slate-600'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="text-xs text-slate-500 space-y-1">
        <p>📋 <Link href={`/termos` as any} className="text-brand-600 hover:underline">Termos de serviço</Link></p>
        <p>🔒 <Link href={`/privacidade` as any} className="text-brand-600 hover:underline">Política de privacidade</Link></p>
        <p>🍪 <Link href={`/cookies` as any} className="text-brand-600 hover:underline">Política de cookies</Link></p>
      </div>
    </div>
  );
}
