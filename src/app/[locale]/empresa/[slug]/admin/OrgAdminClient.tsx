'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import { 
  Settings, Palette, FileText, Sparkles, Users, BookOpen, 
  TrendingUp, AlertCircle, Loader2, Save, ArrowLeft, Euro
} from 'lucide-react';
import { updateBrandingAction } from './actions';

interface Data {
  org: { id: string; name: string; slug: string; plan: string; seats_used: number; seats_purchased: number; trial_ends_at?: string };
  role: string;
  usage: {
    subscription: { plan_id: string; status: string; billing_cycle: string; current_period_end: string; trial_ends_at?: string } | null;
    quotas: Record<string, number | null>;
    features: Record<string, boolean>;
    period: { start: string; end: string; counters: Record<string, number>; overage_cents: number };
  } | null;
  counts: { courses: number; contents: number; proposals: number };
  branding: {
    logo_url?: string; primary_color?: string; accent_color?: string; background_color?: string;
    text_color?: string; font_family?: string; welcome_message?: string; footer_message?: string;
  } | null;
}

const QUOTA_LABELS: Record<string, string> = {
  ai_courses_per_month: 'Cursos IA/mês',
  ai_proposals_per_month: 'Propostas IA/mês',
  ingest_mb_per_month: 'Ingest MB/mês',
  storage_gb: 'Storage (GB)',
  max_courses: 'Cursos máx',
  translations_per_month: 'Traduções/mês',
};

