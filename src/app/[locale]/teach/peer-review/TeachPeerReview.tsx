'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UsersRound, Loader2, Clock, Check } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { toast } from 'sonner';

interface Item { course_id: string; title: string; status: string; note: string | null; }

export function TeachPeerReview() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_teach_peer_courses');
      if (error) throw error;
      const r = data as { ok?: boolean; items?: Item[] };
      if (!r?.ok) throw new Error();
      setItems(r.items || []);
    } catch { setItems([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function request(id: string) {
    setBusy(id);
    try {
      const sb = createClient();
      const { data, error } = await sb.rpc('nl_course_peer_request', { p_course_id: id });
      if (error || !(data as { ok?: boolean })?.ok) throw new Error();
      const st = (data as { status?: string }).status || 'requested';
      setItems((xs) => (xs || []).map((x) => x.course_id === id ? { ...x, status: st } : x));
      toast.success(st === 'approved' ? 'Avaliação por pares ativada' : 'Pedido enviado para aprovação');
    } catch { toast.error('Não foi possível enviar o pedido.'); }
    setBusy(null);
  }

  return (
    <div className="py-8">
      <AppPageHeader title="Avaliação por pares" description="Pede para ativar avaliação por pares nos teus cursos. Depois de aprovado, os exercícios abertos passam a ser revistos entre alunos." />

      {items === null ? (
        <div className="text-sm text-slate-400">A carregar…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-400">Ainda não tens cursos.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.course_id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3">
              <span className="font-semibold text-slate-900 text-sm truncate">{it.title}</span>
              <div className="flex-shrink-0">
                {it.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><Check className="h-4 w-4" /> Ativo</span>
                ) : it.status === 'requested' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600"><Clock className="h-4 w-4" /> Pendente de aprovação</span>
                ) : (
                  <button disabled={busy === it.course_id} onClick={() => request(it.course_id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50">
                    {busy === it.course_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UsersRound className="h-3.5 w-3.5" />} Pedir ativação
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
