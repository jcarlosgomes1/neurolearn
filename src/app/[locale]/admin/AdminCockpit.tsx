'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { callAgentOps } from '@/lib/api/client';
import { Stat } from '@/components/shared/Stat';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import { relTime } from '@/lib/utils/cn';
import { toast } from 'sonner';

const APPROVAL_GROUPS: { key: string; label: string; emoji: string; match: (a: string) => boolean }[] = [
  { key: 'courses', label: 'Cursos', emoji: '📚', match: (a) => a.includes('course') },
  { key: 'blog', label: 'Blog', emoji: '📝', match: (a) => a.includes('blog') },
  { key: 'social', label: 'Redes sociais', emoji: '📣', match: (a) => a.includes('social') },
  { key: 'other', label: 'Outros', emoji: '✋', match: () => true },
];

function groupApprovals(approvals: any[]) {
  const groups: Record<string, any[]> = { courses: [], blog: [], social: [], other: [] };
  for (const a of approvals) {
    const g = APPROVAL_GROUPS.find((g) => g.match(a.action || ''));
    groups[g?.key || 'other'].push(a);
  }
  return groups;
}

interface ShortcutProps { href: string; emoji: string; label: string; sub?: string; highlight?: boolean }
function Shortcut({ href, emoji, label, sub, highlight }: ShortcutProps) {
  return (
    <Link href={href as any} className={`group rounded-xl p-4 hover:shadow-md active:scale-[0.99] transition-all flex items-center gap-3 touch-manipulation ${highlight ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white' : 'bg-white border border-slate-200 hover:border-brand-300'}`}>
      <span className="text-2xl flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className={`font-semibold text-sm ${highlight ? 'text-white' : 'text-slate-900'}`}>{label}</div>
        {sub && <div className={`text-[11px] mt-0.5 truncate ${highlight ? 'text-white/80' : 'text-slate-500'}`}>{sub}</div>}
      </div>
      <span className={`text-base flex-shrink-0 ${highlight ? 'text-white/70 group-hover:text-white' : 'text-slate-300 group-hover:text-brand-500'}`}>→</span>
    </Link>
  );
}

