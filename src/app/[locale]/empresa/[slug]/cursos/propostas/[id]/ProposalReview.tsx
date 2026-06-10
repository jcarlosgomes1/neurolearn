'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link } from '@/i18n/routing';
import { 
  Sparkles, FileText, ArrowLeft, CheckCircle2, XCircle, Loader2, Clock,
  Eye, BookOpen, AlertCircle, ChevronDown, ChevronRight, Lightbulb, Target, RefreshCw
} from 'lucide-react';
import { approveProposalAction, rejectProposalAction, getProposalAction } from '../actions';

interface ProposalData {
  ok: boolean;
  proposal: {
    id: string; org_id: string; status: string;
    target_audience: string; difficulty: string; source_lang: string;
    proposal: {
      title?: string; subtitle?: string; description?: string;
      estimated_duration?: string; estimated_duration_minutes?: number;
      topics?: string[]; rationale?: string;
      modules?: Array<{
        title: string; description?: string;
        lessons?: Array<{ title: string; objective?: string; key_points?: string[]; source_docs?: string[] }>;
      }>;
    } | null;
    error_message: string | null;
    generated_course_id: string | null;
    created_at: string; updated_at: string;
  };
  contents: Array<{ id: string; name: string; mime_type: string; summary: string | null }>;
}

const AUDIENCE_KEY: Record<string,string> = { beginner: 'org.prop.aud_beginner', intermediate: 'org.prop.aud_intermediate', advanced: 'org.prop.aud_advanced', executive: 'org.prop.aud_executive' };
const DIFFICULTY_KEY: Record<string,string> = { easy: 'org.pr.diff_easy', medium: 'org.pr.diff_medium', hard: 'org.pr.diff_hard' };

