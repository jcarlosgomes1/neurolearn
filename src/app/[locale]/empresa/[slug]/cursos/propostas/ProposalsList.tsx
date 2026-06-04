'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import { Sparkles, FileText, Loader2, CheckCircle2, XCircle, Clock, Eye, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react';
import { listProposalsAction } from './actions';

interface ProposalRow {
  id: string;
  status: string;
  target_audience: string;
  difficulty: string;
  source_lang: string;
  proposal_title: string | null;
  proposal_modules_count: number;
  content_ids: string[];
  content_count: number;
  generated_course_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

const AUDIENCE_LABEL: Record<string,string> = { beginner: 'Iniciantes', intermediate: 'Intermédios', advanced: 'Avançados', executive: 'Executivos' };
const DIFFICULTY_LABEL: Record<string,string> = { easy: 'Curto', medium: 'Médio', hard: 'Aprofundado' };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
}
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours/24)}d`;
}

export function ProposalsList({ slug, initial }: { slug: string; initial: ProposalRow[] }) {
  const [items, setItems] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function refresh() {
    startTransition(async () => {
      const r = await listProposalsAction(slug);
      if (r.ok) setItems((r.data as ProposalRow[]) || []);
      else toast.error(r.error || 'Falhou');
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-600" />
            Propostas de curso
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cursos propostos pela IA a partir dos conteúdos da empresa. Revê, aprova ou rejeita.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={refresh} disabled={isPending} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 text-sm">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Atualizar
          </button>
          <Link href={`/empresa/${slug}/conteudos` as any} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">
            <FileText className="h-3.5 w-3.5" />
            Conteúdos
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Ainda não há propostas. Vai a <Link href={`/empresa/${slug}/conteudos` as any} className="text-brand-600 hover:underline font-medium">Conteúdos</Link>, selecciona PDFs e pede uma proposta de curso.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => <ProposalCard key={p.id} item={p} slug={slug} onClick={() => router.push(`/empresa/${slug}/cursos/propostas/${p.id}` as any)} />)}
        </div>
      )}
    </div>
  );
}

function ProposalCard({ item, slug, onClick }: { item: ProposalRow; slug: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all p-4 sm:p-5 group">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge status={item.status} />
            <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              {AUDIENCE_LABEL[item.target_audience] || item.target_audience}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              {DIFFICULTY_LABEL[item.difficulty] || item.difficulty}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">{item.source_lang.toUpperCase()}</span>
          </div>
          <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 truncate">
            {item.proposal_title || (item.status === 'processing' || item.status === 'pending' ? 'A processar…' : 'Sem título')}
          </h3>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
            <span>{item.content_count} conteúdo{item.content_count !== 1 ? 's' : ''}</span>
            {item.proposal_modules_count > 0 && <><span>·</span><span>{item.proposal_modules_count} módulos</span></>}
            <span>·</span>
            <span title={formatDate(item.created_at)}>{timeAgo(item.created_at)}</span>
          </div>
          {item.error_message && (
            <div className="mt-2 text-xs text-red-700 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {item.error_message}
            </div>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0 mt-2" />
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    pending: { label: 'Em fila', cls: 'bg-slate-100 text-slate-600', icon: <Clock className="h-2.5 w-2.5" /> },
    processing: { label: 'A processar', cls: 'bg-blue-100 text-blue-700', icon: <Loader2 className="h-2.5 w-2.5 animate-spin" /> },
    ready_review: { label: 'Aguarda revisão', cls: 'bg-amber-100 text-amber-700', icon: <Eye className="h-2.5 w-2.5" /> },
    approved: { label: 'Aprovada', cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="h-2.5 w-2.5" /> },
    generating: { label: 'A gerar curso', cls: 'bg-blue-100 text-blue-700', icon: <Loader2 className="h-2.5 w-2.5 animate-spin" /> },
    generated: { label: 'Curso pronto', cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="h-2.5 w-2.5" /> },
    rejected: { label: 'Rejeitada', cls: 'bg-red-100 text-red-700', icon: <XCircle className="h-2.5 w-2.5" /> },
    failed: { label: 'Falhou', cls: 'bg-red-100 text-red-700', icon: <XCircle className="h-2.5 w-2.5" /> },
  };
  const meta = map[status] || { label: status, cls: 'bg-slate-100 text-slate-500', icon: null };
  return (
    <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${meta.cls}`}>
      {meta.icon} {meta.label}
    </span>
  );
}
