'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { toast } from 'sonner';
import { Route, Loader2, Plus, Check, Clock, X } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

function safeT(t: any, k: string, fb: string): string {
  try { const v = t(k); if (v && typeof v === 'string' && v !== k) return v; } catch {}
  return fb;
}

export function PathRequestClient() {
  const t = useTranslations();
  const sb = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [rationale, setRationale] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try { const { data: d } = await sb.rpc('nl_instructor_path_request_data'); setData(d); } catch {}
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function toggle(id: string) { setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); }

  async function submit() {
    if (!title.trim()) { toast.error(safeT(t, 'path_req.err_title', 'Indica um título.')); return; }
    setBusy(true);
    try {
      const { data: r } = await sb.rpc('nl_instructor_request_path', { p_title: title, p_description: description || null, p_category: category || null, p_course_ids: picked, p_rationale: rationale || null });
      if ((r as any)?.ok) {
        toast.success(safeT(t, 'path_req.ok', 'Pedido enviado para revisão.'));
        setTitle(''); setCategory(''); setDescription(''); setRationale(''); setPicked([]);
        load();
      } else {
        const e = (r as any)?.error;
        toast.error(e === 'duplicate_path' ? safeT(t, 'path_req.err_duplicate', 'Já existe um percurso com esse título.')
          : e === 'title_required' ? safeT(t, 'path_req.err_title', 'Indica um título.')
          : safeT(t, 'path_req.err', 'Não foi possível enviar.'));
      }
    } catch { toast.error(safeT(t, 'path_req.err', 'Não foi possível enviar.')); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="flex justify-center py-20 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (!data?.ok) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Route className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <h2 className="font-semibold text-slate-900">{safeT(t, 'path_req.title', 'Propor percurso')}</h2>
        <p className="text-sm text-slate-500 mt-1">{safeT(t, 'path_req.not_instructor', 'Esta área é para instrutores. Candidata-te primeiro.')}</p>
        <Link href={'/conta/candidato' as any} className="inline-flex mt-4 text-sm font-medium text-brand-700 hover:underline">{safeT(t, 'account.item.application', 'Candidatura instrutor')}</Link>
      </div>
    );
  }

  const courses = data.courses || [];
  const requests = data.requests || [];
  const STBADGE: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-rose-100 text-rose-700' };
  const STICON: Record<string, any> = { pending: Clock, approved: Check, rejected: X };

  return (
    <div className="space-y-6">
      <AppPageHeader eyebrow={safeT(t, 'path_req.title', 'Propor percurso')} title={safeT(t, 'path_req.title', 'Propor percurso')} description={safeT(t, 'path_req.subtitle', 'Sugere um novo percurso com os teus cursos. A equipa revê antes de publicar.')} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">{safeT(t, 'path_req.f_title', 'Título do percurso')}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">{safeT(t, 'path_req.f_category', 'Categoria')}</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">{safeT(t, 'path_req.f_description', 'Descrição')}</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">{safeT(t, 'path_req.f_courses', 'Os teus cursos a incluir')}</label>
          {courses.length === 0 ? (
            <p className="text-xs text-slate-400">{safeT(t, 'path_req.no_courses', 'Ainda não tens cursos para incluir.')}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {courses.map((c: any) => { const on = picked.includes(c.id); return (
                <button key={c.id} type="button" onClick={() => toggle(c.id)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${on ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>{c.title}</button>
              ); })}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">{safeT(t, 'path_req.f_rationale', 'Porque faz sentido')}</label>
          <textarea value={rationale} onChange={(e) => setRationale(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
        </div>
        <div className="flex justify-end pt-1">
          <button onClick={submit} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{safeT(t, 'path_req.submit', 'Enviar pedido')}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-2">{safeT(t, 'path_req.my_requests', 'Os meus pedidos')}</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-slate-400">{safeT(t, 'path_req.none', 'Ainda não tens pedidos.')}</p>
        ) : (
          <div className="space-y-2.5">
            {requests.map((r: any) => { const Ic = STICON[r.status] || Clock; return (
              <div key={r.id} className="rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 text-[15px] leading-snug">{r.proposed_title}</div>
                    {r.proposed_category && <div className="text-[11px] text-slate-400 mt-0.5">{r.proposed_category}</div>}
                    {Array.isArray(r.courses) && r.courses.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">{r.courses.map((c: any) => <span key={c.id} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{c.title}</span>)}</div>
                    )}
                    {r.admin_note && <p className="mt-1.5 text-xs text-slate-500 italic">{r.admin_note}</p>}
                    {r.status === 'approved' && r.created_path_id && <p className="mt-1.5 text-xs text-emerald-700">{safeT(t, 'path_req.created_path', 'Percurso criado (em revisão)')}</p>}
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${STBADGE[r.status] || 'bg-slate-100 text-slate-600'}`}><Ic className="h-3 w-3" />{safeT(t, 'path_req.status.' + r.status, r.status)}</span>
                </div>
              </div>
            ); })}
          </div>
        )}
      </div>
    </div>
  );
}
