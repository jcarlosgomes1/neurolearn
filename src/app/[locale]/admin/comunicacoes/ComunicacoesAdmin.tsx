'use client';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Bell, Mail, Send, AlertTriangle, CheckCircle2, RefreshCw, Check, X, Loader2, MessageCircle, TrendingUp } from 'lucide-react';

type Hist = { d: string; read_rate: number | null; created: number; sent: number; failed: number };
type Proposal = { id: string; action: string; reason: string | null; status: string; created_at: string };

export function ComunicacoesAdmin({ locale }: { locale: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [msgs, setMsgs] = useState<Record<string, string>>({});
  const [a, setA] = useState<any>(null);
  const [hist, setHist] = useState<Hist[]>([]);
  const [props, setProps] = useState<Proposal[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const t = (k: string) => msgs[k] ?? k;

  async function load() {
    setLoading(true);
    try {
      const [anaRes, histRes, propRes, msgsRes] = await Promise.all([
        supabase.rpc('nl_admin_comms_analytics', { p_days: days }),
        supabase.rpc('nl_admin_comms_snapshot_history', { p_days: 14 }),
        supabase.rpc('nl_admin_agent_approvals_list', { p_status: 'pending', p_limit: 50 }),
        supabase.rpc('nl_i18n_messages_for_lang', { p_lang: locale }),
      ]);
      setA(anaRes.data || null);
      setHist(Array.isArray(histRes.data) ? (histRes.data as Hist[]) : []);
      const all = Array.isArray(propRes.data) ? propRes.data : [];
      setProps(all.filter((p: any) => (p.action || '').startsWith('comms_')));
      if (msgsRes.data && typeof msgsRes.data === 'object') setMsgs(msgsRes.data as Record<string, string>);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [days]);

  async function requeue() {
    setBusy('requeue');
    try {
      const { data } = await supabase.rpc('nl_admin_comms_requeue_failed');
      toast.success(t('comms.cockpit.requeued') + (typeof data === 'number' ? ' (' + data + ')' : ''));
      await load();
    } catch { toast.error('!'); } finally { setBusy(null); }
  }

  async function decide(id: string, approve: boolean) {
    setBusy(id);
    try {
      await supabase.rpc('nl_admin_agent_approval_decide', { p_id: id, p_approve: approve, p_note: null });
      setProps((p) => p.filter((x) => x.id !== id));
      toast.success('OK');
      await load();
    } catch { toast.error('!'); } finally { setBusy(null); }
  }

  const email = a?.email || {};
  const inapp = a?.inapp || {};
  const channels = a?.channels || {};
  const byKind: any[] = a?.by_kind || [];
  const maxHist = Math.max(1, ...hist.map((h) => Number(h.read_rate) || 0));

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminPageHeader
        title={t('comms.cockpit.title')}
        description={t('comms.cockpit.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {[7, 30, 90].map((d) => (
                <button key={d} onClick={() => setDays(d)}
                  className={'px-3 py-1.5 text-xs font-medium ' + (days === d ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}>
                  {d}d
                </button>
              ))}
            </div>
            {Number(email.failed) > 0 && (
              <button onClick={requeue} disabled={busy === 'requeue'}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-rose-700 disabled:opacity-60">
                {busy === 'requeue' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {t('comms.cockpit.requeue')}
              </button>
            )}
          </div>
        }
      />

      {loading ? (
        <div className="py-20 text-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium"><Bell className="h-4 w-4" /> {t('comms.cockpit.inapp')}</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{inapp.created ?? 0}</div>
              <div className="mt-1 text-xs text-slate-500">{t('comms.cockpit.read_rate')}: <span className="font-semibold text-emerald-600">{inapp.read_rate ?? 0}%</span></div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium"><Mail className="h-4 w-4" /> {t('comms.cockpit.email')}</div>
              <div className="mt-2">
                <span className={'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ' + (email.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                  {email.enabled ? <CheckCircle2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {email.enabled ? t('comms.cockpit.enabled') : t('comms.cockpit.disabled')}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>{t('comms.cockpit.sent')}: <b className="text-slate-800">{email.sent ?? 0}</b></span>
                <span>{t('comms.cockpit.queued')}: <b className="text-slate-800">{email.queued ?? 0}</b></span>
                <span className={Number(email.failed) > 0 ? 'text-rose-600' : ''}>{t('comms.cockpit.failed')}: <b>{email.failed ?? 0}</b></span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium"><Send className="h-4 w-4" /> {t('comms.cockpit.digests')}</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{email.digests ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">{t('comms.cockpit.channels')}</div>
              <div className="mt-2 flex flex-col gap-1.5">
                <span className={'inline-flex items-center gap-1.5 text-xs ' + (channels.email_enabled ? 'text-emerald-600' : 'text-slate-400')}><Mail className="h-3.5 w-3.5" /> Email</span>
                <span className={'inline-flex items-center gap-1.5 text-xs ' + (channels.whatsapp_configured ? 'text-emerald-600' : 'text-slate-400')}><MessageCircle className="h-3.5 w-3.5" /> {t('comms.cockpit.whatsapp')}</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-4"><TrendingUp className="h-4 w-4 text-violet-600" /> {t('comms.cockpit.trend')}</div>
              {hist.length === 0 ? <p className="text-xs text-slate-400">—</p> : (
                <div className="flex items-end gap-1 h-32">
                  {hist.map((h) => (
                    <div key={h.d} className="flex-1 flex flex-col items-center justify-end gap-1" title={h.d + ': ' + (h.read_rate ?? 0) + '%'}>
                      <div className="w-full rounded-t bg-gradient-to-t from-violet-500 to-indigo-400" style={{ height: ((Number(h.read_rate) || 0) / maxHist * 100) + '%' }} />
                      <span className="text-[9px] text-slate-400">{h.d.slice(8, 10)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-800 mb-4">{t('comms.cockpit.by_kind')}</div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {byKind.map((k) => (
                  <div key={k.kind} className="flex items-center gap-3">
                    <div className="w-40 truncate text-xs text-slate-600">{k.kind}</div>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: Math.min(100, Number(k.read_rate) || 0) + '%' }} />
                    </div>
                    <div className="w-16 text-right text-xs text-slate-500">{k.count} · {k.read_rate}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-4"><AlertTriangle className="h-4 w-4 text-amber-500" /> {t('comms.cockpit.proposals')}</div>
            {props.length === 0 ? (
              <p className="text-xs text-slate-400">{t('comms.cockpit.no_proposals')}</p>
            ) : (
              <ul className="space-y-2">
                {props.map((p) => (
                  <li key={p.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{p.action}</div>
                      <p className="text-sm text-slate-700">{p.reason}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => decide(p.id, true)} disabled={busy === p.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60">
                        {busy === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} {t('comms.cockpit.approve')}
                      </button>
                      <button onClick={() => decide(p.id, false)} disabled={busy === p.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 text-slate-600 px-2.5 py-1 text-xs font-semibold hover:bg-white disabled:opacity-60">
                        <X className="h-3 w-3" /> {t('comms.cockpit.reject')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
