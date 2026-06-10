'use client';

import { useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
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

const AUDIENCE_KEY: Record<string,string> = { beginner: 'org.prop.aud_beginner', intermediate: 'org.prop.aud_intermediate', advanced: 'org.prop.aud_advanced', executive: 'org.prop.aud_executive' };
const DIFFICULTY_KEY: Record<string,string> = { easy: 'org.prop.diff_easy', medium: 'org.prop.diff_medium', hard: 'org.prop.diff_hard' };

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' });
}
function timeAgo(iso: string, t: any): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('org.prop.ago_now');
  if (mins < 60) return t('org.prop.ago_min', { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('org.prop.ago_hour', { n: hours });
  return t('org.prop.ago_day', { n: Math.floor(hours/24) });
}

export function ProposalsList({ slug, initial }: { slug: string; initial: ProposalRow[] }) {
  const t = useTranslations();
  const [items, setItems] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function refresh() {
    startTransition(async () => {
      const r = await listProposalsAction(slug);
      if (r.ok) setItems((r.data as ProposalRow[]) || []);
      else toast.error(r.error || t('tea.error'));
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-600" />
            {t('org.prop.title')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('org.prop.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={refresh} disabled={isPending} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 text-sm">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {t('org.cl.refresh')}
          </button>
          <Link href={`/empresa/${slug}/conteudos` as any} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold">
            <FileText className="h-3.5 w-3.5" />
            {t('org.prop.contents')}
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {t('org.prop.empty_p1')} <Link href={`/empresa/${slug}/conteudos` as any} className="text-brand-600 hover:underline font-medium">{t('org.prop.contents')}</Link>{t('org.prop.empty_p2')}
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
  const t = useTranslations();
  const locale = useLocale();
  return (
    <button type="button" onClick={onClick} className="w-full text-left bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all p-4 sm:p-5 group">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge status={item.status} />
            <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              {AUDIENCE_KEY[item.target_audience] ? t(AUDIENCE_KEY[item.target_audience]) : item.target_audience}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              {DIFFICULTY_KEY[item.difficulty] ? t(DIFFICULTY_KEY[item.difficulty]) : item.difficulty}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">{item.source_lang.toUpperCase()}</span>
          </div>
          <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 truncate">
            {item.proposal_title || (item.status === 'processing' || item.status === 'pending' ? t('org.prop.processing_title') : t('org.prop.untitled'))}
          </h3>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
            <span>{t('org.prop.content_count', { count: item.content_count })}</span>
            {item.proposal_modules_count > 0 && <><span>·</span><span>{t('org.prop.modules', { count: item.proposal_modules_count })}</span></>}
            <span>·</span>
            <span title={formatDate(item.created_at, locale)}>{timeAgo(item.created_at, t)}</span>
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
  const t = useTranslations();
  const map: Record<string, { labelKey: string; cls: string; icon: React.ReactNode }> = {
    pending: { labelKey: 'org.prop.st_pending', cls: 'bg-slate-100 text-slate-600', icon: <Clock className="h-2.5 w-2.5" /> },
    processing: { labelKey: 'org.prop.st_processing', cls: 'bg-blue-100 text-blue-700', icon: <Loader2 className="h-2.5 w-2.5 animate-spin" /> },
    ready_review: { labelKey: 'org.prop.st_ready_review', cls: 'bg-amber-100 text-amber-700', icon: <Eye className="h-2.5 w-2.5" /> },
    approved: { labelKey: 'org.prop.st_approved', cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="h-2.5 w-2.5" /> },
    generating: { labelKey: 'org.prop.st_generating', cls: 'bg-blue-100 text-blue-700', icon: <Loader2 className="h-2.5 w-2.5 animate-spin" /> },
    generated: { labelKey: 'org.prop.st_generated', cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="h-2.5 w-2.5" /> },
    rejected: { labelKey: 'org.prop.st_rejected', cls: 'bg-red-100 text-red-700', icon: <XCircle className="h-2.5 w-2.5" /> },
    failed: { labelKey: 'org.prop.st_failed', cls: 'bg-red-100 text-red-700', icon: <XCircle className="h-2.5 w-2.5" /> },
  };
  const meta = map[status];
  if (!meta) return (<span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1 bg-slate-100 text-slate-500">{status}</span>);
  return (
    <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${meta.cls}`}>
      {meta.icon} {t(meta.labelKey)}
    </span>
  );
}