export function AdminCockpit() {
  const [dash, setDash] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<string | null>(null);

  function load() {
    callAgentOps<{ dashboard: any }>('dashboard').then((r) => setDash(r.dashboard)).catch((e) => setErr(e.message));
  }
  useEffect(() => { load(); }, []);

  async function decide(approvalId: string, decision: 'approved' | 'rejected') {
    setDeciding(approvalId);
    try {
      await callAgentOps('decide_approval', { approval_id: approvalId, decision });
      toast.success(decision === 'approved' ? 'Aprovado' : 'Rejeitado');
      setDash((d: any) => ({ ...d, approvals_pending: (d.approvals_pending || []).filter((a: any) => a.id !== approvalId), pending_approvals: Math.max(0, (d.pending_approvals || 1) - 1) }));
    } catch (e: any) { toast.error(e.message); } finally { setDeciding(null); }
  }

  if (err) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🛠️</div>
        <p className="text-slate-700 font-medium">{err === 'admin_required' || err === 'unauthorized' ? 'Acesso restrito a administradores.' : err === 'not_authenticated' ? 'Inicia sessão primeiro.' : err}</p>
        <Link href={'/login' as any} className="btn-primary mt-6 inline-flex">Entrar</Link>
      </div>
    );
  }
  if (!dash) return <DashboardSkeleton stats={8} />;

  const approvals = dash.approvals_pending || [];
  const grouped = groupApprovals(approvals);
  const compliance = dash.compliance_issues || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Cockpit Administrador</h1>
        <p className="text-slate-500 text-sm mt-1">Visão geral da plataforma e dos agentes</p>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Pessoas & Catálogo</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat icon="🎓" label="Estudantes" value={dash.students} accent="brand" />
          <Stat icon="👨‍🏫" label="Instrutores" value={dash.instructors} accent="purple" href="/admin/instrutores" />
          <Stat icon="🛡" label="Admins" value={dash.admins} accent="slate" />
          <Stat icon="📚" label="Cursos publicados" value={dash.courses_published} accent="emerald" href="/admin/cursos" />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Atalhos rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <Shortcut href="/admin/curso-ia/novo" emoji="✨" label="Gerar curso com IA" sub="A partir de um tópico" highlight />
          <Shortcut href="/admin/preview" emoji="👀" label="Ver como aluno" sub="Preview do catálogo" />
          <Shortcut href="/admin/marketing" emoji="📢" label="Marketing" sub="Aprovar blog & social" />
          <Shortcut href="/admin/candidaturas" emoji="🎓" label="Candidaturas" sub="Revê novos instrutores" />
          <Shortcut href="/admin/instrutores-ai" emoji="🤖" label="AI Features" sub="Por instrutor" />
          <Shortcut href="/admin/tutor-config" emoji="🧠" label="Tutor AI" sub="Configurar tutor alunos" />
          <Shortcut href="/admin/eventos" emoji="📡" label="Eventos" sub="Stream em tempo real" />
          <Shortcut href="/admin/payments" emoji="💳" label="Payments" sub="Stripe (preparado)" />
          <Shortcut href="/admin/video" emoji="🎥" label="Vídeo" sub="Mux (preparado)" />
          <Shortcut href="/admin/jobs" emoji="⚙" label="Jobs" sub="Background workers" />
          <Shortcut href="/admin/agentes" emoji="🤝" label="Agentes" sub="API keys & quotas" />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Operacional</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat icon="🤖" label="Agentes activos" value={dash.active_agents} accent="brand" href="/admin/agentes" />
          <Stat icon="⚙" label="Jobs pendentes" value={dash.pending_jobs} accent="amber" href="/admin/jobs" />
          <Stat icon="✋" label="Aprovações" value={dash.pending_approvals} accent={dash.pending_approvals > 0 ? 'amber' : 'slate'} href="#aprovacoes" />
          <Stat icon="⚠" label="Compliance" value={dash.critical_compliance} accent={dash.critical_compliance > 0 ? 'rose' : 'slate'} />
        </div>
      </div>

      <section id="aprovacoes" className="scroll-mt-20">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Aprovações pendentes {approvals.length > 0 && <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full normal-case">{approvals.length}</span>}</h2>
        {approvals.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">Nada para aprovar. Tudo em dia! 🎉</div>
        ) : (
          <div className="space-y-4">
            {APPROVAL_GROUPS.filter((g) => grouped[g.key].length > 0).map((g) => (
              <div key={g.key} className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">{g.emoji} {g.label} <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{grouped[g.key].length}</span></h3>
                <ul className="space-y-3">
                  {grouped[g.key].map((a: any) => (
                    <li key={a.id} className="p-3 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-900 text-sm">{a.params?.course_title || a.params?.title || a.action}</div>
                        {a.reason && <div className="text-xs text-slate-500 line-clamp-2">{a.reason}</div>}
                        <div className="text-xs text-slate-400 mt-0.5">{relTime(a.created_at)}</div>
                      </div>
                      <div className="flex flex-wrap gap-2 flex-shrink-0">
                        <Link href={`/admin/aprovacao/${a.id}` as any} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-medium">👁 Ver</Link>
                        <button onClick={() => decide(a.id, 'approved')} disabled={deciding === a.id} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 disabled:opacity-50">✓ Aprovar</button>
                        <button onClick={() => decide(a.id, 'rejected')} disabled={deciding === a.id} className="text-xs bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-50 disabled:opacity-50">Rejeitar</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Conteúdo</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-600">Blog posts publicados</span><span className="font-semibold tabular-nums">{dash.published_blog_posts}</span></li>
            <li className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-600">Blog posts a aguardar</span><span className="font-semibold tabular-nums">{dash.pending_blog_posts}</span></li>
            <li className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-600">Tópicos em fila</span><span className="font-semibold tabular-nums">{dash.queued_blog_topics}</span></li>
            <li className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-600">Social posts a rever</span><span className="font-semibold tabular-nums">{dash.social_pending_review}</span></li>
            <li className="flex justify-between py-1.5"><span className="text-slate-600">Páginas legais activas</span><span className="font-semibold tabular-nums">{dash.legal_pages_active}</span></li>
          </ul>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Jobs (últimas 24h)</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><div className="text-2xl font-bold text-emerald-600 tabular-nums">{dash.completed_jobs_24h}</div><div className="text-xs text-slate-500">Concluídos</div></div>
            <div><div className="text-2xl font-bold text-amber-600 tabular-nums">{dash.running_jobs}</div><div className="text-xs text-slate-500">A correr</div></div>
            <div><div className="text-2xl font-bold text-rose-600 tabular-nums">{dash.failed_jobs_24h}</div><div className="text-xs text-slate-500">Falhados</div></div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">{dash.active_crons} crons agendados · {dash.audit_entries_24h} entradas de auditoria 24h</div>
        </section>
      </div>

      {compliance.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">⚠ Compliance</h2>
          <ul className="space-y-2">
            {compliance.slice(0, 5).map((i: any) => (
              <li key={i.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${i.severity === 'critical' ? 'bg-rose-500' : i.severity === 'high' ? 'bg-orange-500' : i.severity === 'warning' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 text-sm">{i.title}</div>
                  {i.recommendation && <div className="text-xs text-slate-500 mt-0.5">{i.recommendation}</div>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
