'use client';

import { useState, useTransition, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { 
  Upload, FileText, CheckCircle2, XCircle, Loader2, Clock, 
  RefreshCw, Trash2, ChevronDown, ChevronUp, AlertCircle, Sparkles
} from 'lucide-react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';
import { registerUploadAction, retryIngestAction, archiveContentAction, listOrgContentAction } from './actions';

interface ContentRow {
  id: string;
  original_name: string;
  mime_type: string;
  file_size_bytes: number;
  extraction_status: string;
  extraction_error: string | null;
  summary: string | null;
  detected_topics: string[] | null;
  detected_skills: string[] | null;
  tags: string[] | null;
  uploader_id: string;
  created_at: string;
  extracted_at: string | null;
}

const ACCEPTED_MIME = ['application/pdf', 'text/plain', 'text/markdown'];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
}

export function ContentList({ slug, orgId, role, initial }: { slug: string; orgId: string; role: string; initial: ContentRow[] }) {
  const [items, setItems] = useState<ContentRow[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; pct: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const canUpload = ['owner', 'admin', 'editor'].includes(role);
  const canArchive = ['owner', 'admin'].includes(role);

  const refresh = useCallback(async () => {
    const result = await listOrgContentAction(slug);
    if (result.ok && result.data) setItems(result.data.content);
  }, [slug]);

  async function handleFiles(files: FileList | File[]) {
    if (!canUpload) {
      toast.error('Sem permissão para fazer upload');
      return;
    }
    
    const validFiles = Array.from(files).filter((f) => {
      if (!ACCEPTED_MIME.includes(f.type)) {
        toast.error(`${f.name}: tipo não suportado (apenas PDF, TXT, MD)`);
        return false;
      }
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name}: maior que 100MB`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    setUploading(true);
    const sb = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    for (const file of validFiles) {
      setUploadProgress({ name: file.name, pct: 0 });
      try {
        const ext = file.name.split('.').pop() || 'bin';
        const uuid = crypto.randomUUID();
        const path = `${orgId}/${uuid}.${ext}`;
        
        const { error: uploadErr } = await sb.storage.from('org-content').upload(path, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });
        
        if (uploadErr) {
          toast.error(`Upload falhou para ${file.name}: ${uploadErr.message}`);
          continue;
        }
        
        setUploadProgress({ name: file.name, pct: 90 });
        
        const result = await registerUploadAction(slug, path, file.name, file.size, file.type);
        if (!result.ok) {
          toast.error(`Registo falhou para ${file.name}: ${result.error}`);
          // Try to clean up the uploaded blob
          await sb.storage.from('org-content').remove([path]);
          continue;
        }
        
        toast.success(`${file.name} carregado · a processar…`);
      } catch (e) {
        toast.error(`Erro: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    
    setUploadProgress(null);
    setUploading(false);
    await refresh();
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (!canUpload) return;
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Conteúdos da empresa</h1>
          <p className="text-sm text-slate-500 mt-1">
            Carrega PDFs, manuais e documentos. A IA extrai automaticamente o texto, gera um resumo e identifica os tópicos e competências cobertas.
          </p>
        </div>
        <button type="button" onClick={refresh} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 text-sm">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </button>
      </div>

      {canUpload && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            disabled={uploading}
          />
          {uploading && uploadProgress ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 mx-auto text-brand-600 animate-spin" />
              <div className="text-sm font-medium text-slate-700">A carregar {uploadProgress.name}…</div>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <div className="text-sm font-semibold text-slate-700">Arrasta ficheiros aqui ou clica para escolher</div>
              <div className="text-xs text-slate-500 mt-1">PDF, TXT ou MD — máx 100MB por ficheiro</div>
            </>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Sem conteúdos ainda. {canUpload ? 'Faz upload do primeiro acima.' : 'O administrador da empresa ainda não carregou conteúdos.'}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ContentCard 
              key={item.id} 
              item={item} 
              slug={slug}
              canArchive={canArchive}
              onUpdate={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ContentCard({ item, slug, canArchive, onUpdate }: { item: ContentRow; slug: string; canArchive: boolean; onUpdate: () => Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  function handleRetry() {
    startTransition(async () => {
      const result = await retryIngestAction(slug, item.id);
      if (result.ok) {
        toast.success('Reprocessamento iniciado');
        await onUpdate();
      } else {
        toast.error(result.error || 'Falhou');
      }
    });
  }
  
  function handleArchive() {
    if (!confirm(`Arquivar "${item.original_name}"?`)) return;
    startTransition(async () => {
      const result = await archiveContentAction(slug, item.id);
      if (result.ok) {
        toast.success('Arquivado');
        await onUpdate();
      } else {
        toast.error(result.error || 'Falhou');
      }
    });
  }
  
  const hasDetails = item.summary || (item.detected_topics && item.detected_topics.length > 0) || (item.detected_skills && item.detected_skills.length > 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
              <h3 className="font-semibold text-slate-900 truncate">{item.original_name}</h3>
              <StatusBadge status={item.extraction_status} />
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
              <span>{formatBytes(item.file_size_bytes)}</span>
              <span>·</span>
              <span>{formatDate(item.created_at)}</span>
              {item.extracted_at && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> processado {formatDate(item.extracted_at)}</span>
                </>
              )}
            </div>
            {item.extraction_error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 break-words">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                <strong>Erro:</strong> {item.extraction_error}
              </div>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {item.extraction_status === 'failed' && (
              <button type="button" onClick={handleRetry} disabled={isPending} className="text-xs px-2 py-1.5 rounded-md hover:bg-blue-50 text-blue-700 disabled:opacity-50">
                <RefreshCw className={`h-3 w-3 ${isPending ? 'animate-spin' : ''}`} />
              </button>
            )}
            {hasDetails && (
              <button type="button" onClick={() => setExpanded(!expanded)} className="text-xs px-2 py-1.5 rounded-md hover:bg-slate-100 text-slate-700">
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
            {canArchive && (
              <button type="button" onClick={handleArchive} disabled={isPending} className="text-xs px-2 py-1.5 rounded-md hover:bg-red-50 text-red-600 disabled:opacity-50">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {expanded && hasDetails && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            {item.summary && (
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Resumo</div>
                <p className="text-sm text-slate-700">{item.summary}</p>
              </div>
            )}
            {item.detected_topics && item.detected_topics.length > 0 && (
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Tópicos detectados</div>
                <div className="flex flex-wrap gap-1.5">
                  {item.detected_topics.map((t, i) => (
                    <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {item.detected_skills && item.detected_skills.length > 0 && (
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Competências</div>
                <div className="flex flex-wrap gap-1.5">
                  {item.detected_skills.map((s, i) => (
                    <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
          <Clock className="h-2.5 w-2.5" /> Pendente
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
          <Loader2 className="h-2.5 w-2.5 animate-spin" /> A processar
        </span>
      );
    case 'ready':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
          <CheckCircle2 className="h-2.5 w-2.5" /> Pronto
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
          <XCircle className="h-2.5 w-2.5" /> Falhou
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
          {status}
        </span>
      );
  }
}
