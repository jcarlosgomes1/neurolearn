'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Item { course_id: string; title: string; status: string; instructor_name: string | null; requested_at: string | null; decided_at: string | null; note: string | null; }

const BADGE: Record<string, { label: string; cls: string }> = {
  off: { label: 'Inativo', cls: 'bg-slate-100 text-slate-500' },
  requested: { label: 'Pendente', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Ativo', cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejeitado', cls: 'bg-rose-100 text-rose-700' },
};

export function PeerReviewAdmin() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_course_peer_requests');
      if (error) throw error;
      const r = data as { ok?: boolean; items?: Item[] };
      if (!r?.ok) throw new Error('forbidden');
      setItems(r.items || []);
    } catch { setItems([]); toast.error('Sem acesso ou falha ao carregar.'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function decide(id: string, approve: boolean) {
    setBusy(id);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_admin_course_peer_decide', { p_course_id: id, p_approve: approve, p_note: null });
      if (error || !(data as { ok?: boolean })?.ok) throw new Error();
      setItems((xs) => (xs || []).map((x) => x.course_id === id ? { ...x, status: approve ? 'approved' : 'rejected' } : x));
      toast.success(approve ? 'Avaliação por pares ativada' : 'Pedido rejeitado');
    } catch { toast.error('Não foi possível atualizar.'); }
    setBusy(null);
  }

  const pending = (items || []).filter((i) => i.status === 'requested').length;

  return (
    <div>
      <AdminPageHeader eyebrow="Cursos · Qualidade" title="Avaliação por pares" description="Aprova os pedidos dos instrutores para ativar avaliação por pares nos seus cursos. Só cursos ativos atribuem revisões entre alunos." />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        {pending > 0 && <p className="text-sm text-amber-700 font-medium mb-3">{pending} pedido(s) pendente(s)</p>}
        {items === null ? (
          <div className="p-6 text-sm text-slate-400">A carregar…</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-slate-400">Sem cursos.</div>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => {
              const b = BADGE[it.status] || BADGE.off;
              return (
                <li key={it.course_id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm truncate">{it.title}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${b.cls}`}>{b.label}</span>
                    </div>
                    {it.instructor_name && <p className="text-xs text-slate-400 mt-0.5">{it.instructor_name}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {it.status !== 'approved' && (
                      <button disabled={busy === it.course_id} onClick={() => decide(it.course_id, true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">
                        {busy === it.course_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Ativar
                      </button>
                    )}
                    {it.status !== 'rejected' && it.status !== 'off' && (
                      <button disabled={busy === it.course_id} onClick={() => decide(it.course_id, false)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 disabled:opacity-50">
                        <X className="h-3.5 w-3.5" /> {it.status === 'approved' ? 'Desativar' : 'Rejeitar'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
