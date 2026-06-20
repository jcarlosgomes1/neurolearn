'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';
import { fmtCents, fmtDate } from '@/lib/utils/cn';
import { ArrowLeft, Crown, ShieldCheck, GraduationCap, User as UserIcon, Mail, CheckCircle2, XCircle, Globe, Calendar, BookOpen, Award, Wallet, Star, Loader2, ArrowUpRight, Receipt } from 'lucide-react';

const ROLE_META: Record<string, { label: string; icon: any; cls: string }> = {
  super_admin: { label: 'Super admin', icon: Crown, cls: 'bg-amber-100 text-amber-700' },
  admin: { label: 'Admin', icon: ShieldCheck, cls: 'bg-violet-100 text-violet-700' },
  instructor: { label: 'Instrutor', icon: GraduationCap, cls: 'bg-emerald-100 text-emerald-700' },
  student: { label: 'Aluno', icon: UserIcon, cls: 'bg-blue-100 text-blue-700' },
};

interface Detail { ok: boolean; error?: string; profile: any; stats: any; enrollments: any[]; certificates: any[]; transactions: any[]; instructor: any; }

export function UserDetailClient({ userId }: { userId: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data: d, error } = await sb.rpc('nl_admin_user_detail', { p_user_id: userId });
        if (error) throw error;
        if (!d || (d as any).ok === false) setErr((d as any)?.error || 'not_found');
        else setData(d as any);
      } catch (e: any) { setErr(e?.message || 'Erro'); }
      finally { setLoading(false); }
    })();
  }, [userId]);

  if (loading) return <div className="p-12 text-center"><Loader2 className="h-6 w-6 text-violet-600 mx-auto animate-spin" /></div>;
  if (err || !data) return (
    <div className="max-w-3xl mx-auto p-2">
      <Link href={'/admin/users' as any} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"><ArrowLeft className="h-4 w-4" /> Utilizadores</Link>
      <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-6 text-sm">Utilizador nao encontrado{err ? ` (${err})` : ''}.</div>
    </div>
  );

  const p = data.profile; const s = data.stats || {}; const ins = data.instructor;
  const roleMeta = ROLE_META[p.role] || ROLE_META.student;
  const RoleIcon = roleMeta.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-16">
      <Link href={'/admin/users' as any} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Utilizadores
      </Link>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {p.avatar_url ? (
            <img src={p.avatar_url} alt="" className="h-16 w-16 rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-600 text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
              {(p.name || p.email || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 truncate">{p.name || 'Sem nome'}</h1>
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${roleMeta.cls}`}><RoleIcon className="h-3 w-3" /> {roleMeta.label}</span>
              {p.is_active
                ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase">Activo</span>
                : <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold uppercase">Inactivo</span>}
            </div>
            <div className="mt-1.5 text-sm text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
              {p.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {p.email} {p.email_confirmed ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-amber-600" />}</span>}
              {p.handle && <span>@{p.handle}</span>}
              {p.country_code && <span className="inline-flex items-center gap-1 uppercase"><Globe className="h-3.5 w-3.5" /> {p.country_code}</span>}
              {p.preferred_lang && <span className="uppercase">{p.preferred_lang}</span>}
            </div>
            <div className="mt-1 text-xs text-slate-400 flex flex-wrap gap-x-3">
              {p.joined_at && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> Entrou {fmtDate(p.joined_at)}</span>}
              {p.last_login && <span>Ultimo login {fmtDate(p.last_login)}</span>}
              {p.subscription_status && <span className="uppercase">{p.subscription_status}{p.subscription_plan ? ` · ${p.subscription_plan}` : ''}</span>}
            </div>
          </div>
          {ins && (
            <Link href={`/admin/instrutor/${userId}` as any} className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg flex-shrink-0">
              <GraduationCap className="h-4 w-4" /> Painel instrutor <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Stat icon={BookOpen} label="Inscricoes" value={s.enrolled_count ?? 0} cls="from-blue-500 to-cyan-600" />
        <Stat icon={CheckCircle2} label="Concluidos" value={s.completed_count ?? 0} cls="from-emerald-500 to-teal-600" />
        <Stat icon={Award} label="Certificados" value={s.certificates_count ?? 0} cls="from-amber-500 to-orange-600" />
        <Stat icon={Receipt} label="Compras" value={s.purchases_count ?? 0} cls="from-violet-500 to-indigo-600" />
        <Stat icon={Wallet} label="Gasto" value={fmtCents(s.total_spent_cents ?? 0)} cls="from-fuchsia-500 to-pink-600" isText />
      </div>

      {ins && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider inline-flex items-center gap-2"><GraduationCap className="h-4 w-4 text-emerald-600" /> Instrutor</h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{ins.status}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <MiniStat label="Ganhos" value={fmtCents(ins.total_revenue_cents)} />
            <MiniStat label="Pago" value={fmtCents(ins.total_payouts_cents)} />
            <MiniStat label="A pagar" value={fmtCents(ins.available_cents)} accent />
            <MiniStat label="Partilha" value={ins.revenue_share_pct != null ? `${ins.revenue_share_pct}%` : '—'} />
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
            <span className="inline-flex items-center gap-1"><UserIcon className="h-3.5 w-3.5" /> {ins.total_students ?? 0} alunos</span>
            {ins.rating_count > 0 && <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" /> {Number(ins.rating_avg).toFixed(1)} ({ins.rating_count})</span>}
          </div>
          {ins.courses?.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cursos ({ins.courses.length})</div>
              {ins.courses.map((c: any) => (
                <Link key={c.id} href={`/admin/curso/${c.id}/editar` as any} className="group flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <span className="text-sm text-slate-800 truncate group-hover:text-violet-700">{c.title}</span>
                  <span className="flex items-center gap-2 flex-shrink-0 text-xs text-slate-500">
                    {!c.published && <span className="text-[9px] uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">Rascunho</span>}
                    <span>{c.enrollments_count ?? 0} alunos</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-violet-500" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider inline-flex items-center gap-2 mb-4"><BookOpen className="h-4 w-4 text-blue-600" /> Inscricoes ({data.enrollments.length})</h2>
        {data.enrollments.length === 0 ? (
          <p className="text-sm text-slate-400">Sem inscricoes.</p>
        ) : (
          <div className="space-y-2">
            {data.enrollments.map((e: any) => (
              <Link key={e.course_id} href={`/admin/curso/${e.course_id}/editar` as any} className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                <span className="text-lg flex-shrink-0">{e.emoji || '📘'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate group-hover:text-violet-700">{e.title || e.course_id}</div>
                  <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full" style={{ width: `${Math.min(100, e.progress_pct || 0)}%` }} />
                  </div>
                </div>
                <div className="flex-shrink-0 text-xs text-slate-500 w-12 text-right">{e.completed_at ? <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" /> : `${e.progress_pct || 0}%`}</div>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-violet-500 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider inline-flex items-center gap-2 mb-4"><Award className="h-4 w-4 text-amber-600" /> Certificados ({data.certificates.length})</h2>
          {data.certificates.length === 0 ? <p className="text-sm text-slate-400">Sem certificados.</p> : (
            <div className="space-y-2">
              {data.certificates.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50">
                  <span className="text-sm text-slate-800 truncate">{c.course_title}</span>
                  <span className="text-[11px] text-slate-400 flex-shrink-0">{c.certificate_number}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider inline-flex items-center gap-2 mb-4"><Receipt className="h-4 w-4 text-violet-600" /> Transacoes recentes</h2>
          {data.transactions.length === 0 ? <p className="text-sm text-slate-400">Sem transacoes.</p> : (
            <div className="space-y-2">
              {data.transactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 text-sm">
                  <span className="text-slate-500 text-xs">{fmtDate(t.created_at)}</span>
                  <span className="flex items-center gap-2">
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${t.status === 'succeeded' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{t.status}</span>
                    <span className="font-semibold text-slate-800">{fmtCents(t.amount_cents)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, cls, isText }: { icon: any; label: string; value: any; cls: string; isText?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <div className={`inline-flex h-8 w-8 rounded-lg bg-gradient-to-br ${cls} text-white items-center justify-center mb-2 shadow-sm`}><Icon className="h-4 w-4" /></div>
      <div className={`font-bold text-slate-900 ${isText ? 'text-base' : 'text-xl'}`}>{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg p-3 border ${accent ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
      <div className={`text-sm font-bold ${accent ? 'text-emerald-700' : 'text-slate-900'}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}