export function ProposalReview({ slug, initial }: { slug: string; initial: ProposalData }) {
  const t = useTranslations();
  const [data, setData] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const router = useRouter();
  
  const p = data.proposal;
  const proposal = p.proposal;
  
  // Auto-refresh enquanto está em estado transitório
  useEffect(() => {
    if (['pending', 'processing', 'generating'].includes(p.status)) {
      const timer = setInterval(async () => {
        const r = await getProposalAction(slug, p.id);
        if (r.ok && r.data) {
          setData(r.data as ProposalData);
        }
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [p.status, p.id, slug]);
  
  function handleApprove() {
    if (!confirm(t('org.pr.approve_confirm'))) return;
    startTransition(async () => {
      const r = await approveProposalAction(slug, p.id);
      if (r.ok && r.data) {
        toast.success(t('org.pr.course_created', { id: r.data.course_id }));
        // Refresh local
        const refreshed = await getProposalAction(slug, p.id);
        if (refreshed.ok && refreshed.data) setData(refreshed.data as ProposalData);
      } else {
        toast.error(r.error || t('org.pr.approve_failed'));
      }
    });
  }
  
  function handleReject() {
    startTransition(async () => {
      const r = await rejectProposalAction(slug, p.id, rejectReason);
      if (r.ok) {
        toast.success(t('org.pr.st_rejected'));
        router.push(`/empresa/${slug}/cursos/propostas` as any);
      } else {
        toast.error(r.error || t('org.cc.ps_failed'));
      }
    });
  }
  
  const canReview = p.status === 'ready_review';
  const isTransient = ['pending', 'processing', 'generating'].includes(p.status);
  const isFinished = ['generated', 'rejected', 'failed'].includes(p.status);
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Link href={`/empresa/${slug}/cursos/propostas` as any} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> {t('org.pr.all_proposals')}
      </Link>
      
      {/* Status banner */}
      <div className={`rounded-xl border p-4 ${
        p.status === 'ready_review' ? 'bg-amber-50 border-amber-200' :
        p.status === 'generated' ? 'bg-emerald-50 border-emerald-200' :
        p.status === 'failed' || p.status === 'rejected' ? 'bg-red-50 border-red-200' :
        isTransient ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          {p.status === 'ready_review' && <><Eye className="h-5 w-5 text-amber-700" /><span className="font-semibold text-amber-900">{t('org.pr.st_ready')}</span></>}
          {p.status === 'generated' && <><CheckCircle2 className="h-5 w-5 text-emerald-700" /><span className="font-semibold text-emerald-900">{t('org.pr.st_generated')}</span></>}
          {p.status === 'rejected' && <><XCircle className="h-5 w-5 text-red-700" /><span className="font-semibold text-red-900">{t('org.pr.st_rejected')}</span></>}
          {p.status === 'failed' && <><AlertCircle className="h-5 w-5 text-red-700" /><span className="font-semibold text-red-900">{t('org.cc.ps_failed')}</span></>}
          {isTransient && <><Loader2 className="h-5 w-5 text-blue-700 animate-spin" /><span className="font-semibold text-blue-900">{p.status === 'generating' ? t('org.pr.st_generating') : t('org.pr.st_processing')}</span></>}
        </div>
        {p.error_message && <div className="mt-2 text-sm text-red-800 break-words">{p.error_message}</div>}
        {p.status === 'generated' && p.generated_course_id && (
          <div className="mt-2 text-sm text-emerald-800">
            {t('org.pr.course_id_label')} <code className="bg-white px-1.5 py-0.5 rounded">{p.generated_course_id}</code>
          </div>
        )}
        {isTransient && <div className="mt-2 text-xs text-blue-700">{t('org.pr.auto_refresh')}</div>}
      </div>
      
      {/* Configuração */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
        <h2 className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-3">{t('org.pr.config_h')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-500">{t('org.pr.audience')}</div>
            <div className="font-medium text-slate-900">{AUDIENCE_KEY[p.target_audience] ? t(AUDIENCE_KEY[p.target_audience]) : p.target_audience}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">{t('org.pr.difficulty')}</div>
            <div className="font-medium text-slate-900">{DIFFICULTY_KEY[p.difficulty] ? t(DIFFICULTY_KEY[p.difficulty]) : p.difficulty}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">{t('org.pr.language')}</div>
            <div className="font-medium text-slate-900">{p.source_lang.toUpperCase()}</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 mb-1.5">{t('org.pr.sources', { count: data.contents.length })}</div>
          <div className="flex flex-wrap gap-1.5">
            {data.contents.map((c) => (
              <span key={c.id} className="text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
                <FileText className="h-3 w-3 text-slate-400" /> {c.name}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Proposta gerada */}
      {proposal?.title ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <h2 className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{t('org.pr.proposal_h')}</h2>
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900">{proposal.title}</h1>
          {proposal.subtitle && <p className="text-base text-slate-600 mt-1">{proposal.subtitle}</p>}
          
          {proposal.description && (
            <div className="mt-4 text-sm text-slate-700 whitespace-pre-wrap">{proposal.description}</div>
          )}
          
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 flex-wrap">
            {proposal.estimated_duration && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {proposal.estimated_duration}</span>}
            <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" /> {t('org.pr.modules_count', { count: proposal.modules?.length || 0 })}</span>
            {proposal.topics && proposal.topics.length > 0 && <span className="inline-flex items-center gap-1"><Target className="h-3 w-3" /> {t('org.pr.topics_count', { count: proposal.topics.length })}</span>}
          </div>
          
          {proposal.topics && proposal.topics.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1.5">
                {proposal.topics.map((topic, i) => (
                  <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{topic}</span>
                ))}
              </div>
            </div>
          )}
          
          {proposal.rationale && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-700 mb-1">{t('org.pr.rationale_h')}</div>
                  <p className="text-sm text-amber-900">{proposal.rationale}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
      
      {/* Módulos */}
      {proposal?.modules && proposal.modules.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-700 px-1">{t('org.pr.structure_h')}</h2>
          {proposal.modules.map((mod, mIdx) => (
            <div key={mIdx} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button type="button" onClick={() => setExpandedModule(expandedModule === mIdx ? null : mIdx)}
                className="w-full p-4 text-left flex items-start gap-3 hover:bg-slate-50">
                <div className="w-7 h-7 rounded-md bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs flex-shrink-0">{mIdx + 1}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">{mod.title}</h3>
                  {mod.description && <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>}
                  <div className="text-xs text-slate-400 mt-1">{t('org.pr.lessons_count', { count: mod.lessons?.length || 0 })}</div>
                </div>
                {expandedModule === mIdx ? <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0 mt-2" /> : <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0 mt-2" />}
              </button>
              {expandedModule === mIdx && mod.lessons && mod.lessons.length > 0 && (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {mod.lessons.map((lesson, lIdx) => (
                    <div key={lIdx} className="p-4 pl-14">
                      <div className="text-sm font-medium text-slate-900">{lesson.title}</div>
                      {lesson.objective && (
                        <div className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                          <Target className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{lesson.objective}</span>
                        </div>
                      )}
                      {lesson.key_points && lesson.key_points.length > 0 && (
                        <ul className="mt-2 space-y-0.5 text-xs text-slate-600 list-disc list-inside">
                          {lesson.key_points.map((kp, i) => <li key={i}>{kp}</li>)}
                        </ul>
                      )}
                      {lesson.source_docs && lesson.source_docs.length > 0 && (
                        <div className="mt-2 text-[10px] text-slate-400">
                          {t('org.pr.lesson_source', { docs: lesson.source_docs.join(' · ') })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Acções */}
      {canReview && (
        <div className="sticky bottom-4 bg-white rounded-xl border border-slate-200 shadow-lg p-3 sm:p-4">
          {!showRejectForm ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowRejectForm(true)} disabled={isPending}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium disabled:opacity-50">
                {t('org.pr.reject')}
              </button>
              <button type="button" onClick={handleApprove} disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:opacity-90 text-white text-sm font-semibold disabled:opacity-50">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {t('org.pr.approve')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t('org.pr.reason_ph')} rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm resize-none" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowRejectForm(false)} disabled={isPending}
                  className="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm">{t('btn.cancel')}</button>
                <button type="button" onClick={handleReject} disabled={isPending}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : t('org.pr.confirm_reject')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Acessar curso gerado */}
      {p.status === 'generated' && p.generated_course_id && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-sm text-emerald-900 mb-3">{t('org.pr.generated_note')}</p>
          <Link href={`/admin/cursos` as any} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 text-sm font-semibold">
            <BookOpen className="h-4 w-4" /> {t('org.pr.view_in_admin')}
          </Link>
        </div>
      )}
    </div>
  );
}