export function OrgAdminClient({ slug, initial }: { slug: string; initial: Data }) {
  const [tab, setTab] = useState<'overview'|'usage'|'branding'>('overview');
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Link href={`/empresa/${slug}` as any} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao dashboard
      </Link>
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-brand-600" /> Administração · {initial.org.name}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Gere a tua área, vê consumo e personaliza branding.</p>
      </div>
      
      <div className="flex bg-slate-100 rounded-lg p-1 text-sm font-medium overflow-x-auto">
        <button onClick={() => setTab('overview')}
          className={`flex-1 px-3 py-2 rounded ${tab === 'overview' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Overview</button>
        <button onClick={() => setTab('usage')}
          className={`flex-1 px-3 py-2 rounded ${tab === 'usage' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Consumo</button>
        <button onClick={() => setTab('branding')}
          className={`flex-1 px-3 py-2 rounded ${tab === 'branding' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Branding</button>
      </div>
      
      {tab === 'overview' && <OverviewTab data={initial} slug={slug} />}
      {tab === 'usage' && <UsageTab data={initial} />}
      {tab === 'branding' && <BrandingTab data={initial} slug={slug} />}
    </div>
  );
}

function OverviewTab({ data, slug }: { data: Data; slug: string }) {
  const noSub = !data.usage?.subscription;
  return (
    <div className="space-y-4">
      {noSub && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 text-sm">Sem subscrição activa</h3>
              <p className="text-xs text-amber-800 mt-1">
                A tua empresa não tem plano associado. Algumas funcionalidades estão bloqueadas.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Users className="h-4 w-4" />} label="Membros" value={data.org.seats_used} />
        <StatCard icon={<BookOpen className="h-4 w-4" />} label="Cursos" value={data.counts.courses} />
        <StatCard icon={<FileText className="h-4 w-4" />} label="Conteúdos" value={data.counts.contents} />
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="Propostas IA" value={data.counts.proposals} />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href={`/empresa/${slug}/conteudos` as any}
          className="bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition p-4">
          <div className="flex items-center gap-2 mb-1"><FileText className="h-5 w-5 text-brand-600" /><h3 className="font-semibold text-slate-900">Conteúdos</h3></div>
          <p className="text-sm text-slate-500">Sobe PDFs e manuais para a IA gerar cursos.</p>
        </Link>
        <Link href={`/empresa/${slug}/cursos/propostas` as any}
          className="bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition p-4">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="h-5 w-5 text-amber-600" /><h3 className="font-semibold text-slate-900">Propostas de curso</h3></div>
          <p className="text-sm text-slate-500">Revê e aprova cursos propostos pela IA.</p>
        </Link>
      </div>
      
      {data.usage?.subscription && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900 text-sm">Plano actual</h3>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
              data.usage.subscription.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
              data.usage.subscription.status === 'trial' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>{data.usage.subscription.status}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{data.usage.subscription.plan_id}</div>
          <div className="text-xs text-slate-500 mt-1">
            Ciclo: {data.usage.subscription.billing_cycle}
            {data.usage.subscription.current_period_end && ` · próxima renovação ${new Date(data.usage.subscription.current_period_end).toLocaleDateString('pt-PT')}`}
          </div>
        </div>
      )}
    </div>
  );
}

function UsageTab({ data }: { data: Data }) {
  if (!data.usage) return <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">Sem dados de consumo (sem subscrição activa).</div>;
  
  const period = data.usage.period;
  const quotas = data.usage.quotas;
  const counters = period.counters || {};
  const aiCostCents = Number(counters.ai_cost_cents || 0);
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">Período actual</h3>
        <div className="text-sm text-slate-700">
          {new Date(period.start).toLocaleDateString('pt-PT')} → {new Date(period.end).toLocaleDateString('pt-PT')}
        </div>
        {aiCostCents > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Euro className="h-4 w-4 text-amber-600" />
            <span>Custo IA acumulado: <strong>{(aiCostCents / 100).toFixed(2)} EUR</strong></span>
          </div>
        )}
        {period.overage_cents > 0 && (
          <div className="mt-1 text-sm text-amber-700">Overage: {(period.overage_cents / 100).toFixed(2)} EUR</div>
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-700">Quotas vs Consumo</h3>
        {Object.entries(QUOTA_LABELS).map(([key, label]) => {
          const quota = quotas[key];
          const used = Number(counters[key] || 0);
          const isUnlimited = quota == null;
          const pct = !isUnlimited && quota && quota > 0 ? Math.min(100, (used / quota) * 100) : 0;
          const overLimit = !isUnlimited && quota != null && used > quota;
          
          return (
            <div key={key} className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <span className={`text-sm ${overLimit ? 'text-red-700 font-semibold' : 'text-slate-600'}`}>
                  {used.toLocaleString()} / {isUnlimited ? '∞' : quota?.toLocaleString()}
                </span>
              </div>
              {!isUnlimited && quota != null && (
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${overLimit ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              )}
              {overLimit && (
                <p className="text-xs text-red-700 mt-1">Excedido. Operações adicionais podem ser bloqueadas ou cobradas como overage.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BrandingTab({ data, slug }: { data: Data; slug: string }) {
  const [form, setForm] = useState({
    logo_url: data.branding?.logo_url || '',
    primary_color: data.branding?.primary_color || '#6366f1',
    accent_color: data.branding?.accent_color || '#8b5cf6',
    welcome_message: data.branding?.welcome_message || '',
    footer_message: data.branding?.footer_message || '',
  });
  const [isPending, startTransition] = useTransition();
  
  function handleSave() {
    startTransition(async () => {
      const r = await updateBrandingAction(slug, form);
      if (r.ok) toast.success('Branding actualizado');
      else toast.error(r.error || 'Falhou');
    });
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Palette className="h-4 w-4 text-brand-600" /> Identidade visual
        </h3>
        
        <Field label="URL do logo">
          <input type="url" value={form.logo_url} onChange={(e) => setForm({...form, logo_url: e.target.value})}
            placeholder="https://..." className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-400 outline-none" />
        </Field>
        
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cor primária">
            <div className="flex gap-2">
              <input type="color" value={form.primary_color} onChange={(e) => setForm({...form, primary_color: e.target.value})}
                className="h-9 w-12 rounded border border-slate-200 cursor-pointer" />
              <input type="text" value={form.primary_color} onChange={(e) => setForm({...form, primary_color: e.target.value})}
                className="flex-1 text-sm font-mono px-2 py-1.5 rounded border border-slate-200" />
            </div>
          </Field>
          <Field label="Cor de acento">
            <div className="flex gap-2">
              <input type="color" value={form.accent_color} onChange={(e) => setForm({...form, accent_color: e.target.value})}
                className="h-9 w-12 rounded border border-slate-200 cursor-pointer" />
              <input type="text" value={form.accent_color} onChange={(e) => setForm({...form, accent_color: e.target.value})}
                className="flex-1 text-sm font-mono px-2 py-1.5 rounded border border-slate-200" />
            </div>
          </Field>
        </div>
        
        <Field label="Mensagem de boas-vindas">
          <textarea rows={2} value={form.welcome_message} onChange={(e) => setForm({...form, welcome_message: e.target.value})}
            placeholder="Bem-vindo à formação Acme..." className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 resize-none" />
        </Field>
        <Field label="Mensagem de rodapé">
          <input type="text" value={form.footer_message} onChange={(e) => setForm({...form, footer_message: e.target.value})}
            className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200" />
        </Field>
      </div>
      
      <button onClick={handleSave} disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar branding
      </button>
      
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-900">
        💡 As cores serão aplicadas em todas as pages <code>/empresa/{slug}/*</code>. Sub-domínio e custom domain ficam disponíveis em planos superiores.
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-bold">{icon}{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-slate-600 block mb-1">{label}</label>{children}</div>;
}
